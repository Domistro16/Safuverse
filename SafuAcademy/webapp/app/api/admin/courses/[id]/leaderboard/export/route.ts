import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';

function toCsvCell(value: string | number | null): string {
    if (value === null) return '';
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await params;
        const courseId = Number(id);
        if (Number.isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                title: true,
                isIncentivized: true,
            },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (!course.isIncentivized) {
            return NextResponse.json({ error: 'CSV export is only available for incentivized courses' }, { status: 400 });
        }

        const topNParam = Number(request.nextUrl.searchParams.get('top') || '100');
        const topN = Math.min(Math.max(topNParam, 1), 5000);

        const entries = await prisma.userCourse.findMany({
            where: {
                courseId,
                isCompleted: true,
                leaderboardEligible: true,
            },
            orderBy: [{ finalScore: 'desc' }, { completedAt: 'asc' }],
            take: topN,
            select: {
                finalScore: true,
                baseScore: true,
                quizScore: true,
                engagementTimeScore: true,
                completedAt: true,
                user: {
                    select: {
                        walletAddress: true,
                    },
                },
            },
        });

        const lines = [
            ['rank', 'wallet_address', 'final_score', 'base_score', 'quiz_score', 'engagement_time_score', 'completed_at'].join(','),
            ...entries.map((entry, index) => [
                index + 1,
                toCsvCell(entry.user.walletAddress),
                entry.finalScore,
                entry.baseScore,
                entry.quizScore,
                entry.engagementTimeScore,
                entry.completedAt ? toCsvCell(entry.completedAt.toISOString()) : '',
            ].join(',')),
        ];

        return new NextResponse(lines.join('\n'), {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="course-${courseId}-leaderboard-top-${topN}.csv"`,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to export leaderboard CSV' },
            { status: 500 }
        );
    }
}

