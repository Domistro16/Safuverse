import { PrismaClient, Prisma } from '@prisma/client';
import { RelayerService } from './relayer.service';

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
                    orderBy: { orderIndex: 'asc' }, // Updated to orderIndex
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        orderIndex: true, // Updated to orderIndex
                        // type: true, // Removed as LessonType might not be in schema anymore or not needed
                        // estimatedMinutes: true, // Removed unless added to schema
                        // pointsValue: true, // Removed
                        watchPoints: true, // Added
                        quiz: {
                            select: {
                                id: true,
                                passingScore: true,
                                passPoints: true, // Updated from bonusPoints to passPoints
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

        // Get course with lessons and quizzes
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    include: { quiz: true },
                },
            },
        });

        if (!course) return null;

        // Get user lesson progress
        const userLessons = await this.prisma.userLesson.findMany({
            where: {
                userId,
                lessonId: { in: course.lessons.map(l => l.id) },
            },
        });

        const userLessonMap = new Map(userLessons.map(ul => [ul.lessonId, ul]));

        // Calculate progress with quiz-based logic:
        // - Lessons without quiz: 100% when watched
        // - Lessons with quiz: 50% watched + 50% quiz passed
        let totalParts = 0;  // Total progress parts for all lessons
        let completedParts = 0;  // Completed progress parts

        const lessonProgress = course.lessons.map(lesson => {
            const userLesson = userLessonMap.get(lesson.id);
            const hasQuiz = !!lesson.quiz;
            const isWatched = userLesson?.isWatched ?? false;
            const quizPassed = userLesson?.quizPassed ?? false;

            // Each lesson contributes:
            // - Without quiz: 1 part (video only)
            // - With quiz: 2 parts (video + quiz, each 0.5)
            const lessonParts = hasQuiz ? 2 : 1;
            totalParts += lessonParts;

            let lessonCompleted = 0;
            if (isWatched) {
                lessonCompleted += 1; // Video watched = 1 part
            }
            if (hasQuiz && quizPassed) {
                lessonCompleted += 1; // Quiz passed = 1 part
            }
            completedParts += lessonCompleted;

            // Calculate lesson percentage
            const lessonPercent = (lessonCompleted / lessonParts) * 100;

            return {
                lessonId: lesson.id,
                title: lesson.title,
                orderIndex: lesson.orderIndex,
                hasQuiz,
                isWatched,
                quizPassed: hasQuiz ? quizPassed : null,
                progressPercent: Math.round(lessonPercent),
                isComplete: lessonCompleted === lessonParts,
            };
        });

        // Calculate overall progress percentage
        const overallProgress = totalParts > 0
            ? Math.round((completedParts / totalParts) * 100)
            : 0;

        const watchedCount = lessonProgress.filter(l => l.isWatched).length;
        const quizPassedCount = lessonProgress.filter(l => l.quizPassed === true).length;
        const isComplete = completedParts === totalParts && totalParts > 0;

        return {
            ...userCourse,
            progressPercent: overallProgress,
            watchedCount,
            quizPassedCount,
            totalLessons: course.lessons.length,
            lessonsWithQuiz: lessonProgress.filter(l => l.hasQuiz).length,
            lessonProgress,
            isComplete,
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

        // 2. Check Enrollment Requirements

        // CHECK 1: Access requirement (ADVANCED courses)
        // User must HAVE enough points, but they are NOT deducted
        if (course.minPointsToAccess > 0) {
            if (user.totalPoints < course.minPointsToAccess) {
                return {
                    success: false,
                    enrolled: false,
                    error: `Insufficient points to access. Required: ${course.minPointsToAccess}, Available: ${user.totalPoints}`
                };
            }
        }

        // CHECK 2: Cost requirement (PREMIUM courses)
        // User must PAY this amount
        if (course.enrollmentCost > 0) {
            if (user.totalPoints < course.enrollmentCost) {
                return {
                    success: false,
                    enrolled: false,
                    error: `Insufficient points to pay enrollment. Cost: ${course.enrollmentCost}, Available: ${user.totalPoints}`
                };
            }
        }

        // 3. Perform Enrollment (Transaction)
        try {
            const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Check if already enrolled (double check inside tx)
                const existing = await tx.userCourse.findUnique({
                    where: { userId_courseId: { userId, courseId } }
                });

                if (existing) {
                    return { enrollment: existing, user }; // Already enrolled
                }

                // Deduct cost if applicable
                if (course.enrollmentCost > 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { totalPoints: { decrement: course.enrollmentCost } }
                    });
                }

                // Create enrollment record
                const enrollment = await tx.userCourse.create({
                    data: {
                        userId,
                        courseId,
                        pointsSpent: course.enrollmentCost,
                        progressPercent: 0
                    }
                });

                const updatedUser = await tx.user.findUnique({ where: { id: userId } });
                return { enrollment, user: updatedUser };
            });

            // If we are here, DB transaction succeeded

            // 4. On-Chain Enrollment (Relayer)
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
                pointsSpent: course.enrollmentCost,
                newTotalPoints: result.user?.totalPoints,
                txHash: txResult.txHash
            };

        } catch (error) {
            console.error("Enrollment error:", error);
            return { success: false, enrolled: false, error: (error as Error).message };
        }
    }
}
