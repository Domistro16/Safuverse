import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaignId = Number(id);

  if (!Number.isFinite(campaignId)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  try {
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
      WHERE cp."campaignId" = ${campaignId}
      ORDER BY cp."rank" ASC NULLS LAST, cp."score" DESC
      LIMIT 100
    `;

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("GET /api/partner/campaigns/[id]/leaderboard error", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
