import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/lessons/[id] - Get lesson details (no quiz, Synthesia URLs only)
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id: lessonId } = await context.params;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: { select: { id: true, title: true } },
                videos: { orderBy: { orderIndex: 'asc' } },
            },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const videos = lesson.videos.map((video) => ({
            ...video,
            signedUrl: video.storageKey,
        }));

        return NextResponse.json({
            lesson: { ...lesson, videos },
            signedVideoUrl: videos[0]?.signedUrl || lesson.videoStorageKey || null,
        });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/lessons/[id] - Update lesson metadata
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id: lessonId } = await context.params;

        const existingLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!existingLesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        let title: string | null = null;
        let description: string | null = null;
        let watchPoints: string | null = null;
        let videoDuration: string | null = null;

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json();
            title = body.title ?? null;
            description = body.description ?? null;
            watchPoints = body.watchPoints?.toString() ?? null;
            videoDuration = body.videoDuration?.toString() ?? null;
        } else {
            const formData = await request.formData();
            title = (formData.get('title') as string | null) || null;
            description = (formData.get('description') as string | null) || null;
            watchPoints = (formData.get('watchPoints') as string | null) || null;
            videoDuration = (formData.get('videoDuration') as string | null) || null;
        }

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                ...(title !== null && { title }),
                ...(description !== null && { description }),
                ...(watchPoints !== null && { watchPoints: parseInt(watchPoints, 10) || 0 }),
                ...(videoDuration !== null && { videoDuration: parseInt(videoDuration, 10) || 0 }),
            },
        });

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('Error updating lesson:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/lessons/[id] - Delete lesson
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id: lessonId } = await context.params;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        await prisma.lesson.delete({ where: { id: lessonId } });
        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
    }
}
