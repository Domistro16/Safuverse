import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

interface LessonVideoType {
    id: string;
    storageKey: string;
    language: string;
    label: string;
    duration: number | null;
    orderIndex: number;
}

export async function GET(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id: lessonId } = await context.params;
        const videos = await prisma.lessonVideo.findMany({
            where: { lessonId },
            orderBy: { orderIndex: 'asc' },
        });

        const videosWithUrls = videos.map((video: LessonVideoType) => ({
            ...video,
            signedUrl: video.storageKey,
        }));

        return NextResponse.json({ videos: videosWithUrls });
    } catch (error) {
        console.error('Error fetching lesson videos:', error);
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id: lessonId } = await context.params;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { videos: true },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        let language: string | null = null;
        let label: string | null = null;
        let synthesiaUrl: string | null = null;

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json();
            language = body.language || null;
            label = body.label || null;
            synthesiaUrl = body.synthesiaUrl || body.url || null;
        } else {
            const formData = await request.formData();
            language = (formData.get('language') as string | null) || null;
            label = (formData.get('label') as string | null) || null;
            synthesiaUrl =
                (formData.get('synthesiaUrl') as string | null) ||
                (formData.get('url') as string | null) ||
                null;
        }

        if (!language || !label || !synthesiaUrl) {
            return NextResponse.json(
                { error: 'language, label and synthesiaUrl are required' },
                { status: 400 }
            );
        }

        if (!synthesiaUrl.startsWith('https://share.synthesia.io/')) {
            return NextResponse.json(
                { error: 'Invalid Synthesia URL format' },
                { status: 400 }
            );
        }

        const existingVideo = lesson.videos.find(
            (v: LessonVideoType) => v.language === language
        );
        if (existingVideo) {
            return NextResponse.json(
                {
                    error: `A video for language "${language}" already exists. Delete it first to replace.`,
                },
                { status: 400 }
            );
        }

        const maxOrderIndex = lesson.videos.reduce(
            (max: number, v: LessonVideoType) => Math.max(max, v.orderIndex),
            -1
        );

        const video = await prisma.lessonVideo.create({
            data: {
                lessonId,
                language,
                label,
                storageKey: synthesiaUrl,
                orderIndex: maxOrderIndex + 1,
            },
        });

        return NextResponse.json({ video: { ...video, signedUrl: synthesiaUrl } });
    } catch (error) {
        console.error('Error adding lesson video:', error);
        return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id: lessonId } = await context.params;
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');
        const language = searchParams.get('language');

        if (!videoId && !language) {
            return NextResponse.json(
                { error: 'Either videoId or language query parameter is required' },
                { status: 400 }
            );
        }

        const video = await prisma.lessonVideo.findFirst({
            where: {
                lessonId,
                ...(videoId ? { id: videoId } : { language: language! }),
            },
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        await prisma.lessonVideo.delete({ where: { id: video.id } });
        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting lesson video:', error);
        return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }
}
