import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { QuizService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const quizService = new QuizService(prisma, relayerService);

const quizSubmitSchema = z.object({
    answers: z.array(z.number()), // Array of selected indices
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
        const { answers } = quizSubmitSchema.parse(body);

        const result = await quizService.submitQuizAnswers(auth.userId, lessonId, answers);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            scorePercent: result.scorePercent,
            passed: result.passed,
            correctIndices: result.correctIndices,
            pointsAwarded: result.pointsAwarded,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }
        console.error('Quiz submit error:', error);
        return NextResponse.json(
            { error: 'Failed to submit quiz' },
            { status: 500 }
        );
    }
}
