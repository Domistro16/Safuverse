import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { extractScormZipToPublic } from '@/lib/scorm/storage';

export const dynamic = 'force-dynamic';

interface VideoInput {
    language: string;
    label: string;
    orderIndex: number;
    url: string;
}

interface LessonInput {
    title: string;
    description?: string;
    orderIndex: number;
    watchPoints?: number;
    videos?: VideoInput[];
}

interface CourseInput {
    title: string;
    description: string;
    longDescription?: string;
    instructor?: string;
    category?: string;
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    thumbnailUrl?: string;
    duration?: string;
    objectives?: string[];
    prerequisites?: string[];
    completionPoints?: number;
    keyTakeaways?: string[];
    isIncentivized?: boolean;
    scormVersion?: 'SCORM_12' | 'SCORM_2004' | '1.2' | '2004';
    scormLaunchUrl?: string;
    scormManifestPath?: string;
    scormPackageVersion?: number;
    onChainTxHash?: string;
}

function normalizeScormVersion(value?: string | null): 'SCORM_12' | 'SCORM_2004' | null {
    if (!value) return null;
    if (value === 'SCORM_12' || value === '1.2') return 'SCORM_12';
    if (value === 'SCORM_2004' || value === '2004') return 'SCORM_2004';
    return null;
}

export async function POST(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const formData = await request.formData();

        const courseDataStr = formData.get('courseData') as string;
        if (!courseDataStr) {
            return NextResponse.json({ error: 'courseData is required' }, { status: 400 });
        }

        let courseData: CourseInput;
        try {
            courseData = JSON.parse(courseDataStr);
        } catch {
            return NextResponse.json({ error: 'Invalid courseData JSON' }, { status: 400 });
        }

        if (!courseData.title || !courseData.description) {
            return NextResponse.json(
                { error: 'Course title and description are required' },
                { status: 400 }
            );
        }

        const lessonsStr = formData.get('lessons') as string;
        let lessons: LessonInput[] = [];
        if (lessonsStr) {
            try {
                lessons = JSON.parse(lessonsStr);
            } catch {
                return NextResponse.json({ error: 'Invalid lessons JSON' }, { status: 400 });
            }
        }

        if (!courseData.isIncentivized) {
            for (const lesson of lessons) {
                if (!lesson.title || lesson.title.trim() === '') {
                    return NextResponse.json(
                        { error: `Lesson at index ${lesson.orderIndex} is missing a title` },
                        { status: 400 }
                    );
                }
                for (const video of lesson.videos || []) {
                    if (!video.url || !video.url.startsWith('https://share.synthesia.io/')) {
                        return NextResponse.json(
                            { error: `Invalid Synthesia URL in lesson "${lesson.title}"` },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        const lastCourse = await prisma.course.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
        });
        const courseId = (lastCourse?.id ?? -1) + 1;

        const scormZipFile = formData.get('scormZip');
        let scormVersion = normalizeScormVersion(courseData.scormVersion);
        let scormLaunchUrl = courseData.scormLaunchUrl || null;
        let scormManifestPath = courseData.scormManifestPath || null;
        const scormPackageVersion = courseData.scormPackageVersion ?? 1;

        if (scormZipFile instanceof File && scormZipFile.size > 0) {
            const extracted = await extractScormZipToPublic({
                courseId,
                packageVersion: scormPackageVersion,
                zipBuffer: Buffer.from(await scormZipFile.arrayBuffer()),
            });
            scormVersion = extracted.scormVersion;
            scormLaunchUrl = extracted.launchUrl;
            scormManifestPath = extracted.manifestPath;
        }

        if (courseData.isIncentivized && (!scormVersion || !scormLaunchUrl)) {
            return NextResponse.json(
                { error: 'Incentivized courses require SCORM configuration (zip upload or launch URL + version).' },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const course = await tx.course.create({
                data: {
                    id: courseId,
                    title: courseData.title,
                    description: courseData.description,
                    longDescription: courseData.longDescription || '',
                    instructor: courseData.instructor || '',
                    category: courseData.category || 'DeFi',
                    level: courseData.level || 'BEGINNER',
                    thumbnailUrl: courseData.thumbnailUrl || null,
                    duration: courseData.duration || '',
                    objectives: courseData.objectives || [],
                    prerequisites: courseData.prerequisites || [],
                    completionPoints: courseData.isIncentivized ? (courseData.completionPoints ?? 50) : 0,
                    keyTakeaways: courseData.keyTakeaways || [],
                    isIncentivized: !!courseData.isIncentivized,
                    scormVersion,
                    scormLaunchUrl,
                    scormManifestPath,
                    scormPackageVersion,
                    isPublished: false,
                    onChainSynced: !!courseData.onChainTxHash,
                    onChainTxHash: courseData.onChainTxHash || null,
                },
            });

            const createdLessons = [];
            for (const lessonInput of lessons) {
                const lessonVideos = lessonInput.videos || [];
                const primaryVideoUrl = lessonVideos.length > 0 ? lessonVideos[0].url : null;

                const lesson = await tx.lesson.create({
                    data: {
                        courseId: course.id,
                        title: lessonInput.title.trim(),
                        description: lessonInput.description || null,
                        orderIndex: lessonInput.orderIndex,
                        videoStorageKey: primaryVideoUrl,
                        videoDuration: 0,
                        watchPoints: lessonInput.watchPoints ?? 10,
                    },
                });

                for (const video of lessonVideos) {
                    await tx.lessonVideo.create({
                        data: {
                            lessonId: lesson.id,
                            storageKey: video.url,
                            language: video.language,
                            label: video.label,
                            orderIndex: video.orderIndex,
                            duration: 0,
                        },
                    });
                }

                createdLessons.push(lesson);
            }

            return { course, lessons: createdLessons };
        });

        return NextResponse.json({
            course: result.course,
            lessons: result.lessons,
            message: courseData.onChainTxHash
                ? 'Course created with lessons and synced on-chain'
                : 'Course created with lessons in database. Sync on-chain from admin wallet.',
        });
    } catch (error) {
        console.error('Error in create-with-lessons:', error);
        return NextResponse.json(
            { error: 'Failed to create course with lessons' },
            { status: 500 }
        );
    }
}
