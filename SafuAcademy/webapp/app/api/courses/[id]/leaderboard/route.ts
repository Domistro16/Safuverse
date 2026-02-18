import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const courseId = Number(id);
        if (Number.isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                isIncentivized: true,
            },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (!course.isIncentivized) {
            return NextResponse.json({ error: 'Leaderboard is only available for incentivized courses' }, { status: 400 });
        }

        const limitParam = Number(request.nextUrl.searchParams.get('limit') || '100');
        const limit = Math.min(Math.max(limitParam, 1), 500);

        const entries = await prisma.userCourse.findMany({
            where: {
                courseId,
                isCompleted: true,
                leaderboardEligible: true,
            },
            select: {
                finalScore: true,
                baseScore: true,
                quizScore: true,
                engagementTimeScore: true,
                actionBoostMultiplier: true,
                idMultiplier: true,
                completedAt: true,
                user: {
                    select: {
                        walletAddress: true,
                    },
                },
            },
            orderBy: [
                { finalScore: 'desc' },
                { completedAt: 'asc' },
            ],
            take: limit,
        });

        return NextResponse.json({
            course,
            entries: entries.map((entry, index) => ({
                rank: index + 1,
                walletAddress: entry.user.walletAddress,
                finalScore: entry.finalScore,
                baseScore: entry.baseScore,
                quizScore: entry.quizScore,
                engagementTimeScore: entry.engagementTimeScore,
                actionBoostMultiplier: entry.actionBoostMultiplier,
                idMultiplier: entry.idMultiplier,
                completedAt: entry.completedAt,
            })),
        });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}

