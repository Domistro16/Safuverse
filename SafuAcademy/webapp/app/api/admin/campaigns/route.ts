import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/middleware/admin.middleware";

const VALID_TIERS = new Set(["STANDARD", "PREMIUM", "ECOSYSTEM"]);
const VALID_STATUSES = new Set(["DRAFT", "LIVE", "ENDED", "ARCHIVED"]);

function slugify(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return normalized || `campaign-${Date.now()}`;
}

async function getUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 2;

  while (true) {
    const [row] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM "Campaign" WHERE "slug" = ${slug}) AS "exists"
    `;
    if (!row?.exists) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

type CampaignRow = {
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
  escrowAddress: string | null;
  onChainCampaignId: number | null;
  requestId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const statusParam = request.nextUrl.searchParams.get("status")?.toUpperCase() ?? null;
    const statusFilter = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : null;

    const whereClause = statusFilter
      ? Prisma.sql`WHERE "status" = ${statusFilter}::"CampaignStatus"`
      : Prisma.empty;

    const campaigns = await prisma.$queryRaw<CampaignRow[]>(
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
          "endAt",
          "escrowAddress",
          "onChainCampaignId",
          "requestId",
          "createdAt",
          "updatedAt"
        FROM "Campaign"
        ${whereClause}
        ORDER BY "createdAt" DESC
      `,
    );

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("GET /api/admin/campaigns error", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();

    const title = String(body.title || "").trim();
    const objective = String(body.objective || "").trim();
    const sponsorName = String(body.sponsorName || "").trim();
    const sponsorNamespace = body.sponsorNamespace ? String(body.sponsorNamespace).trim() : null;
    const category = body.category ? String(body.category).trim() : null;
    const tierRaw = String(body.tier || "").toUpperCase();
    const tier = VALID_TIERS.has(tierRaw) ? tierRaw : "STANDARD";
    const prizePoolUsdc = Number(body.prizePoolUsdc);
    const additionalRewards = body.additionalRewards ? String(body.additionalRewards).trim() : null;
    const statusRaw = String(body.status || "DRAFT").toUpperCase();
    const status = VALID_STATUSES.has(statusRaw) ? statusRaw : "DRAFT";
    const isPublished =
      typeof body.isPublished === "boolean" ? body.isPublished : status === "LIVE";
    const keyTakeaways = Array.isArray(body.keyTakeaways)
      ? body.keyTakeaways.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];
    const startAt = parseDate(body.startAt);
    const endAt = parseDate(body.endAt);

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!objective) {
      return NextResponse.json({ error: "objective is required" }, { status: 400 });
    }
    if (!sponsorName) {
      return NextResponse.json({ error: "sponsorName is required" }, { status: 400 });
    }
    if (!Number.isFinite(prizePoolUsdc) || prizePoolUsdc <= 0) {
      return NextResponse.json({ error: "prizePoolUsdc must be > 0" }, { status: 400 });
    }

    const slug = await getUniqueSlug(slugify(title));

    const [created] = await prisma.$queryRaw<
      Array<{
        id: number;
        slug: string;
        title: string;
        status: string;
        prizePoolUsdc: string;
        isPublished: boolean;
      }>
    >`
      INSERT INTO "Campaign" (
        "slug",
        "title",
        "objective",
        "sponsorName",
        "sponsorNamespace",
        "category",
        "tier",
        "prizePoolUsdc",
        "additionalRewards",
        "status",
        "isPublished",
        "startAt",
        "endAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${slug},
        ${title},
        ${objective},
        ${sponsorName},
        ${sponsorNamespace},
        ${category},
        ${tier}::"CampaignTier",
        ${prizePoolUsdc},
        ${additionalRewards},
        ${status}::"CampaignStatus",
        ${isPublished},
        ${startAt},
        ${endAt},
        ${new Date()},
        ${new Date()}
      )
      RETURNING
        "id",
        "slug",
        "title",
        "status",
        "isPublished",
        "prizePoolUsdc"::text AS "prizePoolUsdc"
    `;

    if (keyTakeaways.length > 0) {
      await prisma.$executeRaw`
        UPDATE "Campaign"
        SET "keyTakeaways" = ${keyTakeaways}::text[]
        WHERE "id" = ${created.id}
      `;
    }

    return NextResponse.json({ campaign: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/campaigns error", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
