import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unauthorizedResponse, verifyAuth } from '@/lib/auth';
import { verifyClaimSignature } from '@/lib/scorm/claim-signature';

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

        const body = await request.json();
        const nonce = String(body?.nonce || '');
        const message = String(body?.message || '');
        const signature = String(body?.signature || '');

        if (!nonce || !message || !signature) {
            return NextResponse.json(
                { error: 'nonce, message, and signature are required' },
                { status: 400 }
            );
        }

        const nonceRecord = await prisma.scoreActionNonce.findUnique({
            where: { nonce },
        });

        if (!nonceRecord) {
            return NextResponse.json({ error: 'Invalid nonce' }, { status: 400 });
        }

        if (nonceRecord.userId !== auth.userId || nonceRecord.courseId !== courseId) {
            return NextResponse.json({ error: 'Nonce context mismatch' }, { status: 403 });
        }

        if (nonceRecord.usedAt) {
            return NextResponse.json({ error: 'Nonce has already been used' }, { status: 409 });
        }

        if (nonceRecord.expiresAt.getTime() < Date.now()) {
            return NextResponse.json({ error: 'Nonce expired' }, { status: 400 });
        }

        const verification = verifyClaimSignature({
            walletAddress: auth.walletAddress,
            courseId,
            expectedNonce: nonce,
            message,
            signature,
        });

        if (!verification.valid) {
            return NextResponse.json({ error: verification.error }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.scoreActionNonce.update({
                where: { nonce },
                data: {
                    usedAt: new Date(),
                },
            }),
            prisma.userCourse.update({
                where: {
                    userId_courseId: {
                        userId: auth.userId,
                        courseId,
                    },
                },
                data: {
                    proofSigned: true,
                    proofSignedAt: new Date(),
                },
            }),
        ]);

        return NextResponse.json({ verified: true });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to verify signature action' },
            { status: 500 }
        );
    }
}

