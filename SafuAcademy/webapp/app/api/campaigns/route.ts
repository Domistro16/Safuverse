import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const VALID_STATUSES = new Set(["LIVE", "ENDED", "ARCHIVED", "DRAFT"]);

export async function GET(request: NextRequest) {
  try {
    const includeDraft = request.nextUrl.searchParams.get("includeDraft") === "true";
    const statusParam = request.nextUrl.searchParams.get("status")?.toUpperCase() ?? null;
    const statusFilter = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : null;

    const whereStatus = statusFilter
      ? Prisma.sql`AND "status" = ${statusFilter}::"CampaignStatus"`
      : Prisma.empty;

    const whereVisibility = includeDraft
      ? Prisma.sql`WHERE 1 = 1`
      : Prisma.sql`WHERE "isPublished" = true AND "status" IN ('LIVE'::"CampaignStatus", 'ENDED'::"CampaignStatus")`;

    const campaigns = await prisma.$queryRaw<
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
        ${whereVisibility}
        ${whereStatus}
        ORDER BY "createdAt" DESC
      `,
    );

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("GET /api/campaigns error", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
