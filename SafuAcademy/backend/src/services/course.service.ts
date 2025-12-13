import { PrismaClient } from '@prisma/client';
import { RelayerService } from './relayer.service.js';

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

        const completedLessons = await this.prisma.userLesson.findMany({
            where: {
                userId,
                lesson: { courseId },
                completedAt: { not: null },
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

        return {
            ...userCourse,
            completedLessons: completedLessons.map(ul => ul.lesson),
            totalLessons: course?.totalLessons || 0,
            lessons: course?.lessons || [],
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

    async recalculateProgress(userId: string, courseId: number): Promise<number> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) return 0;

        const completedCount = await this.prisma.userLesson.count({
            where: {
                userId,
                lesson: { courseId },
                completedAt: { not: null },
            },
        });

        const progress = Math.floor((completedCount / course.totalLessons) * 100);

        await this.prisma.userCourse.update({
            where: {
                userId_courseId: { userId, courseId },
            },
            data: { progress },
        });

        return progress;
    }

    async calculateCoursePoints(userId: string, courseId: number): Promise<number> {
        // Sum up points from completed lessons
        const lessonPoints = await this.prisma.userLesson.findMany({
            where: {
                userId,
                lesson: { courseId },
                completedAt: { not: null },
            },
            include: {
                lesson: {
                    select: { pointsValue: true },
                },
            },
        });

        const lessonTotal = lessonPoints.reduce((sum, ul) => sum + ul.lesson.pointsValue, 0);

        // Add quiz bonus points
        const quizBonuses = await this.prisma.quizAttempt.findMany({
            where: {
                userId,
                passed: true,
                quiz: {
                    lesson: { courseId },
                },
            },
            include: {
                quiz: {
                    select: { bonusPoints: true },
                },
            },
        });

        const quizTotal = quizBonuses.reduce((sum, qa) => sum + qa.quiz.bonusPoints, 0);

        return lessonTotal + quizTotal;
    }

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
            return { success: false, error: 'Course not completed' };
        }

        if (userCourse.onChainSynced) {
            return { success: true, txHash: userCourse.txHash || undefined };
        }

        const points = await this.calculateCoursePoints(userId, courseId);

        const result = await this.relayerService.updateCourseProgress(
            userId,
            userAddress,
            courseId,
            100,
            points
        );

        if (result.success && result.txHash) {
            await this.prisma.userCourse.update({
                where: {
                    userId_courseId: { userId, courseId },
                },
                data: {
                    onChainSynced: true,
                    txHash: result.txHash,
                    pointsEarned: points,
                    completedAt: new Date(),
                },
            });

            // Update user's total points
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    points: { increment: points },
                },
            });
        }

        return result;
    }
}
