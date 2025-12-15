import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { QuizService, LessonService, CourseService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const quizService = new QuizService(prisma);
const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);
const lessonService = new LessonService(prisma, courseService);

export async function GET(
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

        // Check enrollment first
        const lesson = await lessonService.getLesson(lessonId);
        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

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

        const quiz = await quizService.getQuizQuestions(lessonId);

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found for this lesson' }, { status: 404 });
        }

        // Get user's attempts
        const attempts = await quizService.getUserQuizAttempts(auth.userId, lessonId);

        return NextResponse.json({ quiz, attempts });
    } catch (error) {
        console.error('Quiz fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz' },
            { status: 500 }
        );
    }
}
