import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/courses/[id] - Get a single course with lessons
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        quiz: {
                            select: { id: true, passingScore: true, passPoints: true, questions: true },
                        },
                        videos: {
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                },
                _count: { select: { enrollments: true } },
            },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ course });
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/courses/[id] - Update a course (database only)
 * 
 * On-chain update is handled by the frontend via MetaMask.
 * Pass onChainTxHash after successful MetaMask transaction.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);
        const body = await request.json();

        const existingCourse = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!existingCourse) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const {
            title,
            description,
            longDescription,
            instructor,
            category,
            level,
            thumbnailUrl,
            duration,
            objectives,
            prerequisites,
            completionPoints,
            minPointsToAccess,
            enrollmentCost,
            isPublished,
            onChainTxHash, // From frontend after MetaMask signing
        } = body;

        // Update in database
        const course = await prisma.course.update({
            where: { id: courseId },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(longDescription !== undefined && { longDescription }),
                ...(instructor !== undefined && { instructor }),
                ...(category !== undefined && { category }),
                ...(level !== undefined && { level }),
                ...(thumbnailUrl !== undefined && { thumbnailUrl }),
                ...(duration !== undefined && { duration }),
                ...(objectives !== undefined && { objectives }),
                ...(prerequisites !== undefined && { prerequisites }),
                ...(completionPoints !== undefined && { completionPoints }),
                ...(minPointsToAccess !== undefined && { minPointsToAccess }),
                ...(enrollmentCost !== undefined && { enrollmentCost }),
                ...(isPublished !== undefined && { isPublished }),
                ...(onChainTxHash && { onChainSynced: true, onChainTxHash }),
            },
        });

        return NextResponse.json({ course });
    } catch (error) {
        console.error('Error updating course:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/courses/[id] - Delete a course (database only)
 * 
 * On-chain deletion is handled by the frontend via MetaMask.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);

        const existingCourse = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!existingCourse) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Delete from database (cascade will delete lessons, quizzes, etc.)
        await prisma.course.delete({ where: { id: courseId } });

        return NextResponse.json({
            deleted: true,
            message: 'Course deleted from database. Call deleteCourse() on-chain via MetaMask if needed.',
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
