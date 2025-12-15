import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { QuizService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const quizService = new QuizService(prisma);

const quizSubmitSchema = z.object({
    answers: z.record(z.string(), z.number()),
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
        const { answers } = quizSubmitSchema.parse(body);

        const result = await quizService.submitQuizAnswers(auth.userId, lessonId, answers);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            score: result.score,
            passed: result.passed,
            correctAnswers: result.correctAnswers,
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
