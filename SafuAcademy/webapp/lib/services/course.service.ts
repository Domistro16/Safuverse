import { PrismaClient, Prisma } from '@prisma/client';
import { RelayerService } from './relayer.service';
import {
    calculateEngagementTimeScore,
    isScormCompleted,
    parseCourseDurationToSeconds,
} from '../scorm/scoring';

interface CourseLesson {
    id: string;
    title: string;
    orderIndex: number;
}

interface UserLessonProgress {
    lessonId: string;
    isWatched: boolean;
}

export class CourseService {
    private prisma: PrismaClient;
    private relayerService: RelayerService;

    constructor(prisma: PrismaClient, relayerService: RelayerService) {
        this.prisma = prisma;
        this.relayerService = relayerService;
    }

    async getAllCourses() {
        return this.prisma.course.findMany({
            where: { isPublished: true },
            include: {
                _count: {
                    select: { lessons: true },
                },
            },
            orderBy: { id: 'asc' },
        });
    }

    async getCourseById(courseId: number) {
        return this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        orderIndex: true,
                        watchPoints: true,
                        videos: {
                            orderBy: { orderIndex: 'asc' },
                            select: {
                                id: true,
                                language: true,
                                label: true,
                                storageKey: true,
                                orderIndex: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async getUserCourseProgress(userId: string, courseId: number) {
        const userCourse = await this.prisma.userCourse.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });

        if (!userCourse) {
            return null;
        }

        // Get course with lessons
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        orderIndex: true,
                    },
                },
            },
        });

        if (!course) return null;

        if (course.isIncentivized) {
            const runtime = await this.prisma.scormRun.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
            });

            const scormComplete = runtime
                ? isScormCompleted(runtime.completionStatus, runtime.successStatus)
                : false;
            const progressPercent = runtime
                ? scormComplete
                    ? 100
                    : Math.min(
                          99,
                          calculateEngagementTimeScore(
                              runtime.totalTimeSeconds || 0,
                              parseCourseDurationToSeconds(course.duration)
                          )
                      )
                : 0;

            return {
                ...userCourse,
                progressPercent,
                isComplete: userCourse.isCompleted,
                isIncentivized: true,
                scormCompletionStatus: runtime?.completionStatus ?? null,
                scormSuccessStatus: runtime?.successStatus ?? null,
                scormQuizScore: runtime?.normalizedScore ?? null,
                scormTotalTimeSeconds: runtime?.totalTimeSeconds ?? 0,
                proofSigned: userCourse.proofSigned,
                dappVisitTracked: userCourse.dappVisitTracked,
                finalScore: userCourse.finalScore,
                leaderboardEligible: userCourse.leaderboardEligible,
                canClaimFinal: scormComplete && userCourse.proofSigned,
            };
        }

        // Get user lesson progress
        const userLessons = await this.prisma.userLesson.findMany({
            where: {
                userId,
                lessonId: { in: course.lessons.map((l: CourseLesson) => l.id) },
            },
        });

        const userLessonMap = new Map<string, UserLessonProgress>(
            userLessons.map((ul: { lessonId: string; isWatched: boolean }) => [
                ul.lessonId,
                ul,
            ])
        );

        const lessonProgress = course.lessons.map((lesson: CourseLesson) => {
            const userLesson = userLessonMap.get(lesson.id);
            const isWatched = userLesson?.isWatched ?? false;
            return {
                lessonId: lesson.id,
                title: lesson.title,
                orderIndex: lesson.orderIndex,
                isWatched,
                progressPercent: isWatched ? 100 : 0,
                isComplete: isWatched,
            };
        });

        const totalLessons = course.lessons.length;
        const watchedCount = lessonProgress.filter((l) => l.isWatched).length;
        const overallProgress =
            totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;
        const isComplete = totalLessons > 0 && watchedCount === totalLessons;

        return {
            ...userCourse,
            progressPercent: overallProgress,
            watchedCount,
            totalLessons,
            lessonProgress,
            isComplete,
            isIncentivized: false,
        };
    }

    async enrollInCourse(
        userId: string,
        courseId: number
    ): Promise<{
        success: boolean;
        enrolled: boolean;
        pointsSpent?: number;
        newTotalPoints?: number;
        txHash?: string;
        error?: string
    }> {
        // 1. Get User and Course
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });

        if (!user || !course) {
            return { success: false, enrolled: false, error: 'User or Course not found' };
        }

        // 2. Perform Enrollment (Transaction)
        try {
            const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Check if already enrolled (double check inside tx)
                const existing = await tx.userCourse.findUnique({
                    where: { userId_courseId: { userId, courseId } }
                });

                if (existing) {
                    return { enrollment: existing, user }; // Already enrolled
                }

                // Create enrollment record
                const enrollment = await tx.userCourse.create({
                    data: {
                        userId,
                        courseId,
                        pointsSpent: 0,
                        progressPercent: 0
                    }
                });

                const updatedUser = await tx.user.findUnique({ where: { id: userId } });
                return { enrollment, user: updatedUser };
            });

            // If we are here, DB transaction succeeded

            // 3. On-Chain Enrollment (Relayer)
            // Note: We do this AFTER DB transaction commit.
            // If it fails, we mark as not synced, but user IS enrolled in DB.
            const txResult = await this.relayerService.enrollUser(userId, user.walletAddress, courseId);

            if (txResult.success && txResult.txHash && txResult.txHash !== 'already-enrolled') {
                await this.prisma.userCourse.update({
                    where: { id: result.enrollment.id },
                    data: {
                        onChainSynced: true,
                        enrollTxHash: txResult.txHash
                    }
                });
            }

            return {
                success: true,
                enrolled: true,
                pointsSpent: 0,
                newTotalPoints: result.user?.totalPoints,
                txHash: txResult.txHash
            };

        } catch (error) {
            console.error("Enrollment error:", error);
            return { success: false, enrolled: false, error: (error as Error).message };
        }
    }
}
