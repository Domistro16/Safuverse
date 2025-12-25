import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';

// PATCH /api/admin/courses/[id]/link-tx
// Links an on-chain transaction hash to a course after successful on-chain creation
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const courseId = parseInt(id);
        if (isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        // Verify admin authentication
        const authResult = await verifyAdmin(request as any);
        if (!authResult.authorized) {
            return NextResponse.json({ error: authResult.error }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { onChainTxHash } = body;

        if (!onChainTxHash || typeof onChainTxHash !== 'string') {
            return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
        }

        // Update the course with the transaction hash
        const course = await prisma.course.update({
            where: { id: courseId },
            data: { onChainTxHash },
        });

        return NextResponse.json({
            success: true,
            course: {
                id: course.id,
                onChainTxHash: course.onChainTxHash,
            },
        });
    } catch (error) {
        console.error('Error linking txHash to course:', error);
        return NextResponse.json(
            { error: 'Failed to link transaction hash' },
            { status: 500 }
        );
    }
}
