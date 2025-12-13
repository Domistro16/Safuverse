import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { RelayerService } from '../services/relayer.service.js';
import { CourseService } from '../services/course.service.js';
import { LessonService } from '../services/lesson.service.js';
import { QuizService } from '../services/quiz.service.js';

const router = Router();
const prisma = new PrismaClient();
const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);
const lessonService = new LessonService(prisma, courseService);
const quizService = new QuizService(prisma);

// Validation schemas
const lessonIdSchema = z.object({
    id: z.string().transform(val => parseInt(val, 10)),
});

const completeLessonSchema = z.object({
    videoProgressPercent: z.number().min(0).max(100).optional(),
    timeSpentSeconds: z.number().min(0).optional(),
    quizPassed: z.boolean().optional(),
});

const progressUpdateSchema = z.object({
    timeSpent: z.number().min(0).optional(),
    videoProgress: z.number().min(0).max(100).optional(),
});

const quizSubmitSchema = z.object({
    answers: z.record(z.string(), z.number()),
});

/**
 * GET /api/lessons/:id
 * Get lesson details
 */
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = lessonIdSchema.parse(req.params);

    const lesson = await lessonService.getLesson(id);

    if (!lesson) {
        res.status(404).json({ error: 'Lesson not found' });
        return;
    }

    // Check enrollment
    const enrollment = await prisma.userCourse.findUnique({
        where: {
            userId_courseId: {
                userId: req.userId!,
                courseId: lesson.courseId,
            },
        },
    });

    if (!enrollment) {
        res.status(403).json({ error: 'Not enrolled in this course' });
        return;
    }

    const userProgress = await lessonService.getUserLessonProgress(req.userId!, id);

    res.json({
        lesson,
        userProgress,
    });
});

/**
 * POST /api/lessons/:id/start
 * Start a lesson session (track time)
 */
router.post('/:id/start', authMiddleware, async (req, res) => {
    const { id } = lessonIdSchema.parse(req.params);

    try {
        const userLesson = await lessonService.startLesson(req.userId!, id);
        res.json({
            message: 'Lesson started',
            userLesson,
        });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
});

/**
 * POST /api/lessons/:id/complete
 * Mark a lesson as complete with validation
 */
router.post('/:id/complete', authMiddleware, async (req, res) => {
    const { id } = lessonIdSchema.parse(req.params);
    const data = completeLessonSchema.parse(req.body);

    const result = await lessonService.completeLesson(
        req.userId!,
        req.walletAddress!,
        id,
        data
    );

    if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
    }

    res.json({
        message: 'Lesson completed',
        courseCompleted: result.courseCompleted,
    });
});

/**
 * POST /api/lessons/:id/progress
 * Update lesson progress (for tracking video/reading progress)
 */
router.post('/:id/progress', authMiddleware, async (req, res) => {
    const { id } = lessonIdSchema.parse(req.params);
    const data = progressUpdateSchema.parse(req.body);

    const userLesson = await lessonService.updateLessonProgress(
        req.userId!,
        id,
        data
    );

    res.json({ userLesson });
});

/**
 * GET /api/lessons/:id/quiz
 * Get quiz questions (without answers)
 */
router.get('/:id/quiz', authMiddleware, async (req, res) => {
    const { id } = lessonIdSchema.parse(req.params);

    // Check enrollment first
    const lesson = await lessonService.getLesson(id);
    if (!lesson) {
        res.status(404).json({ error: 'Lesson not found' });
        return;
    }

    const enrollment = await prisma.userCourse.findUnique({
        where: {
            userId_courseId: {
                userId: req.userId!,
                courseId: lesson.courseId,
            },
        },
    });

    if (!enrollment) {
        res.status(403).json({ error: 'Not enrolled in this course' });
        return;
    }

    const quiz = await quizService.getQuizQuestions(id);

    if (!quiz) {
        res.status(404).json({ error: 'Quiz not found for this lesson' });
        return;
    }

    // Get user's attempts
    const attempts = await quizService.getUserQuizAttempts(req.userId!, id);

    res.json({
        quiz,
        attempts,
    });
});

/**
 * POST /api/lessons/:id/quiz/submit
 * Submit quiz answers and get results
 */
router.post('/:id/quiz/submit', authMiddleware, async (req, res) => {
    const { id } = lessonIdSchema.parse(req.params);
    const { answers } = quizSubmitSchema.parse(req.body);

    const result = await quizService.submitQuizAnswers(req.userId!, id, answers);

    if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
    }

    res.json({
        score: result.score,
        passed: result.passed,
        correctAnswers: result.correctAnswers,
    });
});

export default router;
