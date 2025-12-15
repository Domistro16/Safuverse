import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';
import { getStorageService } from '@/lib/services/storage.service';
import { LessonType } from '@prisma/client';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/courses/[id]/lessons - List lessons with video URLs
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);

        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' },
            include: {
                quiz: { select: { id: true, passingScore: true, bonusPoints: true } },
            },
        });

        return NextResponse.json({ lessons });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
    }
}

/**
 * POST /api/admin/courses/[id]/lessons - Create a new lesson
 * Supports multipart form data for video upload
 */
export async function POST(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);

        // Check course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { _count: { select: { lessons: true } } },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string | null;
        const type = (formData.get('type') as string) || 'VIDEO';
        const videoFile = formData.get('video') as File | null;
        const contentUrl = formData.get('contentUrl') as string | null;
        const estimatedMinutes = parseInt(formData.get('estimatedMinutes') as string || '10', 10);
        const pointsValue = parseInt(formData.get('pointsValue') as string || '10', 10);
        const watchPoints = parseInt(formData.get('watchPoints') as string || '10', 10);

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Get next order index
        const order = course._count.lessons;

        // Handle video upload if provided
        let videoStorageKey: string | null = null;
        let videoDuration = 0;

        if (videoFile && videoFile.size > 0) {
            const storageService = getStorageService();
            if (!storageService.isAvailable()) {
                return NextResponse.json(
                    { error: 'Video storage is not configured' },
                    { status: 503 }
                );
            }

            const buffer = Buffer.from(await videoFile.arrayBuffer());
            videoStorageKey = await storageService.uploadVideo(
                courseId,
                buffer,
                videoFile.name,
                videoFile.type
            );
        }

        // Create lesson
        const lesson = await prisma.lesson.create({
            data: {
                courseId,
                title,
                description,
                order,
                type: type as LessonType,
                contentUrl,
                videoStorageKey,
                videoDuration,
                estimatedMinutes,
                pointsValue,
                watchPoints,
            },
        });

        // Update course total lessons
        await prisma.course.update({
            where: { id: courseId },
            data: { totalLessons: order + 1 },
        });

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('Error creating lesson:', error);
        return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
    }
}
