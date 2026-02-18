import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/courses/[id]/lessons - List lessons
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
            orderBy: { orderIndex: 'asc' },
            include: {
                videos: {
                    orderBy: { orderIndex: 'asc' },
                },
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
 * Supports JSON and FormData payloads.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const courseId = parseInt(id, 10);

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { _count: { select: { lessons: true } } },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        let title: string | null = null;
        let description: string | null = null;
        let watchPoints = 10;
        let synthesiaUrl: string | null = null;
        let language = 'en';
        let label = 'English';

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json();
            title = body.title ?? null;
            description = body.description ?? null;
            watchPoints = parseInt((body.watchPoints ?? 10).toString(), 10) || 10;
            synthesiaUrl = body.synthesiaUrl || body.url || null;
            language = body.language || 'en';
            label = body.label || 'English';
        } else {
            const formData = await request.formData();
            title = (formData.get('title') as string | null) || null;
            description = (formData.get('description') as string | null) || null;
            watchPoints = parseInt((formData.get('watchPoints') as string) || '10', 10) || 10;
            synthesiaUrl =
                (formData.get('synthesiaUrl') as string | null) ||
                (formData.get('url') as string | null) ||
                null;
            language = (formData.get('language') as string | null) || 'en';
            label = (formData.get('label') as string | null) || 'English';
        }

        if (!title || title.trim() === '') {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        if (synthesiaUrl && !synthesiaUrl.startsWith('https://share.synthesia.io/')) {
            return NextResponse.json({ error: 'Invalid Synthesia URL format' }, { status: 400 });
        }

        const orderIndex = course._count.lessons;

        const lesson = await prisma.lesson.create({
            data: {
                courseId,
                title: title.trim(),
                description,
                orderIndex,
                videoStorageKey: synthesiaUrl || null,
                videoDuration: 0,
                watchPoints,
            },
        });

        if (synthesiaUrl) {
            await prisma.lessonVideo.create({
                data: {
                    lessonId: lesson.id,
                    language,
                    label,
                    storageKey: synthesiaUrl,
                    orderIndex: 0,
                    duration: 0,
                },
            });
        }

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('Error creating lesson:', error);
        return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
    }
}
