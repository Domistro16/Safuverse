import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unauthorizedResponse, verifyAuth } from '@/lib/auth';

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
        const courseId = Number(id);
        if (Number.isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const enrollment = await prisma.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: auth.userId,
                    courseId,
                },
            },
            include: {
                course: {
                    select: {
                        isIncentivized: true,
                    },
                },
            },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
        }

        if (!enrollment.course.isIncentivized) {
            return NextResponse.json({ error: 'Course is not incentivized' }, { status: 400 });
        }

        await prisma.userCourse.update({
            where: {
                userId_courseId: {
                    userId: auth.userId,
                    courseId,
                },
            },
            data: {
                dappVisitTracked: true,
                dappVisitedAt: new Date(),
            },
        });

        return NextResponse.json({ tracked: true });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to track dApp visit action' },
            { status: 500 }
        );
    }
}

