import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/courses - Get all courses (including unpublished)
 */
export async function GET(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const courses = await prisma.course.findMany({
            include: {
                _count: {
                    select: { lessons: true, enrollments: true },
                },
            },
            orderBy: { id: 'asc' },
        });

        return NextResponse.json({ courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

/**
 * POST /api/admin/courses - Create a new course (database only)
 * 
 * On-chain course creation is handled by the frontend via MetaMask.
 * The courseId should match the on-chain course ID.
 */
export async function POST(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            id, // Course ID from on-chain (frontend passes this after creating on-chain)
            title,
            description,
            longDescription,
            instructor,
            category,
            level,
            thumbnailUrl,
            duration,
            objectives = [],
            prerequisites = [],
            completionPoints = 50,
            minPointsToAccess = 0, // Gate check for ADVANCED courses
            enrollmentCost = 0,    // Deducted for PREMIUM courses
            onChainTxHash, // Transaction hash from frontend's MetaMask signing
        } = body;

        // Validate required fields
        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title and description are required' },
                { status: 400 }
            );
        }

        // If no ID provided, get next available ID from database
        let courseId = id;
        if (courseId === undefined || courseId === null) {
            const lastCourse = await prisma.course.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true },
            });
            courseId = (lastCourse?.id ?? -1) + 1;
        }

        // Create course in database
        const course = await prisma.course.create({
            data: {
                id: courseId,
                title,
                description,
                longDescription,
                instructor,
                category,
                level: level || 'Beginner',
                thumbnailUrl,
                duration,
                objectives,
                prerequisites,
                completionPoints,
                minPointsToAccess,
                enrollmentCost,
                totalLessons: 0,
                isPublished: false,
                onChainSynced: !!onChainTxHash,
                onChainTxHash,
            },
        });


        return NextResponse.json({
            course,
            message: onChainTxHash
                ? 'Course created and synced with on-chain'
                : 'Course created in database. Call createCourse() on-chain via MetaMask to sync.',
        });
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}
