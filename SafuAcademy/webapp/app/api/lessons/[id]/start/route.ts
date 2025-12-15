import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LessonService, CourseService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);
const lessonService = new LessonService(prisma, courseService);

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

        const userLesson = await lessonService.startLesson(auth.userId, lessonId);

        return NextResponse.json({
            message: 'Lesson started',
            userLesson,
        });
    } catch (error) {
        console.error('Start lesson error:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
}
