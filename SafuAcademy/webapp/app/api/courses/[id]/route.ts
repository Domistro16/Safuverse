import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CourseService, RelayerService } from '@/lib/services';
import { verifyAuth } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const courseId = parseInt(id, 10);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const course = await courseService.getCourseById(courseId);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const auth = verifyAuth(request);
        let enrollment = null;

        if (auth) {
            enrollment = await prisma.userCourse.findUnique({
                where: {
                    userId_courseId: {
                        userId: auth.userId,
                        courseId,
                    },
                },
            });
        }

        return NextResponse.json({ course, enrollment });
    } catch (error) {
        console.error('Course fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch course' },
            { status: 500 }
        );
    }
}
