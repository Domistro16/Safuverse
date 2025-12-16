import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { LessonService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const lessonService = new LessonService(prisma, relayerService);

const progressUpdateSchema = z.object({
    progressPercent: z.number().min(0).max(100),
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
        const data = progressUpdateSchema.parse(body);

        const result = await lessonService.updateWatchProgress(
            auth.userId,
            lessonId,
            data.progressPercent
        );

        return NextResponse.json({
            saved: true,
            pointsAwarded: result.pointsAwarded > 0,
            newTotalPoints: undefined, // Could fetch from user if needed
            courseProgress: result.courseProgress,
        });
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
