import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CourseService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);

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
        const courseId = parseInt(id, 10);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const progress = await courseService.getUserCourseProgress(auth.userId, courseId);

        if (!progress) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 404 });
        }

        return NextResponse.json({ progress });
    } catch (error) {
        console.error('Course progress error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}
