import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getStorageService } from '@/lib/services/storage.service';

// Route segment config to allow large video uploads (up to 500MB)
export const maxDuration = 300; // 5 minute timeout for video uploads
export const dynamic = 'force-dynamic';

/**
 * Video metadata for a lesson
 */
interface VideoInput {
    language: string;
    label: string;
    orderIndex: number;
}

/**
 * Quiz question from the request
 */
interface QuizQuestionInput {
    question: string;
    options: string[];
    correctIndex: number;
}

/**
 * Quiz data from the request
 */
interface QuizInput {
    questions: QuizQuestionInput[];
    passingScore: number;
    passPoints: number;
}

/**
 * Lesson data from the request
 */
interface LessonInput {
    title: string;
    description?: string;
    orderIndex: number;
    watchPoints?: number;
    videos?: VideoInput[];
    quiz?: QuizInput;
}

/**
 * Course data from the request
 */
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
    minPointsToAccess?: number;
    enrollmentCost?: number;
    onChainTxHash?: string;
}

/**
 * Uploaded video info for database creation
 */
interface UploadedVideo {
    lessonOrderIndex: number;
    language: string;
    label: string;
    orderIndex: number;
    storageKey: string;
}

/**
 * POST /api/admin/courses/create-with-lessons
 * 
 * Create a course with lessons atomically, with multilingual video support.
 * - Videos are uploaded first
 * - Course and lessons are created in a database transaction
 * - If any step fails, uploaded videos are cleaned up
 * 
 * Request format: multipart/form-data
 * - courseData: JSON string of CourseInput
 * - lessons: JSON string of LessonInput[] (includes video metadata per lesson)
 * - video_<lessonIndex>_<language>: Video files (e.g., video_0_en, video_0_zh)
 */
export async function POST(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const storageService = getStorageService();

    // Track uploaded videos for cleanup on failure
    const uploadedVideoKeys: string[] = [];

    try {
        const formData = await request.formData();

        // Parse course data
        const courseDataStr = formData.get('courseData') as string;
        if (!courseDataStr) {
            return NextResponse.json(
                { error: 'courseData is required' },
                { status: 400 }
            );
        }

        let courseData: CourseInput;
        try {
            courseData = JSON.parse(courseDataStr);
        } catch {
            return NextResponse.json(
                { error: 'Invalid courseData JSON' },
                { status: 400 }
            );
        }

        // Validate required course fields
        if (!courseData.title || !courseData.description) {
            return NextResponse.json(
                { error: 'Course title and description are required' },
                { status: 400 }
            );
        }

        // Parse lessons data
        const lessonsStr = formData.get('lessons') as string;
        let lessons: LessonInput[] = [];
        if (lessonsStr) {
            try {
                lessons = JSON.parse(lessonsStr);
            } catch {
                return NextResponse.json(
                    { error: 'Invalid lessons JSON' },
                    { status: 400 }
                );
            }
        }

        // Validate lessons
        for (const lesson of lessons) {
            if (!lesson.title || lesson.title.trim() === '') {
                return NextResponse.json(
                    { error: `Lesson at index ${lesson.orderIndex} is missing a title` },
                    { status: 400 }
                );
            }
        }

        // Get next course ID
        const lastCourse = await prisma.course.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
        });
        const courseId = (lastCourse?.id ?? -1) + 1;

        // Step 1: Upload all videos first (before any database writes)
        const uploadedVideos: UploadedVideo[] = [];

        if (storageService.isAvailable()) {
            for (const lesson of lessons) {
                // Check for videos in the lesson metadata
                const lessonVideos = lesson.videos || [];
                console.log(`Processing lesson "${lesson.title}" with ${lessonVideos.length} video(s):`, lessonVideos.map(v => v.language));

                for (const videoMeta of lessonVideos) {
                    // Look for the video file with format: video_<lessonIndex>_<language>
                    const videoFieldName = `video_${lesson.orderIndex}_${videoMeta.language}`;
                    const videoFile = formData.get(videoFieldName) as File | null;

                    if (videoFile && videoFile.size > 0) {
                        try {
                            const buffer = Buffer.from(await videoFile.arrayBuffer());
                            // Use a unique filename that includes language
                            const uniqueFilename = `${videoMeta.language}_${videoFile.name}`;
                            const videoKey = await storageService.uploadVideo(
                                courseId,
                                buffer,
                                uniqueFilename,
                                videoFile.type
                            );

                            uploadedVideos.push({
                                lessonOrderIndex: lesson.orderIndex,
                                language: videoMeta.language,
                                label: videoMeta.label,
                                orderIndex: videoMeta.orderIndex,
                                storageKey: videoKey,
                            });
                            uploadedVideoKeys.push(videoKey);
                            console.log(`Uploaded video for lesson ${lesson.orderIndex}, language ${videoMeta.language}: ${videoKey}`);
                        } catch (uploadError) {
                            // Video upload failed - clean up any already uploaded videos
                            console.error('Video upload failed:', uploadError);
                            await cleanupUploadedVideos(storageService, uploadedVideoKeys);
                            return NextResponse.json(
                                { error: `Failed to upload ${videoMeta.label} video for lesson "${lesson.title}"` },
                                { status: 500 }
                            );
                        }
                    }
                }

                // Also check for legacy single video format (video_<lessonIndex>)
                const legacyVideoFile = formData.get(`video_${lesson.orderIndex}`) as File | null;
                if (legacyVideoFile && legacyVideoFile.size > 0) {
                    try {
                        const buffer = Buffer.from(await legacyVideoFile.arrayBuffer());
                        const videoKey = await storageService.uploadVideo(
                            courseId,
                            buffer,
                            legacyVideoFile.name,
                            legacyVideoFile.type
                        );

                        uploadedVideos.push({
                            lessonOrderIndex: lesson.orderIndex,
                            language: 'en',
                            label: 'English',
                            orderIndex: 0,
                            storageKey: videoKey,
                        });
                        uploadedVideoKeys.push(videoKey);
                    } catch (uploadError) {
                        console.error('Legacy video upload failed:', uploadError);
                        await cleanupUploadedVideos(storageService, uploadedVideoKeys);
                        return NextResponse.json(
                            { error: `Failed to upload video for lesson "${lesson.title}"` },
                            { status: 500 }
                        );
                    }
                }
            }
        }

        // Step 2: Create course and lessons in a transaction
        try {
            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Create course
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
                        completionPoints: courseData.completionPoints ?? 50,
                        minPointsToAccess: courseData.minPointsToAccess ?? 0,
                        enrollmentCost: courseData.enrollmentCost ?? 0,
                        isPublished: false,
                        onChainSynced: !!courseData.onChainTxHash,
                        onChainTxHash: courseData.onChainTxHash || null,
                    },
                });

                // Create all lessons with their videos
                const createdLessons = [];
                for (const lessonInput of lessons) {
                    // Get all videos for this lesson
                    const lessonUploadedVideos = uploadedVideos.filter(
                        v => v.lessonOrderIndex === lessonInput.orderIndex
                    );
                    console.log(`Lesson ${lessonInput.orderIndex} ("${lessonInput.title}"): Found ${lessonUploadedVideos.length} uploaded videos`);

                    // Use first video as legacy videoStorageKey (for backward compatibility)
                    const primaryVideoKey = lessonUploadedVideos.length > 0
                        ? lessonUploadedVideos[0].storageKey
                        : '';

                    const lesson = await tx.lesson.create({
                        data: {
                            courseId: course.id,
                            title: lessonInput.title.trim(),
                            description: lessonInput.description || null,
                            orderIndex: lessonInput.orderIndex,
                            videoStorageKey: primaryVideoKey,
                            videoDuration: 0, // Duration can be updated later via lesson edit
                            watchPoints: lessonInput.watchPoints ?? 10,
                        },
                    });

                    // Create LessonVideo records for multilingual videos
                    for (const video of lessonUploadedVideos) {
                        await tx.lessonVideo.create({
                            data: {
                                lessonId: lesson.id,
                                storageKey: video.storageKey,
                                language: video.language,
                                label: video.label,
                                orderIndex: video.orderIndex,
                                duration: 0, // Duration can be updated later
                            },
                        });
                        console.log(`Created LessonVideo for lesson ${lesson.id}: language=${video.language}, key=${video.storageKey}`);
                    }

                    // Create Quiz if provided
                    if (lessonInput.quiz && lessonInput.quiz.questions.length > 0) {
                        await tx.quiz.create({
                            data: {
                                lessonId: lesson.id,
                                questions: JSON.parse(JSON.stringify(lessonInput.quiz.questions)),
                                passingScore: lessonInput.quiz.passingScore ?? 70,
                                passPoints: lessonInput.quiz.passPoints ?? 20,
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
                videosUploaded: uploadedVideos.length,
                message: courseData.onChainTxHash
                    ? 'Course created with lessons and synced with on-chain'
                    : 'Course created with lessons in database. Call createCourse() on-chain via MetaMask to sync.',
            });
        } catch (dbError) {
            // Database transaction failed - clean up uploaded videos
            console.error('Database transaction failed:', dbError);
            await cleanupUploadedVideos(storageService, uploadedVideoKeys);
            return NextResponse.json(
                { error: 'Failed to create course and lessons in database' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in create-with-lessons:', error);
        // General error - try to clean up any uploaded videos
        await cleanupUploadedVideos(storageService, uploadedVideoKeys);
        return NextResponse.json(
            { error: 'Failed to create course with lessons' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to clean up uploaded videos on failure
 */
async function cleanupUploadedVideos(
    storageService: ReturnType<typeof getStorageService>,
    videoKeys: string[]
): Promise<void> {
    if (!storageService.isAvailable() || videoKeys.length === 0) {
        return;
    }

    for (const key of videoKeys) {
        try {
            await storageService.deleteVideo(key);
            console.log(`Cleaned up video: ${key}`);
        } catch (cleanupError) {
            console.error(`Failed to clean up video ${key}:`, cleanupError);
            // Continue cleaning up other videos even if one fails
        }
    }
}
