import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { LessonService, CourseService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);
const lessonService = new LessonService(prisma, courseService);

const progressUpdateSchema = z.object({
    timeSpent: z.number().min(0).optional(),
    videoProgress: z.number().min(0).max(100).optional(),
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

        const { id } = await params;
        const lessonId = parseInt(id, 10);

        if (isNaN(lessonId)) {
            return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
        }

        const body = await request.json();
        const data = progressUpdateSchema.parse(body);

        // If video progress is provided, use the new watch progress method
        if (data.videoProgress !== undefined) {
            const result = await lessonService.updateWatchProgress(
                auth.userId,
                lessonId,
                data.videoProgress
            );

            return NextResponse.json({
                userLesson: result.userLesson,
                pointsAwarded: result.pointsAwarded,
                isNewlyWatched: result.isNewlyWatched,
                courseProgress: result.courseProgress,
            });
        }

        // Otherwise just update time spent
        const userLesson = await lessonService.updateLessonProgress(
            auth.userId,
            lessonId,
            data
        );

        return NextResponse.json({ userLesson });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }
        console.error('Update progress error:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to update progress' },
            { status: 500 }
        );
    }
}
