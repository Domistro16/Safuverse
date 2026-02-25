"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import AdminShell from "../_components/AdminShell";
import {
  useAdminContract,
  type NexIDCreateParams,
  type PartnerCreateParams,
} from "@/hooks/useAdminContract";

type OwnerMode = "NEXID" | "PARTNER";

type ModuleItem = { type: "video" | "task" | "locked"; title: string };

export default function AdminBuilderPage() {
  const { address } = useAccount();
  const {
    createCampaignOnChain,
    loading: contractLoading,
    txHash,
    error: contractError,
    isConfigured,
  } = useAdminContract();

  const [ownerMode, setOwnerMode] = useState<OwnerMode>("PARTNER");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorNamespace, setSponsorNamespace] = useState("");
  const [tier, setTier] = useState("STANDARD");
  const [prizePoolUsdc, setPrizePoolUsdc] = useState(15000);
  const [keyTakeaways, setKeyTakeaways] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txStep, setTxStep] = useState<string | null>(null);

  async function submitCampaign(status: "DRAFT" | "LIVE") {
    setSaving(true);
    setError(null);
    setMessage(null);
    setTxStep(null);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Missing admin auth token.");
        return;
      }

      const resolvedSponsor = ownerMode === "NEXID" ? "NexID Core" : sponsorName.trim();
      if (!resolvedSponsor) {
        setError("Sponsor name is required.");
        return;
      }

      const takeaways = keyTakeaways
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      // Step 1: Create campaign in database
      setTxStep("Creating campaign in database...");
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          objective: objective.trim(),
          sponsorName: resolvedSponsor,
          sponsorNamespace: sponsorNamespace.trim() || null,
          tier,
          ownerType: ownerMode,
          contractType: ownerMode === "NEXID" ? "NEXID_CAMPAIGNS" : "PARTNER_CAMPAIGNS",
          prizePoolUsdc,
          keyTakeaways: takeaways,
          coverImageUrl: coverImageUrl.trim() || null,
          modules,
          status,
          isPublished: status === "LIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to create campaign.");
        return;
      }

      const dbCampaignId = data?.campaign?.id;

      // Step 2: Create campaign on-chain (admin signs tx)
      const contractType = ownerMode === "NEXID" ? "NEXID_CAMPAIGNS" : "PARTNER_CAMPAIGNS";
      if (isConfigured(contractType)) {
        setTxStep("Please confirm the transaction in your wallet...");

        let contractResult: { onChainCampaignId: number; txHash: string } | null = null;

        if (contractType === "NEXID_CAMPAIGNS") {
          const params: NexIDCreateParams = {
            title: title.trim(),
            description: objective.trim(),
            longDescription: objective.trim(),
            instructor: resolvedSponsor,
            objectives: takeaways,
            prerequisites: [],
            category: tier,
            level: "Beginner",
            thumbnailUrl: coverImageUrl.trim() || "",
            duration: "4 weeks",
            totalLessons: BigInt(modules.length || 1),
          };
          contractResult = await createCampaignOnChain("NEXID_CAMPAIGNS", params);
        } else {
          const params: PartnerCreateParams = {
            title: title.trim(),
            description: objective.trim(),
            category: tier,
            level: "Beginner",
            thumbnailUrl: coverImageUrl.trim() || "",
            duration: "4 weeks",
            totalTasks: BigInt(modules.length || 1),
            sponsor: (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
            sponsorName: resolvedSponsor,
            sponsorLogo: coverImageUrl.trim() || "",
            prizePool: BigInt(Math.round(prizePoolUsdc * 1e6)),
            startTime: BigInt(Math.floor(Date.now() / 1000)),
            endTime: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60), // +30 days
          };
          contractResult = await createCampaignOnChain("PARTNER_CAMPAIGNS", params);
        }

        // Step 3: Store on-chain campaign ID in database
        if (contractResult && dbCampaignId) {
          setTxStep("Storing on-chain ID in database...");
          await fetch(`/api/admin/campaigns/${dbCampaignId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              onChainCampaignId: contractResult.onChainCampaignId,
            }),
          });
        }

        if (contractResult) {
          setMessage(
            `Campaign created on-chain! ID: ${contractResult.onChainCampaignId} | Tx: ${contractResult.txHash.slice(0, 10)}...`,
          );
        } else {
          setMessage(
            `Campaign saved to DB (${data?.campaign?.title ?? title}). Contract tx was skipped or failed.`,
          );
        }
      } else {
        setMessage(
          `Campaign created in DB: ${data?.campaign?.title ?? title} (${data?.campaign?.status ?? status}). Contract not configured — skipped on-chain creation.`,
        );
      }

      setTxStep(null);
    } catch {
      setError("Failed to create campaign.");
    } finally {
      setSaving(false);
      setTxStep(null);
    }
  }

  return (
    <AdminShell active="builder">
      <section className="max-w-[1000px] mx-auto">
        <div className="admin-panel bg-[#0a0a0a] p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-display text-2xl text-white mb-1">Campaign Architect</h2>
            <p className="text-xs text-nexid-muted">
              Choose who this campaign is for and the contract mode maps automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setOwnerMode("NEXID")}
              className={`rounded-lg border p-4 text-left ${ownerMode === "NEXID"
                ? "border-nexid-gold bg-nexid-gold/10"
                : "border-[#333] bg-[#111]"
                }`}
            >
              <div className="text-sm font-bold text-white">NexID Internal</div>
              <div className="mt-1 text-[11px] text-nexid-muted">
                Uses `NexIDCampaigns` contract for in-house campaigns.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setOwnerMode("PARTNER")}
              className={`rounded-lg border p-4 text-left ${ownerMode === "PARTNER"
                ? "border-nexid-gold bg-nexid-gold/10"
                : "border-[#333] bg-[#111]"
                }`}
            >
              <div className="text-sm font-bold text-white">Partner Sponsored</div>
              <div className="mt-1 text-[11px] text-nexid-muted">
                Uses `PartnerCampaigns` contract for partner campaigns.
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Campaign Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="admin-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Objective
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="admin-input h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Sponsor / Partner
              </label>
              <input
                type="text"
                value={ownerMode === "NEXID" ? "NexID Core" : sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                disabled={ownerMode === "NEXID"}
                className="admin-input disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Sponsor Namespace
              </label>
              <input
                type="text"
                value={sponsorNamespace}
                onChange={(e) => setSponsorNamespace(e.target.value)}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Tier
              </label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className="admin-input text-white">
                <option value="STANDARD">STANDARD</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ECOSYSTEM">ECOSYSTEM</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Prize Pool (USDC)
              </label>
              <input
                type="number"
                min={1}
                value={prizePoolUsdc}
                onChange={(e) => setPrizePoolUsdc(Number(e.target.value))}
                className="admin-input font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Key Takeaways (One Per Line)
              </label>
              <textarea
                value={keyTakeaways}
                onChange={(e) => setKeyTakeaways(e.target.value)}
                className="admin-input h-28 resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
                className="admin-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">
                Campaign Modules
              </label>
              <div className="space-y-2">
                {modules.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={mod.type}
                      onChange={(e) => {
                        const updated = [...modules];
                        updated[idx] = { ...mod, type: e.target.value as ModuleItem["type"] };
                        setModules(updated);
                      }}
                      className="admin-input w-32 text-white"
                    >
                      <option value="video">Video</option>
                      <option value="task">Task</option>
                      <option value="locked">Locked</option>
                    </select>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const updated = [...modules];
                        updated[idx] = { ...mod, title: e.target.value };
                        setModules(updated);
                      }}
                      placeholder="Module title"
                      className="admin-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setModules(modules.filter((_, i) => i !== idx))}
                      className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-500 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setModules([...modules, { type: "video", title: "" }])}
                  className="rounded border border-[#333] px-3 py-1.5 text-xs text-white hover:bg-[#111]"
                >
                  + Add Module
                </button>
              </div>
            </div>
          </div>

          {error ? <div className="text-xs text-red-500">{error}</div> : null}
          {contractError ? <div className="text-xs text-red-500">{contractError}</div> : null}
          {txStep ? <div className="text-xs text-nexid-gold animate-pulse">{txStep}</div> : null}
          {message ? <div className="text-xs text-green-400">{message}</div> : null}
          {txHash ? (
            <div className="text-[10px] font-mono text-nexid-muted">
              Tx: <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-nexid-gold hover:underline">{String(txHash).slice(0, 14)}...</a>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-[#1a1a1a] pt-5">
            <button
              type="button"
              onClick={() => submitCampaign("DRAFT")}
              disabled={saving || contractLoading}
              className="px-4 py-2 border border-[#333] text-white text-xs font-medium rounded hover:bg-[#111] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => submitCampaign("LIVE")}
              disabled={saving || contractLoading}
              className="px-5 py-2 bg-nexid-gold text-black text-xs font-bold rounded disabled:opacity-60"
            >
              {saving ? "Publishing..." : "Publish Live"}
            </button>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
