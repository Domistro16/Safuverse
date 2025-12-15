import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/lessons/[id]/quiz - Get quiz with correct answers
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);

        const quiz = await prisma.quiz.findUnique({
            where: { lessonId },
            include: {
                lesson: { select: { id: true, title: true, courseId: true } },
            },
        });

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
    }
}

/**
 * POST /api/admin/lessons/[id]/quiz - Create quiz
 */
export async function POST(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);

        // Verify lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Check if quiz already exists
        const existingQuiz = await prisma.quiz.findUnique({
            where: { lessonId },
        });

        if (existingQuiz) {
            return NextResponse.json({ error: 'Quiz already exists for this lesson' }, { status: 400 });
        }

        const body = await request.json();
        const { questions, passingScore = 70, bonusPoints = 20 } = body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ error: 'Questions are required' }, { status: 400 });
        }

        // Validate questions structure
        for (const q of questions) {
            if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
                return NextResponse.json(
                    { error: 'Each question must have question text and at least 2 options' },
                    { status: 400 }
                );
            }
            if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
                return NextResponse.json(
                    { error: 'Each question must have a valid correctIndex' },
                    { status: 400 }
                );
            }
        }

        const quiz = await prisma.quiz.create({
            data: {
                lessonId,
                questions,
                passingScore,
                bonusPoints,
            },
        });

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Error creating quiz:', error);
        return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/lessons/[id]/quiz - Update quiz
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);

        const existingQuiz = await prisma.quiz.findUnique({
            where: { lessonId },
        });

        if (!existingQuiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        const body = await request.json();
        const { questions, passingScore, bonusPoints } = body;

        const quiz = await prisma.quiz.update({
            where: { lessonId },
            data: {
                ...(questions && { questions }),
                ...(passingScore !== undefined && { passingScore }),
                ...(bonusPoints !== undefined && { bonusPoints }),
            },
        });

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Error updating quiz:', error);
        return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/lessons/[id]/quiz - Delete quiz
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);

        const existingQuiz = await prisma.quiz.findUnique({
            where: { lessonId },
        });

        if (!existingQuiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        await prisma.quiz.delete({ where: { lessonId } });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
    }
}
