import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { verifyAdmin } from "@/lib/middleware/admin.middleware";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/stats - Campaign-first dashboard statistics
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const [totalUsers, totalCampaignParticipants, totalCompletedParticipants] = await Promise.all([
      prisma.user.count(),
      prisma.campaignParticipant.count(),
      prisma.campaignParticipant.count({ where: { completedAt: { not: null } } }),
    ]);

    const [campaignCounts] = await prisma.$queryRaw<
      Array<{ totalCampaigns: number; pendingCampaignRequests: number }>
    >`
      SELECT
        (SELECT COUNT(*)::int FROM "Campaign") AS "totalCampaigns",
        (SELECT COUNT(*)::int FROM "CampaignRequest" WHERE "status" = 'PENDING'::"CampaignRequestStatus") AS "pendingCampaignRequests"
    `;

    const campaignStats = await prisma.$queryRaw<
      Array<{
        campaignId: number;
        title: string;
        status: string;
        participants: number;
        completions: number;
      }>
    >(Prisma.sql`
      SELECT
        c."id" AS "campaignId",
        c."title",
        c."status"::text AS "status",
        COUNT(cp."id")::int AS "participants",
        COUNT(cp."completedAt")::int AS "completions"
      FROM "Campaign" c
      LEFT JOIN "CampaignParticipant" cp ON cp."campaignId" = c."id"
      GROUP BY c."id", c."title", c."status"
      ORDER BY c."id" DESC
      LIMIT 50
    `);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentEnrollments, recentCompletions] = await Promise.all([
      prisma.campaignParticipant.count({ where: { enrolledAt: { gte: sevenDaysAgo } } }),
      prisma.campaignParticipant.count({ where: { completedAt: { gte: sevenDaysAgo } } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalCampaigns: campaignCounts?.totalCampaigns ?? 0,
      pendingCampaignRequests: campaignCounts?.pendingCampaignRequests ?? 0,
      totalCampaignParticipants,
      totalCompletedParticipants,
      recentEnrollments,
      recentCompletions,
      campaignStats,
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
