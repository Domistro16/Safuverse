import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/stats - Dashboard statistics
 */
export async function GET(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        // Get total counts
        const [totalUsers, totalEnrollments, totalCompletions, totalCourses] = await Promise.all([
            prisma.user.count(),
            prisma.userCourse.count(),
            prisma.userCourse.count({ where: { completedAt: { not: null } } }),
            prisma.course.count(),
        ]);

        // Get course-level stats
        const courseStats = await prisma.course.findMany({
            select: {
                id: true,
                title: true,
                isPublished: true,
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true,
                    },
                },
            },
        });

        // Get completions per course
        const completionsPerCourse = await prisma.userCourse.groupBy({
            by: ['courseId'],
            where: { completedAt: { not: null } },
            _count: true,
        });

        const completionMap = new Map(
            completionsPerCourse.map((c: { courseId: number; _count: number }) => [c.courseId, c._count])
        );

        const coursesWithStats = courseStats.map((course: {
            id: number;
            title: string;
            isPublished: boolean;
            _count: { enrollments: number; lessons: number };
        }) => ({
            courseId: course.id,
            title: course.title,
            isPublished: course.isPublished,
            lessons: course._count.lessons,
            enrollments: course._count.enrollments,
            completions: completionMap.get(course.id) || 0,
        }));

        // Recent enrollments (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentEnrollments = await prisma.userCourse.count({
            where: { enrolledAt: { gte: sevenDaysAgo } },
        });

        const recentCompletions = await prisma.userCourse.count({
            where: { completedAt: { gte: sevenDaysAgo } },
        });

        return NextResponse.json({
            totalUsers,
            totalCourses,
            totalEnrollments,
            totalCompletions,
            recentEnrollments,
            recentCompletions,
            courseStats: coursesWithStats,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
