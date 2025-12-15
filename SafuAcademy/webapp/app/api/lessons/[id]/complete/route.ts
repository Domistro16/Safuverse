import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { LessonService, CourseService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);
const lessonService = new LessonService(prisma, courseService);

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

        const { id } = await params;
        const lessonId = parseInt(id, 10);

        if (isNaN(lessonId)) {
            return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
        }

        const body = await request.json();
        const data = completeLessonSchema.parse(body);

        const result = await lessonService.completeLesson(
            auth.userId,
            auth.walletAddress,
            lessonId,
            data
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            message: 'Lesson completed',
            courseCompleted: result.courseCompleted,
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
