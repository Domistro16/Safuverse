import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
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
 * GET /api/lessons/[id]/video - Get signed video URL(s) for streaming
 * Requires user to be enrolled in the lesson's course
 * 
 * Returns:
 * - videos: Array of video objects with signedUrl, language, label (for multi-language)
 * - signedUrl: Legacy single video URL (for backward compatibility)
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const auth = verifyAuth(request);
    if (!auth) {
        return unauthorizedResponse();
    }

    try {
        const { id: lessonId } = await context.params;
        const userId = auth.userId;

        // Get lesson with course info and multi-language videos
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: { select: { id: true, title: true } },
                videos: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
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

        // Get storage service
        const storageService = getStorageService();
        if (!storageService.isAvailable()) {
            return NextResponse.json(
                { error: 'Video storage is not configured' },
                { status: 503 }
            );
        }

        const expiresIn = 7200; // 2 hours

        // Check for multi-language videos first
        if (lesson.videos && lesson.videos.length > 0) {
            const videosWithUrls = await Promise.all(
                lesson.videos.map(async (video: LessonVideoType) => {
                    const signedUrl = await storageService.getSignedVideoUrl(
                        video.storageKey,
                        expiresIn
                    );
                    return {
                        id: video.id,
                        language: video.language,
                        label: video.label,
                        signedUrl,
                        duration: video.duration,
                    };
                })
            );

            return NextResponse.json({
                videos: videosWithUrls,
                expiresIn,
                duration: lesson.videoDuration,
            });
        }

        // Fallback to legacy single video (videoStorageKey)
        if (!lesson.videoStorageKey) {
            return NextResponse.json({
                videos: [],
                signedUrl: null,
                expiresIn,
                duration: lesson.videoDuration,
            });
        }

        const signedUrl = await storageService.getSignedVideoUrl(
            lesson.videoStorageKey,
            expiresIn
        );

        return NextResponse.json({
            videos: [{ signedUrl, language: 'en', label: 'English' }],
            signedUrl, // Legacy support
            expiresIn,
            duration: lesson.videoDuration,
        });
    } catch (error) {
        console.error('Error getting video URL:', error);
        return NextResponse.json({ error: 'Failed to get video URL' }, { status: 500 });
    }
}
