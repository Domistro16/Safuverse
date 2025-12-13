import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { RelayerService } from '../services/relayer.service.js';

const router = Router();
const prisma = new PrismaClient();
const relayerService = new RelayerService(prisma);

/**
 * GET /api/user/profile
 * Get user profile with all courses
 */
router.get('/profile', authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
            id: true,
            walletAddress: true,
            points: true,
            createdAt: true,
            userCourses: {
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            totalLessons: true,
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
            },
        },
    });

    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    res.json({ user });
});

/**
 * GET /api/user/blockchain-status
 * Check on-chain status for user's courses
 */
router.get('/blockchain-status', authMiddleware, async (req, res) => {
    const userCourses = await prisma.userCourse.findMany({
        where: { userId: req.userId },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    });

    const statuses = await Promise.all(
        userCourses.map(async (uc) => {
            const isEnrolledOnChain = await relayerService.isUserEnrolled(
                req.walletAddress!,
                uc.courseId
            );
            const hasCompletedOnChain = await relayerService.hasCompletedCourse(
                req.walletAddress!,
                uc.courseId
            );

            return {
                courseId: uc.courseId,
                courseTitle: uc.course.title,
                dbProgress: uc.progress,
                dbSynced: uc.onChainSynced,
                dbTxHash: uc.txHash,
                onChainEnrolled: isEnrolledOnChain,
                onChainCompleted: hasCompletedOnChain,
            };
        })
    );

    const onChainPoints = await relayerService.getUserPoints(req.walletAddress!);

    res.json({
        walletAddress: req.walletAddress,
        onChainPoints: onChainPoints.toString(),
        dbPoints: (await prisma.user.findUnique({
            where: { id: req.userId },
            select: { points: true },
        }))?.points || 0,
        courses: statuses,
    });
});

/**
 * GET /api/user/transactions
 * Get all blockchain transactions for the user
 */
router.get('/transactions', authMiddleware, async (req, res) => {
    const transactions = await prisma.blockchainTx.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    res.json({ transactions });
});

/**
 * GET /api/user/stats
 * Get user statistics
 */
router.get('/stats', authMiddleware, async (req, res) => {
    const [
        enrolledCount,
        completedCount,
        lessonsCompleted,
        quizzesPassed,
    ] = await Promise.all([
        prisma.userCourse.count({
            where: { userId: req.userId },
        }),
        prisma.userCourse.count({
            where: {
                userId: req.userId,
                progress: 100,
            },
        }),
        prisma.userLesson.count({
            where: {
                userId: req.userId,
                completedAt: { not: null },
            },
        }),
        prisma.quizAttempt.count({
            where: {
                userId: req.userId,
                passed: true,
            },
        }),
    ]);

    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { points: true },
    });

    res.json({
        coursesEnrolled: enrolledCount,
        coursesCompleted: completedCount,
        lessonsCompleted,
        quizzesPassed,
        totalPoints: user?.points || 0,
    });
});

export default router;
