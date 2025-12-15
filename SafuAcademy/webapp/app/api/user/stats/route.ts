import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = verifyAuth(request);
        if (!auth) {
            return unauthorizedResponse();
        }

        const [
            enrolledCount,
            completedCount,
            lessonsCompleted,
            quizzesPassed,
        ] = await Promise.all([
            prisma.userCourse.count({
                where: { userId: auth.userId },
            }),
            prisma.userCourse.count({
                where: {
                    userId: auth.userId,
                    progress: 100,
                },
            }),
            prisma.userLesson.count({
                where: {
                    userId: auth.userId,
                    completedAt: { not: null },
                },
            }),
            prisma.quizAttempt.count({
                where: {
                    userId: auth.userId,
                    passed: true,
                },
            }),
        ]);

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { points: true },
        });

        return NextResponse.json({
            coursesEnrolled: enrolledCount,
            coursesCompleted: completedCount,
            lessonsCompleted,
            quizzesPassed,
            totalPoints: user?.points || 0,
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
