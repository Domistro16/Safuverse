import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';
import { getStorageService } from '@/lib/services/storage.service';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/lessons/[id]/video - Get signed video URL for streaming
 * Requires user to be enrolled in the lesson's course
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAuth(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const lessonId = parseInt(id, 10);
        const userId = authResult.user!.userId;

        // Get lesson with course info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { id: true, title: true } } },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Check if video storage key exists
        if (!lesson.videoStorageKey) {
            return NextResponse.json({ error: 'No video available for this lesson' }, { status: 404 });
        }

        // Verify user is enrolled in the course
        const enrollment = await prisma.userCourse.findUnique({
            where: {
                userId_courseId: { userId, courseId: lesson.courseId },
            },
        });

        if (!enrollment) {
            return NextResponse.json(
                { error: 'Not enrolled in this course' },
                { status: 403 }
            );
        }

        // Get signed URL from storage service
        const storageService = getStorageService();
        if (!storageService.isAvailable()) {
            return NextResponse.json(
                { error: 'Video storage is not configured' },
                { status: 503 }
            );
        }

        const expiresIn = 7200; // 2 hours
        const signedUrl = await storageService.getSignedVideoUrl(
            lesson.videoStorageKey,
            expiresIn
        );

        return NextResponse.json({
            signedUrl,
            expiresIn,
            duration: lesson.videoDuration,
        });
    } catch (error) {
        console.error('Error getting video URL:', error);
        return NextResponse.json({ error: 'Failed to get video URL' }, { status: 500 });
    }
}
