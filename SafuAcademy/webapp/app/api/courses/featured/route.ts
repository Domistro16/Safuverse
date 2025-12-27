import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RecommendationService } from '@/lib/services';
import { verifyAuth } from '@/lib/auth';

const recommendationService = new RecommendationService(prisma);

/**
 * GET /api/courses/featured
 * Returns personalized featured courses for authenticated users,
 * or popular/newest courses for unauthenticated users.
 */
export async function GET(request: NextRequest) {
    try {
        // Auth is optional - we'll use fallback for unauthenticated users
        const auth = verifyAuth(request);
        const userId = auth?.userId;

        // Get limit from query params (default 3)
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '3', 10);

        const featuredCourses = await recommendationService.getFeaturedCourses(
            userId,
            Math.min(limit, 10) // Cap at 10
        );

        return NextResponse.json({
            courses: featuredCourses,
            personalized: !!userId,
        });
    } catch (error) {
        console.error('Featured courses error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch featured courses' },
            { status: 500 }
        );
    }
}
