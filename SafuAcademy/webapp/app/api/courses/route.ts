import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CourseService, RelayerService } from '@/lib/services';
import { verifyAuth } from '@/lib/auth';

const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);

export async function GET(request: NextRequest) {
  try {
    const courses = await courseService.getAllCourses();
    const auth = verifyAuth(request);

    // If user is authenticated, include enrollment status
    if (auth) {
      const enrollments = await prisma.userCourse.findMany({
        where: { userId: auth.userId },
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

      return NextResponse.json({ courses: coursesWithProgress });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
