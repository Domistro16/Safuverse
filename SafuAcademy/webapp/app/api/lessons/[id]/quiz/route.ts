import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { QuizService, LessonService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const quizService = new QuizService(prisma, relayerService);
const lessonService = new LessonService(prisma, relayerService);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = verifyAuth(request);
        if (!auth) {
            return unauthorizedResponse();
        }

        const { id: lessonId } = await params;

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

        // Get course info for back navigation
        const course = await prisma.course.findUnique({
            where: { id: lesson.courseId },
            select: { id: true, title: true },
        });

        return NextResponse.json({
            quiz: {
                ...quiz,
                lesson: {
                    id: lesson.id,
                    title: lesson.title,
                    courseId: lesson.courseId,
                    course: course || { id: lesson.courseId, title: 'Course' },
                },
            },
            attempts,
        });
    } catch (error) {
        console.error('Quiz fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz' },
            { status: 500 }
        );
    }
}
