import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RelayerService, ProgressService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const progressService = new ProgressService(prisma, relayerService);

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

        // First try to retry sync for already-completed courses
        const retryResult = await progressService.retrySyncCompletion(auth.userId, courseId);

        if (retryResult.success) {
            return NextResponse.json({
                message: retryResult.alreadySynced
                    ? 'Course already synced to blockchain'
                    : 'Course synced to blockchain successfully',
                completed: true,
                synced: true,
                alreadySynced: retryResult.alreadySynced ?? false,
                txHash: retryResult.txHash,
            });
        }

        // If course is not completed yet, try the normal completion check
        if (retryResult.error === 'Course is not completed yet') {
            const checkResult = await progressService.checkAndAwardCourseCompletion(auth.userId, courseId);
            return NextResponse.json({
                message: checkResult.completed
                    ? 'Course completed and synced to blockchain'
                    : 'Course not completed yet',
                completed: checkResult.completed,
                synced: !!checkResult.txHash,
                txHash: checkResult.txHash,
            });
        }

        // Return the error from retry
        return NextResponse.json({
            error: retryResult.error || 'Failed to sync course',
            completed: false,
            synced: false,
        }, { status: 400 });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { error: 'Failed to sync course' },
            { status: 500 }
        );
    }
}

