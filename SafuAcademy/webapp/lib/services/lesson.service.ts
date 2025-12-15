import { PrismaClient, LessonType } from '@prisma/client';
import { CourseService } from './course.service';
import { getPointsConfig, WATCH_THRESHOLD_PERCENT } from '../points';

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

    /**
     * Update watch progress - awards points when 50% threshold is reached
     */
    async updateWatchProgress(
        userId: string,
        lessonId: number,
        videoProgress: number
    ): Promise<{
        userLesson: any;
        pointsAwarded: number;
        isNewlyWatched: boolean;
        courseProgress: number;
    }> {
        const lesson = await this.getLesson(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        // Check enrollment
        const enrollment = await this.prisma.userCourse.findUnique({
            where: {
                userId_courseId: { userId, courseId: lesson.courseId },
            },
        });

        if (!enrollment) {
            throw new Error('User not enrolled in this course');
        }

        // Get existing progress
        let userLesson = await this.prisma.userLesson.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
        });

        // Determine if we should award watch points
        const shouldMarkWatched = videoProgress >= WATCH_THRESHOLD_PERCENT;
        const wasAlreadyWatched = userLesson?.isWatched ?? false;
        const wasPointsAwarded = userLesson?.watchPointsAwarded ?? false;

        let pointsAwarded = 0;
        const isNewlyWatched = shouldMarkWatched && !wasAlreadyWatched;

        // Award points only if hitting threshold for first time and not already awarded
        if (isNewlyWatched && !wasPointsAwarded) {
            const pointsConfig = getPointsConfig(lesson.course.level);
            pointsAwarded = pointsConfig.watchPoints;
        }

        // Update or create user lesson
        userLesson = await this.prisma.userLesson.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: {
                userId,
                lessonId,
                videoProgress,
                isWatched: shouldMarkWatched,
                watchPointsAwarded: pointsAwarded > 0,
                startedAt: new Date(),
            },
            update: {
                videoProgress: Math.max(userLesson?.videoProgress ?? 0, videoProgress),
                isWatched: shouldMarkWatched || wasAlreadyWatched,
                watchPointsAwarded: wasPointsAwarded || pointsAwarded > 0,
            },
        });

        // Award points to user if applicable
        if (pointsAwarded > 0) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { points: { increment: pointsAwarded } },
            });

            // Also update UserCourse points earned
            await this.prisma.userCourse.update({
                where: { userId_courseId: { userId, courseId: lesson.courseId } },
                data: { pointsEarned: { increment: pointsAwarded } },
            });
        }

        // Recalculate course progress
        const courseProgress = await this.courseService.recalculateProgress(userId, lesson.courseId);

        return {
            userLesson,
            pointsAwarded,
            isNewlyWatched,
            courseProgress,
        };
    }

    /**
     * Mark lesson as completed (after both watching and passing quiz if applicable)
     */
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

        // Get current lesson progress
        const userLesson = await this.getUserLessonProgress(userId, lessonId);

        // Check if lesson is watched (50%+ threshold)
        if (!userLesson?.isWatched) {
            return { success: false, error: 'Lesson must be watched (50%+) before completing' };
        }

        // If lesson has a quiz, check if quiz was passed
        if (lesson.quiz && !data.quizPassed) {
            // Check if user has already passed the quiz
            const passedQuiz = await this.prisma.quizAttempt.findFirst({
                where: {
                    userId,
                    quiz: { lessonId },
                    passed: true,
                },
            });

            if (!passedQuiz) {
                return { success: false, error: 'Quiz must be passed to complete this lesson' };
            }
        }

        // Check if already completed
        if (userLesson.completedAt) {
            return { success: true, courseCompleted: false }; // Already completed
        }

        // Mark lesson as complete
        await this.prisma.userLesson.update({
            where: { userId_lessonId: { userId, lessonId } },
            data: {
                completedAt: new Date(),
                timeSpent: data.timeSpentSeconds || userLesson.timeSpent,
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
            }

            return { success: true, courseCompleted: true };
        }

        return { success: true, courseCompleted: false };
    }

    async updateLessonProgress(
        userId: string,
        lessonId: number,
        data: {
            timeSpent?: number;
            videoProgress?: number;
        }
    ) {
        // If videoProgress is provided, use the new updateWatchProgress method
        if (data.videoProgress !== undefined) {
            return this.updateWatchProgress(userId, lessonId, data.videoProgress);
        }

        // Otherwise just update time spent
        return this.prisma.userLesson.upsert({
            where: {
                userId_lessonId: { userId, lessonId },
            },
            create: {
                userId,
                lessonId,
                timeSpent: data.timeSpent || 0,
            },
            update: {
                timeSpent: data.timeSpent,
            },
        });
    }
}
