import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
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

/**
 * GET /api/lessons/[id]/video - Get lesson video URL(s) for streaming
 * Requires user to be enrolled in the lesson's course
 * 
 * Returns:
 * - videos: Array of video objects with signedUrl, language, label
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

        // Check for multi-language videos first
        if (lesson.videos && lesson.videos.length > 0) {
            const videosWithUrls = lesson.videos.map((video: LessonVideoType) => ({
                id: video.id,
                language: video.language,
                label: video.label,
                signedUrl: video.storageKey,
                duration: video.duration,
            }));

            return NextResponse.json({
                videos: videosWithUrls,
                duration: lesson.videoDuration,
            });
        }

        // Fallback to legacy single video field
        if (!lesson.videoStorageKey) {
            return NextResponse.json({
                videos: [],
                signedUrl: null,
                duration: lesson.videoDuration,
            });
        }

        const signedUrl = lesson.videoStorageKey;

        return NextResponse.json({
            videos: [{ signedUrl, language: 'en', label: 'English' }],
            signedUrl, // Legacy support
            duration: lesson.videoDuration,
        });
    } catch (error) {
        console.error('Error getting video URL:', error);
        return NextResponse.json({ error: 'Failed to get video URL' }, { status: 500 });
    }
}
