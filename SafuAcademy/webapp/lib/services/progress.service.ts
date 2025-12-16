import { PrismaClient } from '@prisma/client';
import { RelayerService } from './relayer.service';

export class ProgressService {
    private prisma: PrismaClient;
    private relayerService: RelayerService;

    constructor(prisma: PrismaClient, relayerService: RelayerService) {
        this.prisma = prisma;
        this.relayerService = relayerService;
    }

    /**
     * Recalculate course progress based on watched lessons and passed quizzes
     * Progress = (watched lessons + passed quizzes) / (total lessons + total quizzes) * 100
     */
    async recalculateProgress(userId: string, courseId: number): Promise<number> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    include: { quiz: true }
                }
            }
        });

        if (!course) return 0;

        // Count watched lessons
        const watchedCount = await this.prisma.userLesson.count({
            where: {
                userId,
                lesson: { courseId },
                isWatched: true,
            },
        });

        // Get quiz IDs for this course
        const quizIds = course.lessons
            .filter((l: { quiz: { id: string } | null }) => l.quiz)
            .map((l: { quiz: { id: string } | null }) => l.quiz!.id);

        // Count passed quizzes (distinct quizzes passed)
        const passedQuizCount = await this.prisma.quizAttempt.findMany({
            where: {
                userId,
                quizId: { in: quizIds },
                isPassed: true
            },
            distinct: ['quizId'],
            select: { id: true }
        });

        const totalItems = course.lessons.length + quizIds.length;
        const completedItems = watchedCount + passedQuizCount.length;
        const progress = totalItems > 0 ? Math.floor((completedItems / totalItems) * 100) : 0;

        await this.prisma.userCourse.update({
            where: {
                userId_courseId: { userId, courseId },
            },
            data: { progressPercent: progress },
        });

        return progress;
    }

    /**
     * Update watch progress for a lesson
     */
    async updateLessonWatchProgress(userId: string, lessonId: string, progressPercent: number): Promise<{
        saved: boolean;
        pointsAwarded: boolean;
        newTotalPoints?: number;
        courseProgress?: number;
        completed?: boolean;
        txHash?: string;
    }> {
        // Get lesson to find courseId
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId }
        });
        if (!lesson) throw new Error('Lesson not found');

        let pointsAwarded = false;
        let newTotalPoints: number | undefined;

        // Transaction to update progress and potentially award points
        await this.prisma.$transaction(async (tx: PrismaClient) => {
            // First, try to get existing userLesson
            const existingUserLesson = await tx.userLesson.findUnique({
                where: { userId_lessonId: { userId, lessonId } }
            });

            const isAlreadyWatched = existingUserLesson?.isWatched ?? false;
            const pointsAlreadyAwarded = existingUserLesson?.watchPointsAwarded ?? false;

            // Upsert userLesson
            await tx.userLesson.upsert({
                where: { userId_lessonId: { userId, lessonId } },
                create: {
                    userId,
                    lessonId,
                    watchProgressPercent: progressPercent,
                    lastWatchedAt: new Date()
                },
                update: {
                    watchProgressPercent: Math.max(existingUserLesson?.watchProgressPercent ?? 0, progressPercent),
                    lastWatchedAt: new Date()
                }
            });

            // Check if >= 50% video watched (Prompt rule)
            if (progressPercent >= 50 && !isAlreadyWatched) {
                // Mark as watched
                await tx.userLesson.update({
                    where: { userId_lessonId: { userId, lessonId } },
                    data: {
                        isWatched: true,
                        watchedAt: new Date()
                    }
                });

                // Award points if not already awarded
                if (!pointsAlreadyAwarded) {
                    await tx.userLesson.update({
                        where: { userId_lessonId: { userId, lessonId } },
                        data: { watchPointsAwarded: true }
                    });

                    const user = await tx.user.update({
                        where: { id: userId },
                        data: { totalPoints: { increment: lesson.watchPoints } }
                    });

                    pointsAwarded = true;
                    newTotalPoints = user.totalPoints;
                }
            }
        });

        // Recalculate course progress
        const courseProgress = await this.recalculateProgress(userId, lesson.courseId);

        let completionResult: { completed: boolean; txHash?: string } = { completed: false };
        if (courseProgress === 100) {
            completionResult = await this.checkAndCompleteCourse(userId, lesson.courseId);
        }

        return {
            saved: true,
            pointsAwarded,
            newTotalPoints,
            courseProgress,
            completed: completionResult.completed,
            txHash: completionResult.txHash
        };
    }

    /**
     * Check and Complete Course
     */
    async checkAndCompleteCourse(userId: string, courseId: number): Promise<{ completed: boolean; txHash?: string }> {
        const userCourse = await this.prisma.userCourse.findUnique({
            where: { userId_courseId: { userId, courseId } }
        });

        if (!userCourse || userCourse.isCompleted) {
            return { completed: !!userCourse?.isCompleted };
        }

        // Double check progress is 100 (which it should be if called after recalculate)
        if (userCourse.progressPercent < 100) {
            return { completed: false };
        }

        // Get course for completion points
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new Error('Course not found');

        // Award completion points if not already
        if (!userCourse.completionPointsAwarded) {
            await this.prisma.$transaction([
                this.prisma.userCourse.update({
                    where: { userId_courseId: { userId, courseId } },
                    data: {
                        isCompleted: true,
                        completedAt: new Date(),
                        completionPointsAwarded: true
                    }
                }),
                this.prisma.user.update({
                    where: { id: userId },
                    data: { totalPoints: { increment: course.completionPoints } }
                })
            ]);
        }

        // Sync to Blockchain
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const txResult = await this.relayerService.completeCourse(
            userId,
            user.walletAddress,
            courseId,
            user.totalPoints
        );

        if (txResult.success && txResult.txHash) {
            await this.prisma.userCourse.update({
                where: { userId_courseId: { userId, courseId } },
                data: {
                    onChainCompletionSynced: true,
                    completionTxHash: txResult.txHash
                }
            });
        }

        return { completed: true, txHash: txResult.txHash };
    }

    /**
     * Alias for checkAndCompleteCourse (for API compatibility)
     */
    async checkAndAwardCourseCompletion(userId: string, courseId: number): Promise<{ completed: boolean; txHash?: string }> {
        return this.checkAndCompleteCourse(userId, courseId);
    }
}
