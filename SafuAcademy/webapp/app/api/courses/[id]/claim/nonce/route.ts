import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unauthorizedResponse, verifyAuth } from '@/lib/auth';
import { buildClaimSignatureMessage, createClaimNonce } from '@/lib/scorm/claim-signature';

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

        const nonce = createClaimNonce();
        const timestamp = Math.floor(Date.now() / 1000);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.scoreActionNonce.create({
            data: {
                userId: auth.userId,
                courseId,
                nonce,
                actionType: 'PROOF_SIGNED',
                expiresAt,
            },
        });

        const message = buildClaimSignatureMessage({
            walletAddress: auth.walletAddress,
            courseId,
            nonce,
            timestamp,
        });

        return NextResponse.json({
            nonce,
            message,
            expiresAt,
        });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to create claim nonce' },
            { status: 500 }
        );
    }
}

