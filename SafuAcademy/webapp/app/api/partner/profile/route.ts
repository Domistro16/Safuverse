import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/middleware/admin.middleware";

/**
 * GET /api/partner/profile
 * Returns the authenticated user's partner profile, or 404 if not onboarded.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: auth.user.userId },
  });

  if (!partner) {
    return NextResponse.json({ partner: null }, { status: 404 });
  }

  return NextResponse.json({ partner });
}

/**
 * POST /api/partner/profile
 * Onboard a new partner. Requires orgName in body.
 * If no namespace is provided, generates one from a shortened wallet address.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const existing = await prisma.partner.findUnique({
    where: { userId: auth.user.userId },
  });
  if (existing) {
    return NextResponse.json({ partner: existing });
  }

  const body = await request.json();
  const orgName = String(body.orgName || "").trim();

  if (!orgName) {
    return NextResponse.json({ error: "orgName is required" }, { status: 400 });
  }

  // Namespace: use provided domainName (.id name) if available,
  // otherwise generate from shortened wallet address
  let namespace: string;
  const domainName = body.domainName ? String(body.domainName).trim() : null;

  if (domainName && domainName.length > 0) {
    namespace = domainName;
  } else {
    const addr = auth.user.walletAddress.toLowerCase();
    namespace = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Ensure namespace uniqueness - append a suffix if collision
  let finalNamespace = namespace;
  let attempts = 0;
  while (attempts < 5) {
    const collision = await prisma.partner.findUnique({
      where: { namespace: finalNamespace },
    });
    if (!collision) break;
    attempts++;
    finalNamespace = `${namespace}-${attempts}`;
  }

  const partner = await prisma.partner.create({
    data: {
      userId: auth.user.userId,
      orgName,
      namespace: finalNamespace,
    },
  });

  return NextResponse.json({ partner }, { status: 201 });
}
