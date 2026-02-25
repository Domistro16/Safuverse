import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/middleware/admin.middleware";
import { getCampaignRelayer } from "@/lib/services/campaign-relayer.service";

/**
 * POST /api/campaigns/[id]/complete
 * Mark a campaign as completed for the authenticated user (DB + on-chain).
 *
 * The user must be enrolled and not already completed.
 * On-chain: calls completeCampaign() via the relayer (relayer-only on both contracts).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;
  const campaignId = Number(id);
  if (!Number.isFinite(campaignId)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  // Fetch campaign info
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, contractType: true, onChainCampaignId: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Check enrollment
  const participant = await prisma.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId, userId: auth.user.userId } },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not enrolled in this campaign" }, { status: 400 });
  }
  if (participant.completedAt) {
    return NextResponse.json({ error: "Campaign already completed" }, { status: 400 });
  }

  // ── On-chain completion ──
  let onChainTxHash: string | null = null;

  if (campaign.onChainCampaignId !== null) {
    const relayer = getCampaignRelayer();
    const contractType = campaign.contractType as "NEXID_CAMPAIGNS" | "PARTNER_CAMPAIGNS";

    if (relayer.isConfigured(contractType)) {
      const result = await relayer.completeCampaign(
        contractType,
        campaign.onChainCampaignId,
        auth.user.walletAddress,
      );

      if (!result.success) {
        console.error("On-chain completeCampaign failed:", result.error);
        return NextResponse.json(
          { error: "On-chain completion failed", detail: result.error },
          { status: 502 },
        );
      }

      onChainTxHash = result.txHash ?? null;
    }
  }

  // ── DB completion ──
  const updated = await prisma.campaignParticipant.update({
    where: { id: participant.id },
    data: { completedAt: new Date() },
  });

  return NextResponse.json({
    completed: true,
    participant: {
      score: updated.score,
      rank: updated.rank,
      completedAt: updated.completedAt,
    },
    onChainTxHash,
  });
}
