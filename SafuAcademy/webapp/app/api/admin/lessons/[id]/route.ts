import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';
import { getStorageService } from '@/lib/services/storage.service';

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

/**
 * GET /api/admin/lessons/[id] - Get lesson details
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
                quiz: true,
                videos: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const storageService = getStorageService();

        // Generate signed URLs for all videos
        const videosWithUrls = await Promise.all(
            lesson.videos.map(async (video: LessonVideoType) => {
                let signedUrl: string | null = null;
                if (storageService.isAvailable()) {
                    signedUrl = await storageService.getSignedVideoUrl(video.storageKey);
                }
                return {
                    ...video,
                    signedUrl,
                };
            })
        );

        // Legacy: include signed URL for old videoStorageKey if exists
        let signedVideoUrl: string | null = null;
        if (lesson.videoStorageKey && storageService.isAvailable()) {
            signedVideoUrl = await storageService.getSignedVideoUrl(lesson.videoStorageKey);
        }

        return NextResponse.json({
            lesson: { ...lesson, videos: videosWithUrls },
            signedVideoUrl, // Legacy support
        });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/lessons/[id] - Update lesson
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

        const formData = await request.formData();
        const title = formData.get('title') as string | null;
        const description = formData.get('description') as string | null;
        const videoFile = formData.get('video') as File | null;
        const watchPoints = formData.get('watchPoints') as string | null;
        const videoDuration = formData.get('videoDuration') as string | null;

        // Handle video replacement
        let videoStorageKey = existingLesson.videoStorageKey;
        if (videoFile && videoFile.size > 0) {
            const storageService = getStorageService();
            if (!storageService.isAvailable()) {
                return NextResponse.json(
                    { error: 'Video storage is not configured' },
                    { status: 503 }
                );
            }

            // Delete old video if exists
            if (existingLesson.videoStorageKey) {
                await storageService.deleteVideo(existingLesson.videoStorageKey);
            }

            // Upload new video
            const buffer = Buffer.from(await videoFile.arrayBuffer());
            videoStorageKey = await storageService.uploadVideo(
                existingLesson.courseId,
                buffer,
                videoFile.name,
                videoFile.type
            );
        }

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                ...(title && { title }),
                ...(description !== null && { description }),
                ...(videoStorageKey && { videoStorageKey }),
                ...(watchPoints && { watchPoints: parseInt(watchPoints, 10) }),
                ...(videoDuration && { videoDuration: parseInt(videoDuration, 10) }),
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

        // Delete video from storage if exists
        if (lesson.videoStorageKey) {
            const storageService = getStorageService();
            if (storageService.isAvailable()) {
                await storageService.deleteVideo(lesson.videoStorageKey);
            }
        }

        // Delete lesson (cascade deletes quiz)
        await prisma.lesson.delete({ where: { id: lessonId } });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
    }
}
