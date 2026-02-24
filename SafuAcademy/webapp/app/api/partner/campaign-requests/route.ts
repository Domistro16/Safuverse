import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

const MIN_PRIZE_POOL_USDC = 15000;
const VALID_TIERS = new Set(["STANDARD", "PREMIUM", "ECOSYSTEM"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const partnerName = String(body.partnerName || "").trim();
    const partnerNamespace = body.partnerNamespace ? String(body.partnerNamespace).trim() : null;
    const campaignTitle = String(body.campaignTitle || "").trim();
    const primaryObjective = String(body.primaryObjective || "").trim();
    const tier = String(body.tier || "").toUpperCase();
    const briefFileName = body.briefFileName ? String(body.briefFileName).trim() : null;
    const prizePoolUsdc = Number(body.prizePoolUsdc);

    if (!partnerName) {
      return NextResponse.json({ error: "partnerName is required" }, { status: 400 });
    }
    if (!campaignTitle) {
      return NextResponse.json({ error: "campaignTitle is required" }, { status: 400 });
    }
    if (!primaryObjective) {
      return NextResponse.json({ error: "primaryObjective is required" }, { status: 400 });
    }
    if (!VALID_TIERS.has(tier)) {
      return NextResponse.json({ error: "tier must be STANDARD, PREMIUM, or ECOSYSTEM" }, { status: 400 });
    }
    if (!Number.isFinite(prizePoolUsdc) || prizePoolUsdc < MIN_PRIZE_POOL_USDC) {
      return NextResponse.json(
        { error: `prizePoolUsdc must be >= ${MIN_PRIZE_POOL_USDC}` },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "CampaignRequest" (
        "id",
        "partnerName",
        "partnerNamespace",
        "campaignTitle",
        "primaryObjective",
        "tier",
        "prizePoolUsdc",
        "briefFileName",
        "status",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${partnerName},
        ${partnerNamespace},
        ${campaignTitle},
        ${primaryObjective},
        ${tier}::"CampaignTier",
        ${prizePoolUsdc},
        ${briefFileName},
        'PENDING'::"CampaignRequestStatus",
        ${now},
        ${now}
      )
    `;

    const [created] = await prisma.$queryRaw<
      Array<{
        id: string;
        partnerName: string;
        campaignTitle: string;
        tier: string;
        prizePoolUsdc: string;
        status: string;
        createdAt: Date;
      }>
    >`SELECT "id","partnerName","campaignTitle","tier","prizePoolUsdc","status","createdAt" FROM "CampaignRequest" WHERE "id" = ${id}`;

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/partner/campaign-requests error", error);
    return NextResponse.json({ error: "Failed to submit campaign request" }, { status: 500 });
  }
}
