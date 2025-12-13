import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { RelayerService } from '../services/relayer.service.js';
import { CourseService } from '../services/course.service.js';

const router = Router();
const prisma = new PrismaClient();
const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);

// Validation schemas
const courseIdSchema = z.object({
    id: z.string().transform(val => parseInt(val, 10)),
});

/**
 * GET /api/courses
 * List all available courses
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
    const courses = await courseService.getAllCourses();

    // If user is authenticated, include enrollment status
    if (req.userId) {
        const enrollments = await prisma.userCourse.findMany({
            where: { userId: req.userId },
            select: { courseId: true, progress: true },
        });

        const enrollmentMap = new Map(
            enrollments.map(e => [e.courseId, e.progress])
        );

        const coursesWithProgress = courses.map(course => ({
            ...course,
            enrolled: enrollmentMap.has(course.id),
            progress: enrollmentMap.get(course.id) || 0,
        }));

        res.json({ courses: coursesWithProgress });
        return;
    }

    res.json({ courses });
});

/**
 * GET /api/courses/:id
 * Get a single course with its lessons
 */
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
    const { id } = courseIdSchema.parse(req.params);

    const course = await courseService.getCourseById(id);

    if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
    }

    let enrollment = null;
    if (req.userId) {
        enrollment = await prisma.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: req.userId,
                    courseId: id,
                },
            },
        });
    }

    res.json({
        course,
        enrollment,
    });
});

/**
 * GET /api/courses/:id/progress
 * Get user's detailed progress in a course
 */
router.get('/:id/progress', authMiddleware, async (req, res) => {
    const { id } = courseIdSchema.parse(req.params);

    const progress = await courseService.getUserCourseProgress(req.userId!, id);

    if (!progress) {
        res.status(404).json({ error: 'Not enrolled in this course' });
        return;
    }

    res.json({ progress });
});

/**
 * POST /api/courses/:id/enroll
 * Enroll the user in a course
 */
router.post('/:id/enroll', authMiddleware, async (req, res) => {
    const { id } = courseIdSchema.parse(req.params);

    const result = await courseService.enrollUser(
        req.userId!,
        req.walletAddress!,
        id
    );

    if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
    }

    const enrollment = await prisma.userCourse.findUnique({
        where: {
            userId_courseId: {
                userId: req.userId!,
                courseId: id,
            },
        },
    });

    res.json({
        message: 'Successfully enrolled',
        enrollment,
    });
});

/**
 * POST /api/courses/:id/sync
 * Manually trigger blockchain sync for a completed course
 */
router.post('/:id/sync', authMiddleware, async (req, res) => {
    const { id } = courseIdSchema.parse(req.params);

    const result = await courseService.syncCourseCompletion(
        req.userId!,
        req.walletAddress!,
        id
    );

    if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
    }

    res.json({
        message: 'Course synced to blockchain',
        txHash: result.txHash,
    });
});

export default router;
