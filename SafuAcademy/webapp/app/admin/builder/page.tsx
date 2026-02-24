"use client";

import { useState } from "react";
import AdminShell from "../_components/AdminShell";

type OwnerMode = "NEXID" | "PARTNER";

export default function AdminBuilderPage() {
  const [ownerMode, setOwnerMode] = useState<OwnerMode>("PARTNER");
  const [title, setTitle] = useState("Advanced Web3 Economics");
  const [objective, setObjective] = useState("Educate users on tokenomics and protocol participation.");
  const [sponsorName, setSponsorName] = useState("NexID Core");
  const [sponsorNamespace, setSponsorNamespace] = useState("founder.id");
  const [tier, setTier] = useState("STANDARD");
  const [prizePoolUsdc, setPrizePoolUsdc] = useState(15000);
  const [keyTakeaways, setKeyTakeaways] = useState(
    "Understand tokenomics models.\nAnalyze liquidity bootstrapping.\nImplement vesting schedules safely.",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitCampaign(status: "DRAFT" | "LIVE") {
    setSaving(true);
    setError(null);
    setMessage(null);

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
          status,
          isPublished: status === "LIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to create campaign.");
        return;
      }

      setMessage(
        `Campaign created: ${data?.campaign?.title ?? title} (${data?.campaign?.status ?? status})`,
      );
    } catch {
      setError("Failed to create campaign.");
    } finally {
      setSaving(false);
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
              className={`rounded-lg border p-4 text-left ${
                ownerMode === "NEXID"
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
              className={`rounded-lg border p-4 text-left ${
                ownerMode === "PARTNER"
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
          </div>

          {error ? <div className="text-xs text-red-500">{error}</div> : null}
          {message ? <div className="text-xs text-green-400">{message}</div> : null}

          <div className="flex flex-wrap gap-3 border-t border-[#1a1a1a] pt-5">
            <button
              type="button"
              onClick={() => submitCampaign("DRAFT")}
              disabled={saving}
              className="px-4 py-2 border border-[#333] text-white text-xs font-medium rounded hover:bg-[#111] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => submitCampaign("LIVE")}
              disabled={saving}
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
