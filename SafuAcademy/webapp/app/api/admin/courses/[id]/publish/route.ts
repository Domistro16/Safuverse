import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/courses/[id]/publish - Publish/unpublish a course
 */
export async function POST(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { _count: { select: { lessons: true } } },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Require at least one lesson to publish
        if (!course.isPublished && course._count.lessons === 0) {
            return NextResponse.json(
                { error: 'Cannot publish course with no lessons' },
                { status: 400 }
            );
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: { isPublished: !course.isPublished },
        });

        return NextResponse.json({
            published: updatedCourse.isPublished,
            course: updatedCourse,
        });
    } catch (error) {
        console.error('Error publishing course:', error);
        return NextResponse.json({ error: 'Failed to publish course' }, { status: 500 });
    }
}
