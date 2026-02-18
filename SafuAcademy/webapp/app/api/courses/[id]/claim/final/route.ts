import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unauthorizedResponse, verifyAuth } from '@/lib/auth';
import { ProgressService, RelayerService } from '@/lib/services';

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
        const courseId = Number(id);
        if (Number.isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const result = await progressService.finalizeIncentivizedCourse(auth.userId, courseId);
        if (!result.completed) {
            return NextResponse.json({ error: result.error || 'Claim requirements not met' }, { status: 400 });
        }

        return NextResponse.json({
            completed: true,
            finalScore: result.finalScore,
            leaderboardEligible: result.leaderboardEligible,
            txHash: result.txHash,
        });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to finalize incentivized course claim' },
            { status: 500 }
        );
    }
}

