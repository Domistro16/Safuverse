import { PrismaClient } from '@prisma/client';
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

        // Get watched lessons count
        const watchedLessons = await this.prisma.userLesson.count({
            where: {
                userId,
                lesson: { courseId },
                isWatched: true,
            },
        });

        // Get passed quizzes count
        const passedQuizzes = await this.prisma.quizAttempt.groupBy({
            by: ['quizId'],
            where: {
                userId,
                isPassed: true,
                quiz: {
                    lesson: { courseId },
                },
            },
        });

        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        orderIndex: true,
                        // type: true,
                    },
                },
            },
        });

        // Get user lesson details
        const userLessons = await this.prisma.userLesson.findMany({
            where: {
                userId,
                lesson: { courseId },
            },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        orderIndex: true,
                    },
                },
            },
        });

        // Calculate stats
        // Note: totalLessons usually refers to VIDEO lessons, but prompt implies total items?
        // Let's stick to what we have.
        // Schema has `lessons Lesson[]`.

        return {
            ...userCourse,
            watchedCount: watchedLessons,
            passedQuizzesCount: passedQuizzes.length,
            totalLessons: course?.lessons?.length || 0,
            lessons: course?.lessons || [],
            userLessons,
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
            const result = await this.prisma.$transaction(async (tx: PrismaClient) => {
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
