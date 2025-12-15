import { PrismaClient } from '@prisma/client';
import { RelayerService } from './relayer.service';
import { getPointsConfig } from '../points';

export class CourseService {
    private prisma: PrismaClient;
    private relayerService: RelayerService;

    constructor(prisma: PrismaClient, relayerService: RelayerService) {
        this.prisma = prisma;
        this.relayerService = relayerService;
    }

    async getAllCourses() {
        return this.prisma.course.findMany({
            where: { isActive: true },
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
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        order: true,
                        type: true,
                        estimatedMinutes: true,
                        pointsValue: true,
                        quiz: {
                            select: {
                                id: true,
                                passingScore: true,
                                bonusPoints: true,
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
                passed: true,
                quiz: {
                    lesson: { courseId },
                },
            },
        });

        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        type: true,
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
                        order: true,
                    },
                },
            },
        });

        return {
            ...userCourse,
            watchedCount: watchedLessons,
            passedQuizzesCount: passedQuizzes.length,
            totalLessons: course?.totalLessons || 0,
            lessons: course?.lessons || [],
            userLessons,
        };
    }

    async enrollUser(
        userId: string,
        userAddress: string,
        courseId: number
    ): Promise<{ success: boolean; error?: string }> {
        // Check if course exists
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        // Check if already enrolled
        const existingEnrollment = await this.prisma.userCourse.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });

        if (existingEnrollment) {
            return { success: true }; // Already enrolled, not an error
        }

        // Create enrollment in database
        await this.prisma.userCourse.create({
            data: {
                userId,
                courseId,
                progress: 0,
                pointsEarned: 0,
            },
        });

        // Call smart contract to enroll
        const result = await this.relayerService.enrollUser(userId, userAddress, courseId);

        if (!result.success) {
            console.error('Blockchain enrollment failed:', result.error);
            // Don't fail the enrollment - user is still enrolled in DB
            // They can retry blockchain sync later
        } else if (result.txHash && result.txHash !== 'already-enrolled') {
            await this.prisma.userCourse.update({
                where: {
                    userId_courseId: { userId, courseId },
                },
                data: {
                    onChainSynced: true,
                    txHash: result.txHash,
                },
            });
        }

        return { success: true };
    }

    /**
     * Recalculate course progress based on watched lessons and passed quizzes
     * Progress = (watched lessons + passed quizzes) / (total lessons * 2) * 100
     */
    async recalculateProgress(userId: string, courseId: number): Promise<number> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
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

        // Count unique passed quizzes (user might attempt multiple times)
        const passedQuizzes = await this.prisma.quizAttempt.groupBy({
            by: ['quizId'],
            where: {
                userId,
                passed: true,
                quiz: {
                    lesson: { courseId },
                },
            },
        });

        const passedQuizzesCount = passedQuizzes.length;

        // Progress = (watched + passed quizzes) / (totalLessons * 2) * 100
        // Each lesson has 2 steps: watch + quiz
        const totalSteps = course.totalLessons * 2;
        const completedSteps = watchedCount + passedQuizzesCount;
        const progress = totalSteps > 0 ? Math.floor((completedSteps / totalSteps) * 100) : 0;

        await this.prisma.userCourse.update({
            where: {
                userId_courseId: { userId, courseId },
            },
            data: { progress },
        });

        return progress;
    }

    /**
     * Calculate total course points (watch points + quiz points)
     */
    async calculateCoursePoints(userId: string, courseId: number): Promise<number> {
        const userCourse = await this.prisma.userCourse.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        return userCourse?.pointsEarned || 0;
    }

    /**
     * Sync course completion to blockchain - only when 100% complete
     * Includes completion bonus based on course level
     */
    async syncCourseCompletion(
        userId: string,
        userAddress: string,
        courseId: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        const userCourse = await this.prisma.userCourse.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });

        if (!userCourse || userCourse.progress !== 100) {
            return { success: false, error: 'Course not completed (progress must be 100%)' };
        }

        if (userCourse.onChainSynced) {
            return { success: true, txHash: userCourse.txHash || undefined };
        }

        // Get course for level-based completion bonus
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        // Calculate total points including completion bonus
        const pointsConfig = getPointsConfig(course.level);
        const earnedPoints = userCourse.pointsEarned;
        const completionBonus = pointsConfig.completionBonus;
        const totalPoints = earnedPoints + completionBonus;

        // Call blockchain
        const result = await this.relayerService.updateCourseProgress(
            userId,
            userAddress,
            courseId,
            100,
            totalPoints
        );

        if (result.success && result.txHash) {
            // Update database with completion info
            await this.prisma.userCourse.update({
                where: {
                    userId_courseId: { userId, courseId },
                },
                data: {
                    onChainSynced: true,
                    txHash: result.txHash,
                    pointsEarned: totalPoints, // Include completion bonus
                    completedAt: new Date(),
                },
            });

            // Add completion bonus to user's total points
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    points: { increment: completionBonus },
                },
            });
        }

        return result;
    }
}
