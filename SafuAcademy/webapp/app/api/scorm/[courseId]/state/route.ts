import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ScormService } from '@/lib/services';
import { unauthorizedResponse, verifyAuth } from '@/lib/auth';

const scormService = new ScormService(prisma);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const auth = verifyAuth(request);
        if (!auth) {
            return unauthorizedResponse();
        }

        const { courseId: courseIdParam } = await params;
        const courseId = Number(courseIdParam);
        if (Number.isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const runtime = await scormService.getRuntime(auth.userId, courseId);
        return NextResponse.json({ runtime });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to fetch SCORM runtime state' },
            { status: 400 }
        );
    }
}

