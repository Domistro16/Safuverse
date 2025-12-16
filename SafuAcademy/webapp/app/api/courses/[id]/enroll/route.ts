import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CourseService, RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);

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
        const courseId = parseInt(id, 10);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const result = await courseService.enrollInCourse(auth.userId, courseId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            enrolled: result.enrolled,
            pointsSpent: result.pointsSpent,
            newTotalPoints: result.newTotalPoints,
            txHash: result.txHash,
        });
    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json(
            { error: 'Failed to enroll' },
            { status: 500 }
        );
    }
}
