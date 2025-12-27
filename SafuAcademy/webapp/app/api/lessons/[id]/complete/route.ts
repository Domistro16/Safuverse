import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { LessonService, RelayerService, ProgressService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const progressService = new ProgressService(prisma, relayerService);

const completeLessonSchema = z.object({
    videoProgressPercent: z.number().min(0).max(100).optional(),
    timeSpentSeconds: z.number().min(0).optional(),
    quizPassed: z.boolean().optional(),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = verifyAuth(request);
        if (!auth) {
            return unauthorizedResponse();
        }

        const { id: lessonId } = await params;

        const body = await request.json();
        const data = completeLessonSchema.parse(body);

        // Get lesson to find courseId
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Check course completion using progress service
        const enrollment = await prisma.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: auth.userId,
                    courseId: lesson.courseId,
                },
            },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
        }

        // Use progressService to update watch progress and award points
        let watchResult: { saved: boolean; pointsAwarded: boolean; newTotalPoints?: number; courseProgress?: number; completed?: boolean; txHash?: string } = { saved: false, pointsAwarded: false };

        if (data.videoProgressPercent && data.videoProgressPercent >= 50) {
            watchResult = await progressService.updateLessonWatchProgress(
                auth.userId,
                lessonId,
                data.videoProgressPercent
            );
        } else {
            // Still check for course completion even if just tracking progress
            const courseCompletion = await progressService.checkAndAwardCourseCompletion(
                auth.userId,
                lesson.courseId
            );
            watchResult.completed = courseCompletion.completed;
            watchResult.txHash = courseCompletion.txHash;
        }

        return NextResponse.json({
            message: 'Lesson completed',
            pointsAwarded: watchResult.pointsAwarded,
            newTotalPoints: watchResult.newTotalPoints,
            courseCompleted: watchResult.completed,
            txHash: watchResult.txHash,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }
        console.error('Complete lesson error:', error);
        return NextResponse.json(
            { error: 'Failed to complete lesson' },
            { status: 500 }
        );
    }
}
