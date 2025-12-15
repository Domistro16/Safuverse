import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RelayerService } from '@/lib/services';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

const relayerService = new RelayerService(prisma);

export async function GET(request: NextRequest) {
    try {
        const auth = verifyAuth(request);
        if (!auth) {
            return unauthorizedResponse();
        }

        const userCourses = await prisma.userCourse.findMany({
            where: { userId: auth.userId },
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
                    auth.walletAddress,
                    uc.courseId
                );
                const hasCompletedOnChain = await relayerService.hasCompletedCourse(
                    auth.walletAddress,
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

        const onChainPoints = await relayerService.getUserPoints(auth.walletAddress);

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { points: true },
        });

        return NextResponse.json({
            walletAddress: auth.walletAddress,
            onChainPoints: onChainPoints.toString(),
            dbPoints: user?.points || 0,
            courses: statuses,
        });
    } catch (error) {
        console.error('Blockchain status error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blockchain status' },
            { status: 500 }
        );
    }
}
