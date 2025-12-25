import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/courses/[id]/enrollment-status
 * Check if the current user is enrolled in the course (database check)
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const auth = verifyAuth(request);
    if (!auth) {
        return unauthorizedResponse();
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const enrollment = await prisma.userCourse.findUnique({
            where: {
                userId_courseId: { userId: auth.userId, courseId },
            },
        });

        return NextResponse.json({
            enrolled: !!enrollment,
            enrolledAt: enrollment?.createdAt || null,
            progressPercent: enrollment?.progressPercent || 0,
        });
    } catch (error) {
        console.error('Error checking enrollment status:', error);
        return NextResponse.json(
            { error: 'Failed to check enrollment status' },
            { status: 500 }
        );
    }
}
