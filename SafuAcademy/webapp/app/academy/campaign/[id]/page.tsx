import { notFound } from "next/navigation";
import { getCampaignById } from "../../_data";
import CampaignDetailClient from "./CampaignDetailClient";

interface CampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params;
  const campaignId = Number(id);

  if (!Number.isFinite(campaignId)) {
    notFound();
  }

  const campaign = getCampaignById(campaignId);
  if (!campaign) {
    notFound();
  }

  return <CampaignDetailClient campaign={campaign} />;
}
