import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaignId = Number(id);
  const isNumeric = Number.isFinite(campaignId);

  try {
    const whereClause = isNumeric
      ? Prisma.sql`WHERE "id" = ${campaignId}`
      : Prisma.sql`WHERE "slug" = ${id}`;

    const [campaign] = await prisma.$queryRaw<
      Array<{
        id: number;
        slug: string;
        title: string;
        objective: string;
        sponsorName: string;
        sponsorNamespace: string | null;
        category: string | null;
        tier: string;
        prizePoolUsdc: string;
        additionalRewards: string | null;
        keyTakeaways: string[];
        status: string;
        isPublished: boolean;
        startAt: Date | null;
        endAt: Date | null;
      }>
    >(
      Prisma.sql`
        SELECT
          "id",
          "slug",
          "title",
          "objective",
          "sponsorName",
          "sponsorNamespace",
          "category",
          "tier",
          "prizePoolUsdc"::text AS "prizePoolUsdc",
          "additionalRewards",
          "keyTakeaways",
          "status",
          "isPublished",
          "startAt",
          "endAt"
        FROM "Campaign"
        ${whereClause}
        LIMIT 1
      `,
    );

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const leaderboard = await prisma.$queryRaw<
      Array<{
        rank: number | null;
        score: number;
        rewardAmountUsdc: string | null;
        walletAddress: string;
      }>
    >`
      SELECT
        cp."rank",
        cp."score",
        cp."rewardAmountUsdc"::text AS "rewardAmountUsdc",
        u."walletAddress"
      FROM "CampaignParticipant" cp
      INNER JOIN "User" u ON u."id" = cp."userId"
      WHERE cp."campaignId" = ${campaign.id}
      ORDER BY cp."rank" ASC NULLS LAST, cp."score" DESC
      LIMIT 100
    `;

    return NextResponse.json({ campaign, leaderboard });
  } catch (error) {
    console.error("GET /api/campaigns/[id] error", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}
