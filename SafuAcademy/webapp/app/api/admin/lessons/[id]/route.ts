import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';
import { getStorageService } from '@/lib/services/storage.service';
import { LessonType } from '@prisma/client';

interface RouteContext {
    params: Promise<{ id: string }>;
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
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: { select: { id: true, title: true } },
                quiz: true,
            },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // For admin, include signed URL if video exists
        let signedVideoUrl: string | null = null;
        if (lesson.videoStorageKey) {
            const storageService = getStorageService();
            if (storageService.isAvailable()) {
                signedVideoUrl = await storageService.getSignedVideoUrl(lesson.videoStorageKey);
            }
        }

        return NextResponse.json({ lesson, signedVideoUrl });
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
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);

        const existingLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!existingLesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const title = formData.get('title') as string | null;
        const description = formData.get('description') as string | null;
        const type = formData.get('type') as string | null;
        const videoFile = formData.get('video') as File | null;
        const contentUrl = formData.get('contentUrl') as string | null;
        const estimatedMinutes = formData.get('estimatedMinutes') as string | null;
        const pointsValue = formData.get('pointsValue') as string | null;
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
                ...(type && { type: type as LessonType }),
                ...(contentUrl !== null && { contentUrl }),
                ...(videoStorageKey && { videoStorageKey }),
                ...(estimatedMinutes && { estimatedMinutes: parseInt(estimatedMinutes, 10) }),
                ...(pointsValue && { pointsValue: parseInt(pointsValue, 10) }),
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
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);

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

        // Update course total lessons
        const lessonCount = await prisma.lesson.count({
            where: { courseId: lesson.courseId },
        });
        await prisma.course.update({
            where: { id: lesson.courseId },
            data: { totalLessons: lessonCount },
        });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
    }
}
