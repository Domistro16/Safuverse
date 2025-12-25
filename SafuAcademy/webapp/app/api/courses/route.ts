import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CourseService, RelayerService } from '@/lib/services';
import { verifyAuth } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);

export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/courses started');
    const courses = await courseService.getAllCourses();
    console.log(`[API] Found ${courses.length} courses`);

    const auth = verifyAuth(request);
    console.log('[API] Auth status:', !!auth);

    // If user is authenticated, include enrollment status
    if (auth) {
      console.log(`[API] Fetching enrollments for user ${auth.userId}`);
      const enrollments = await prisma.userCourse.findMany({
        where: { userId: auth.userId },
        select: { courseId: true, progressPercent: true },
      });
      console.log(`[API] Found ${enrollments.length} enrollments`);

      const enrollmentMap = new Map(
        enrollments.map((e: { courseId: number; progressPercent: number }) => [e.courseId, e.progressPercent])
      );

      const coursesWithProgress = courses.map((course: { id: number;[key: string]: unknown }) => ({
        ...course,
        enrolled: enrollmentMap.has(course.id),
        progress: enrollmentMap.get(course.id) || 0,
      }));

      return NextResponse.json({ courses: coursesWithProgress });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[API] Courses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: (error as Error).message },
      { status: 500 }
    );
  }
}
