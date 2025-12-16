import { PrismaClient } from '@prisma/client';
import { ProgressService } from './progress.service';
import { RelayerService } from './relayer.service';
import { WATCH_THRESHOLD_PERCENT } from '../points';

export class LessonService {
    private prisma: PrismaClient;
    private progressService: ProgressService;

    constructor(prisma: PrismaClient, relayerService: RelayerService) {
        this.prisma = prisma;
        this.progressService = new ProgressService(prisma, relayerService);
    }

    async getLesson(lessonId: string) {
        return this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: true,
                quiz: {
                    select: {
                        id: true,
                        passingScore: true,
                        passPoints: true,
                    },
                },
            },
        });
    }

    async getUserLessonProgress(userId: string, lessonId: string) {
        return this.prisma.userLesson.findUnique({
            where: {
                userId_lessonId: { userId, lessonId },
            },
        });
    }

    async startLesson(userId: string, lessonId: string) {
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
                lastWatchedAt: new Date(),
            },
            update: {
                lastWatchedAt: new Date(),
            },
        });

        return userLesson;
    }

    /**
     * Update watch progress - awards points when 50% threshold is reached
     * Delegates to ProgressService for actual logic
     */
    async updateWatchProgress(
        userId: string,
        lessonId: string,
        videoProgress: number
    ): Promise<{
        userLesson: any;
        pointsAwarded: number;
        isNewlyWatched: boolean;
        courseProgress: number;
    }> {
        const result = await this.progressService.updateLessonWatchProgress(
            userId,
            lessonId,
            videoProgress
        );

        // Fetch the updated userLesson for response
        const userLesson = await this.prisma.userLesson.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
        });

        return {
            userLesson,
            pointsAwarded: result.pointsAwarded ? 10 : 0,
            isNewlyWatched: result.pointsAwarded,
            courseProgress: result.courseProgress || 0,
        };
    }

    async updateLessonProgress(
        userId: string,
        lessonId: string,
        data: {
            progressPercent?: number;
        }
    ) {
        // If videoProgress is provided, use the new updateWatchProgress method
        if (data.progressPercent !== undefined) {
            return this.updateWatchProgress(userId, lessonId, data.progressPercent);
        }

        // Otherwise just update lastWatchedAt
        return this.prisma.userLesson.upsert({
            where: {
                userId_lessonId: { userId, lessonId },
            },
            create: {
                userId,
                lessonId,
                lastWatchedAt: new Date(),
            },
            update: {
                lastWatchedAt: new Date(),
            },
        });
    }

    /**
     * Get lesson with user progress
     */
    async getLessonWithProgress(userId: string, lessonId: string) {
        const lesson = await this.getLesson(lessonId);
        if (!lesson) {
            return null;
        }

        const userLesson = await this.getUserLessonProgress(userId, lessonId);

        return {
            lesson: {
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                orderIndex: lesson.orderIndex,
                videoDuration: lesson.videoDuration,
                watchPoints: lesson.watchPoints,
                hasQuiz: !!lesson.quiz,
            },
            progress: userLesson
                ? {
                    watchProgressPercent: userLesson.watchProgressPercent,
                    isWatched: userLesson.isWatched,
                    watchPointsAwarded: userLesson.watchPointsAwarded,
                }
                : null,
        };
    }
}
