import { PrismaClient } from '@prisma/client';
import { RelayerService } from './relayer.service';
import {
    buildCompletionFlags,
    calculateBaseScore,
    calculateEngagementTimeScore,
    calculateFinalScore,
    getActionBoostMultiplier,
    isScormCompleted,
    parseCourseDurationToSeconds,
} from '../scorm/scoring';

export class ProgressService {
    private prisma: PrismaClient;
    private relayerService: RelayerService;

    constructor(prisma: PrismaClient, relayerService: RelayerService) {
        this.prisma = prisma;
        this.relayerService = relayerService;
    }

    async recalculateProgress(userId: string, courseId: number): Promise<number> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: { lessons: true },
        });

        if (!course) return 0;

        let progress = 0;

        if (course.isIncentivized) {
            const runtime = await this.prisma.scormRun.findUnique({
                where: { userId_courseId: { userId, courseId } },
            });

            const durationSeconds = parseCourseDurationToSeconds(course.duration);
            const isComplete = runtime
                ? isScormCompleted(runtime.completionStatus, runtime.successStatus)
                : false;

            progress = isComplete
                ? 100
                : runtime
                ? Math.min(
                      99,
                      calculateEngagementTimeScore(
                          runtime.totalTimeSeconds || 0,
                          durationSeconds
                      )
                  )
                : 0;
        } else {
            const watchedCount = await this.prisma.userLesson.count({
                where: {
                    userId,
                    lesson: { courseId },
                    isWatched: true,
                },
            });

            const totalLessons = course.lessons.length;
            progress = totalLessons > 0 ? Math.floor((watchedCount / totalLessons) * 100) : 0;
        }

        await this.prisma.userCourse.update({
            where: { userId_courseId: { userId, courseId } },
            data: { progressPercent: progress },
        });

        return progress;
    }

    async updateLessonWatchProgress(
        userId: string,
        lessonId: string,
        progressPercent: number
    ): Promise<{
        saved: boolean;
        pointsAwarded: boolean;
        newTotalPoints?: number;
        courseProgress?: number;
        completed?: boolean;
        txHash?: string;
    }> {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    select: {
                        id: true,
                        isIncentivized: true,
                    },
                },
            },
        });

        if (!lesson) throw new Error('Lesson not found');

        await this.prisma.userLesson.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: {
                userId,
                lessonId,
                watchProgressPercent: progressPercent,
                isWatched: progressPercent >= 50,
                watchedAt: progressPercent >= 50 ? new Date() : null,
                lastWatchedAt: new Date(),
            },
            update: {
                watchProgressPercent: progressPercent,
                isWatched: progressPercent >= 50,
                watchedAt: progressPercent >= 50 ? new Date() : null,
                lastWatchedAt: new Date(),
            },
        });

        const courseProgress = await this.recalculateProgress(userId, lesson.courseId);

        if (lesson.course.isIncentivized) {
            return {
                saved: true,
                pointsAwarded: false,
                courseProgress,
                completed: false,
            };
        }

        let completionResult: { completed: boolean; txHash?: string } = { completed: false };
        if (courseProgress >= 100) {
            completionResult = await this.checkAndCompleteCourse(userId, lesson.courseId);
        }

        return {
            saved: true,
            pointsAwarded: false,
            courseProgress,
            completed: completionResult.completed,
            txHash: completionResult.txHash,
        };
    }

    async checkAndCompleteCourse(
        userId: string,
        courseId: number
    ): Promise<{ completed: boolean; txHash?: string }> {
        const userCourse = await this.prisma.userCourse.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: {
                course: {
                    select: {
                        isIncentivized: true,
                    },
                },
            },
        });

        if (!userCourse) {
            return { completed: false };
        }

        if (userCourse.isCompleted) {
            return { completed: true, txHash: userCourse.completionTxHash || undefined };
        }

        if (userCourse.course.isIncentivized) {
            return { completed: false };
        }

        if (userCourse.progressPercent < 100) {
            return { completed: false };
        }

        await this.prisma.userCourse.update({
            where: { userId_courseId: { userId, courseId } },
            data: {
                isCompleted: true,
                completedAt: new Date(),
                completionPointsAwarded: true,
                engagementTimeScore: null,
                baseScore: null,
                finalScore: 0,
                leaderboardEligible: false,
                completionFlags: 0,
            },
        });

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const txResult = await this.relayerService.completeCourse(
            userId,
            user.walletAddress,
            courseId,
            0,
            0
        );

        if (txResult.success && txResult.txHash) {
            await this.prisma.userCourse.update({
                where: { userId_courseId: { userId, courseId } },
                data: {
                    onChainCompletionSynced: true,
                    completionTxHash: txResult.txHash,
                },
            });
        }

        return { completed: true, txHash: txResult.txHash };
    }

    async finalizeIncentivizedCourse(
        userId: string,
        courseId: number
    ): Promise<{
        completed: boolean;
        finalScore?: number;
        leaderboardEligible?: boolean;
        txHash?: string;
        error?: string;
    }> {
        const enrollment = await this.prisma.userCourse.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: {
                course: true,
                user: true,
            },
        });

        if (!enrollment) {
            return { completed: false, error: 'Not enrolled in this course' };
        }

        if (!enrollment.course.isIncentivized) {
            return { completed: false, error: 'Course is not incentivized' };
        }

        if (enrollment.isCompleted) {
            return {
                completed: true,
                finalScore: enrollment.finalScore,
                leaderboardEligible: enrollment.leaderboardEligible,
                txHash: enrollment.completionTxHash || undefined,
            };
        }

        const runtime = await this.prisma.scormRun.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (!runtime) {
            return { completed: false, error: 'No SCORM runtime found' };
        }

        const scormComplete = isScormCompleted(runtime.completionStatus, runtime.successStatus);
        if (!scormComplete) {
            return { completed: false, error: 'SCORM completion not reached' };
        }

        if (runtime.normalizedScore === null || runtime.normalizedScore === undefined) {
            return { completed: false, error: 'SCORM quiz score is unavailable' };
        }

        if (!enrollment.proofSigned) {
            return { completed: false, error: 'Signature proof is required' };
        }

        const quizScore = runtime.normalizedScore;
        const durationSeconds = parseCourseDurationToSeconds(enrollment.course.duration);
        const engagementTimeScore = calculateEngagementTimeScore(
            runtime.totalTimeSeconds || 0,
            durationSeconds
        );
        const baseScore = calculateBaseScore(quizScore, engagementTimeScore);
        const actionMultiplier = getActionBoostMultiplier(
            enrollment.proofSigned,
            enrollment.dappVisitTracked
        );
        const idMultiplier = await this.getIdMultiplier(enrollment.user.walletAddress);
        const finalScore = calculateFinalScore(baseScore, actionMultiplier, idMultiplier);
        const leaderboardEligible = enrollment.proofSigned && scormComplete;
        const completionFlags = buildCompletionFlags(
            enrollment.proofSigned,
            enrollment.dappVisitTracked,
            scormComplete
        );

        await this.prisma.$transaction([
            this.prisma.userCourse.update({
                where: { userId_courseId: { userId, courseId } },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    completionPointsAwarded: true,
                    engagementTimeScore,
                    baseScore,
                    actionBoostMultiplier: actionMultiplier,
                    idMultiplier,
                    finalScore,
                    leaderboardEligible,
                    completionFlags,
                },
            }),
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    totalPoints: {
                        increment: finalScore,
                    },
                },
            }),
        ]);

        const txResult = await this.relayerService.completeCourse(
            userId,
            enrollment.user.walletAddress,
            courseId,
            finalScore,
            completionFlags
        );

        if (txResult.success && txResult.txHash) {
            await this.prisma.userCourse.update({
                where: { userId_courseId: { userId, courseId } },
                data: {
                    onChainCompletionSynced: true,
                    completionTxHash: txResult.txHash,
                },
            });
        }

        return {
            completed: true,
            finalScore,
            leaderboardEligible,
            txHash: txResult.txHash,
        };
    }

    async checkAndAwardCourseCompletion(
        userId: string,
        courseId: number
    ): Promise<{ completed: boolean; txHash?: string }> {
        return this.checkAndCompleteCourse(userId, courseId);
    }

    async retrySyncCompletion(
        userId: string,
        courseId: number
    ): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
        alreadySynced?: boolean;
    }> {
        const userCourse = await this.prisma.userCourse.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (!userCourse) {
            return { success: false, error: 'Not enrolled in this course' };
        }

        if (!userCourse.isCompleted) {
            return { success: false, error: 'Course is not completed yet' };
        }

        if (userCourse.onChainCompletionSynced) {
            return {
                success: true,
                alreadySynced: true,
                txHash: userCourse.completionTxHash ?? undefined,
            };
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const txResult = await this.relayerService.completeCourse(
            userId,
            user.walletAddress,
            courseId,
            userCourse.finalScore || 0,
            userCourse.completionFlags || 0
        );

        if (txResult.success && txResult.txHash) {
            await this.prisma.userCourse.update({
                where: { userId_courseId: { userId, courseId } },
                data: {
                    onChainCompletionSynced: true,
                    completionTxHash: txResult.txHash,
                },
            });
            return { success: true, txHash: txResult.txHash };
        }

        return { success: false, error: txResult.error || 'Blockchain sync failed' };
    }

    private async getIdMultiplier(_walletAddress: string): Promise<number> {
        return 1;
    }
}
