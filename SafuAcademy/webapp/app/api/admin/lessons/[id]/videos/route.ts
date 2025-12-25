import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';
import { getStorageService } from '@/lib/services/storage.service';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/lessons/[id]/videos - Get all videos for a lesson
 */
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

        const storageService = getStorageService();
        const videosWithUrls = await Promise.all(
            videos.map(async (video) => {
                let signedUrl: string | null = null;
                if (storageService.isAvailable()) {
                    signedUrl = await storageService.getSignedVideoUrl(video.storageKey);
                }
                return { ...video, signedUrl };
            })
        );

        return NextResponse.json({ videos: videosWithUrls });
    } catch (error) {
        console.error('Error fetching lesson videos:', error);
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}

/**
 * POST /api/admin/lessons/[id]/videos - Add a video for a specific language
 */
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

        const formData = await request.formData();
        const videoFile = formData.get('video') as File | null;
        const language = formData.get('language') as string | null;
        const label = formData.get('label') as string | null;

        if (!videoFile || !language || !label) {
            return NextResponse.json(
                { error: 'Video file, language code, and label are required' },
                { status: 400 }
            );
        }

        // Check if language already exists for this lesson
        const existingVideo = lesson.videos.find(v => v.language === language);
        if (existingVideo) {
            return NextResponse.json(
                { error: `A video for language "${language}" already exists. Delete it first to replace.` },
                { status: 400 }
            );
        }

        const storageService = getStorageService();
        if (!storageService.isAvailable()) {
            return NextResponse.json(
                { error: 'Video storage is not configured' },
                { status: 503 }
            );
        }

        // Upload video with language suffix
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const storageKey = await storageService.uploadVideo(
            lesson.courseId,
            buffer,
            `${language}_${videoFile.name}`,
            videoFile.type
        );

        // Get next order index
        const maxOrderIndex = lesson.videos.reduce((max, v) => Math.max(max, v.orderIndex), -1);

        // Create video record
        const video = await prisma.lessonVideo.create({
            data: {
                lessonId,
                language,
                label,
                storageKey,
                orderIndex: maxOrderIndex + 1,
            },
        });

        // Get signed URL for response
        const signedUrl = await storageService.getSignedVideoUrl(storageKey);

        return NextResponse.json({ video: { ...video, signedUrl } });
    } catch (error) {
        console.error('Error adding lesson video:', error);
        return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/lessons/[id]/videos - Delete a video by language or videoId
 */
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

        // Delete from storage
        const storageService = getStorageService();
        if (storageService.isAvailable()) {
            await storageService.deleteVideo(video.storageKey);
        }

        // Delete from database
        await prisma.lessonVideo.delete({ where: { id: video.id } });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting lesson video:', error);
        return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }
}
