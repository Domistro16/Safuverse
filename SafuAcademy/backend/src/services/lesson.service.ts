import { PrismaClient, LessonType } from '@prisma/client';
import { CourseService } from './course.service.js';

export class LessonService {
    private prisma: PrismaClient;
    private courseService: CourseService;

    constructor(prisma: PrismaClient, courseService: CourseService) {
        this.prisma = prisma;
        this.courseService = courseService;
    }

    async getLesson(lessonId: number) {
        return this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: true,
                quiz: {
                    select: {
                        id: true,
                        passingScore: true,
                        bonusPoints: true,
                    },
                },
            },
        });
    }

    async getUserLessonProgress(userId: string, lessonId: number) {
        return this.prisma.userLesson.findUnique({
            where: {
                userId_lessonId: { userId, lessonId },
            },
        });
    }

    async startLesson(userId: string, lessonId: number) {
        const lesson = await this.getLesson(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        // Check if user is enrolled in the course
        const enrollment = await this.prisma.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: lesson.courseId,
                },
            },
        });

        if (!enrollment) {
            throw new Error('User not enrolled in this course');
        }

        // Create or update user lesson
        const userLesson = await this.prisma.userLesson.upsert({
            where: {
                userId_lessonId: { userId, lessonId },
            },
            create: {
                userId,
                lessonId,
                startedAt: new Date(),
            },
            update: {
                startedAt: new Date(),
            },
        });

        return userLesson;
    }

    async completeLesson(
        userId: string,
        userAddress: string,
        lessonId: number,
        data: {
            videoProgressPercent?: number;
            timeSpentSeconds?: number;
            quizPassed?: boolean;
        }
    ): Promise<{ success: boolean; error?: string; courseCompleted?: boolean }> {
        const lesson = await this.getLesson(lessonId);
        if (!lesson) {
            return { success: false, error: 'Lesson not found' };
        }

        // Validate completion based on lesson type
        const validationResult = this.validateCompletion(lesson.type, data, lesson.minimumTimeSeconds);
        if (!validationResult.valid) {
            return { success: false, error: validationResult.error };
        }

        // Check if already completed
        const existingProgress = await this.getUserLessonProgress(userId, lessonId);
        if (existingProgress?.completedAt) {
            return { success: true, courseCompleted: false }; // Already completed
        }

        // Mark lesson as complete
        await this.prisma.userLesson.upsert({
            where: {
                userId_lessonId: { userId, lessonId },
            },
            create: {
                userId,
                lessonId,
                startedAt: new Date(),
                completedAt: new Date(),
                timeSpent: data.timeSpentSeconds || 0,
                videoProgress: data.videoProgressPercent || 0,
            },
            update: {
                completedAt: new Date(),
                timeSpent: data.timeSpentSeconds || 0,
                videoProgress: data.videoProgressPercent || 0,
            },
        });

        // Recalculate course progress
        const newProgress = await this.courseService.recalculateProgress(userId, lesson.courseId);

        // If course is 100% complete, sync to blockchain
        if (newProgress === 100) {
            const syncResult = await this.courseService.syncCourseCompletion(
                userId,
                userAddress,
                lesson.courseId
            );

            if (!syncResult.success) {
                console.error('Blockchain sync failed:', syncResult.error);
                // Don't fail the completion - lesson is still marked complete
            }

            return { success: true, courseCompleted: true };
        }

        return { success: true, courseCompleted: false };
    }

    private validateCompletion(
        type: LessonType,
        data: {
            videoProgressPercent?: number;
            timeSpentSeconds?: number;
            quizPassed?: boolean;
        },
        minimumTimeSeconds: number
    ): { valid: boolean; error?: string } {
        switch (type) {
            case 'VIDEO':
                if (!data.videoProgressPercent || data.videoProgressPercent < 90) {
                    return {
                        valid: false,
                        error: 'Video must be watched at least 90% to complete',
                    };
                }
                break;

            case 'READING':
                if (!data.timeSpentSeconds || data.timeSpentSeconds < minimumTimeSeconds) {
                    return {
                        valid: false,
                        error: `Minimum reading time of ${minimumTimeSeconds} seconds required`,
                    };
                }
                break;

            case 'QUIZ':
                if (!data.quizPassed) {
                    return {
                        valid: false,
                        error: 'Quiz must be passed to complete this lesson',
                    };
                }
                break;
        }

        return { valid: true };
    }

    async updateLessonProgress(
        userId: string,
        lessonId: number,
        data: {
            timeSpent?: number;
            videoProgress?: number;
        }
    ) {
        return this.prisma.userLesson.upsert({
            where: {
                userId_lessonId: { userId, lessonId },
            },
            create: {
                userId,
                lessonId,
                timeSpent: data.timeSpent || 0,
                videoProgress: data.videoProgress || 0,
            },
            update: {
                timeSpent: data.timeSpent,
                videoProgress: data.videoProgress,
            },
        });
    }
}
