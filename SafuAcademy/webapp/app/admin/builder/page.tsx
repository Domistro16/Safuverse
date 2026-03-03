"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import AdminShell from "../_components/AdminShell";
import {
  buildPartnerModuleGroupsFromItems,
  flattenCampaignModuleItems,
  type CampaignModuleItem,
} from "@/lib/campaign-modules";
import {
  useAdminContract,
  type NexIDCreateParams,
  type PartnerCreateParams,
} from "@/hooks/useAdminContract";

type OwnerMode = "NEXID" | "PARTNER";

type ModuleItem = CampaignModuleItem;

export default function AdminBuilderPage() {
  const { address } = useAccount();
  const {
    createCampaignOnChain,
    createEscrowCampaign,
    isEscrowConfigured,
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
  const [prizePoolUsdc, setPrizePoolUsdc] = useState(0);
  const [keyTakeaways, setKeyTakeaways] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txStep, setTxStep] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"global" | number>("global");

  // Edit mode
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("edit");
  const [editId, setEditId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!editIdParam) return;
    const id = Number(editIdParam);
    if (!Number.isFinite(id)) return;
    setEditId(id);
    setEditLoading(true);
    const token = localStorage.getItem("auth_token");
    fetch(`/api/admin/campaigns/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((body) => {
        const c = body.campaign;
        if (!c) return;
        setTitle(c.title || "");
        setObjective(c.objective || "");
        setSponsorName(c.sponsorName || "");
        setSponsorNamespace(c.sponsorNamespace || "");
        setTier(c.tier || "STANDARD");
        setOwnerMode(c.ownerType === "NEXID" ? "NEXID" : "PARTNER");
        setPrizePoolUsdc(Number(c.prizePoolUsdc) || 0);
        setKeyTakeaways(Array.isArray(c.keyTakeaways) ? c.keyTakeaways.join("\n") : "");
        setCoverImageUrl(c.coverImageUrl || "");
        if (Array.isArray(c.modules)) {
          const flattened = flattenCampaignModuleItems(c.modules).map((item) => ({
            ...item,
            points: typeof item.points === "number" ? item.points : 100,
          }));
          setModules(flattened);
        }
      })
      .catch(() => setError("Failed to load campaign for editing."))
      .finally(() => setEditLoading(false));
  }, [editIdParam]);

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
      const partnerModuleGroups =
        ownerMode === "PARTNER" ? buildPartnerModuleGroupsFromItems(modules) : null;
      const modulesPayload = partnerModuleGroups ?? modules;
      const moduleCountForProgress = modulesPayload.length;

      // If editing, use PATCH instead of POST
      if (editId) {
        setTxStep("Updating campaign...");
        const patchRes = await fetch(`/api/admin/campaigns/${editId}`, {
          method: "PATCH",
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
              modules: modulesPayload,
              status,
              isPublished: status === "LIVE",
            }),
          });
        const patchData = await patchRes.json();
        if (!patchRes.ok) {
          setError(patchData?.error || "Failed to update campaign.");
        } else {
          setMessage(`Campaign updated: ${patchData?.campaign?.title ?? title}`);
        }
        setTxStep(null);
        setSaving(false);
        return;
      }

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
          modules: modulesPayload,
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
            totalLessons: BigInt(moduleCountForProgress || 1),
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
            totalTasks: BigInt(moduleCountForProgress || 1),
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

          // Step 4: Create escrow campaign (partner campaigns only)
          if (contractType === "PARTNER_CAMPAIGNS" && isEscrowConfigured) {
            setTxStep("Creating escrow campaign — confirm in wallet...");
            const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);
            const escrowResult = await createEscrowCampaign(
              contractResult.onChainCampaignId,
              (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
              endTime,
            );

            if (escrowResult) {
              setTxStep("Storing escrow ID in database...");
              await fetch(`/api/admin/campaigns/${dbCampaignId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  escrowId: escrowResult.escrowId,
                }),
              });
            }
          }
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
    <AdminShell active="builder" noPadding>
      <div className="flex flex-col h-full bg-black">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-[#1a1a1a] px-6 bg-[#030303] shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display text-white">
              {editId ? `Draft: ${title || "Untitled Campaign"}` : `New Campaign`}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {txStep && <span className="text-xs text-nexid-gold animate-pulse">{txStep}</span>}
            {message && <span className="text-xs text-green-400">{message}</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
            <span className="text-xs text-nexid-muted">
              {saving ? "Saving..." : editId ? "Auto-saved" : "Draft Mode"}
            </span>
            <button
              onClick={() => submitCampaign("DRAFT")}
              disabled={saving || contractLoading}
              className="px-4 py-2 text-xs font-semibold text-white border border-[#333] rounded hover:bg-[#111] transition-colors disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={() => submitCampaign("LIVE")}
              disabled={saving || contractLoading}
              className="px-6 py-2 text-xs font-bold text-black bg-nexid-gold rounded hover:bg-[#e5c100] transition-colors disabled:opacity-50"
            >
              Publish Live
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Syllabus */}
          <aside className="w-80 border-r border-[#1a1a1a] bg-[#030303] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
              <span className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest">Syllabus Outline</span>
              <button
                onClick={() => setModules([...modules, { type: "task", title: "New Module", points: 100 }])}
                className="text-white hover:text-nexid-gold transition-colors text-xl leading-none"
                title="Add module"
              >
                +
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
              <button
                onClick={() => setActiveSection("global")}
                className={`w-full text-left flex items-start gap-4 p-4 rounded-lg border transition-all ${activeSection === "global" ? "bg-[#111] border-[#333]" : "border-transparent hover:bg-[#0a0a0a]"
                  }`}
              >
                <div className="mt-0.5 text-nexid-muted text-lg opacity-80">⚙</div>
                <div>
                  <div className="text-sm font-bold text-white">Campaign Global Settings</div>
                  <div className="text-[10px] text-nexid-muted mt-1 font-mono">Core configuration</div>
                </div>
              </button>

              {modules.map((mod, idx) => {
                const isActive = activeSection === idx;
                let icon = "📄";
                let subtitle = "Generic Module";
                if (mod.type === "video") {
                  icon = "📹";
                  subtitle = "Video Embed";
                } else if (mod.type === "task") {
                  icon = "✕";
                  subtitle = "Social / On-Chain Verification";
                } else if (mod.type === "quiz") {
                  icon = "❓";
                  subtitle = `Overlay @ ${(idx + 1).toString().padStart(2, "0")}:00`;
                } else if (mod.type === "locked") {
                  icon = "🔒";
                  subtitle = "Locked Module";
                }
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSection(idx)}
                    className={`group w-full text-left flex items-start gap-4 p-4 rounded-lg border transition-all ${isActive ? "bg-[#111] border-[#333]" : "border-transparent hover:bg-[#0a0a0a]"
                      }`}
                  >
                    <div className="mt-0.5 text-nexid-muted text-sm opacity-80">{icon}</div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold text-white truncate">
                        {idx + 1}. {mod.title || "Untitled Module"}
                      </div>
                      <div className="text-[10px] text-nexid-muted mt-1 font-mono tracking-wide">{subtitle}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModules(modules.filter((_, i) => i !== idx));
                        if (activeSection === idx) setActiveSection("global");
                        else if (typeof activeSection === "number" && activeSection > idx) setActiveSection(activeSection - 1);
                      }}
                      className="text-nexid-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete module"
                    >
                      ✕
                    </button>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-[#1a1a1a] mt-4">
                <button
                  onClick={() => setModules([...modules, { type: "task", title: "New Module", points: 100 }])}
                  className="w-full py-4 border border-dashed border-[#333] text-[10px] font-mono font-bold text-nexid-muted uppercase tracking-widest rounded-lg hover:border-nexid-gold hover:text-nexid-gold transition-colors flex items-center justify-center gap-2 bg-[#050505]"
                >
                  <span className="text-lg leading-none mb-0.5">+</span> ADD MODULE
                </button>
              </div>
            </div>
          </aside>

          {/* Right Panel - Configuration */}
          <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8 md:p-12 lg:p-16 custom-scroll">
            <div className="max-w-3xl">
              {activeSection === "global" ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <h2 className="font-display text-2xl text-white mb-8 pb-4 border-b border-[#1a1a1a]">Global Settings</h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setOwnerMode("NEXID")}
                      className={`rounded-xl border p-5 text-left transition-colors ${ownerMode === "NEXID" ? "border-nexid-gold bg-nexid-gold/10" : "border-[#333] bg-[#111] hover:bg-[#1a1a1a]"
                        }`}
                    >
                      <div className="text-base font-bold text-white">NexID Internal</div>
                      <div className="mt-2 text-xs text-nexid-muted leading-relaxed">
                        Uses `NexIDCampaigns` contract for in-house campaigns with no escrow.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnerMode("PARTNER")}
                      className={`rounded-xl border p-5 text-left transition-colors ${ownerMode === "PARTNER" ? "border-nexid-gold bg-nexid-gold/10" : "border-[#333] bg-[#111] hover:bg-[#1a1a1a]"
                        }`}
                    >
                      <div className="text-base font-bold text-white">Partner Sponsored</div>
                      <div className="mt-2 text-xs text-nexid-muted leading-relaxed">
                        Uses `PartnerCampaigns` contract. Requires escrow funding.
                      </div>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                        Campaign Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="admin-input text-base py-3"
                        placeholder="e.g. Advanced Tokenomics"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                        Objective / Description
                      </label>
                      <textarea
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="admin-input h-32 resize-none py-3"
                        placeholder="Detailed description of what the user will learn..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                        Sponsor / Partner Name
                      </label>
                      <input
                        type="text"
                        value={ownerMode === "NEXID" ? "NexID Core" : sponsorName}
                        onChange={(e) => setSponsorName(e.target.value)}
                        disabled={ownerMode === "NEXID"}
                        className="admin-input py-3 disabled:opacity-50"
                        placeholder="e.g. Soar Protocol"
                      />
                    </div>

                    {ownerMode === "PARTNER" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                            Sponsor Namespace
                          </label>
                          <input
                            type="text"
                            value={sponsorNamespace}
                            onChange={(e) => setSponsorNamespace(e.target.value)}
                            className="admin-input py-3"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                            Tier
                          </label>
                          <select value={tier} onChange={(e) => setTier(e.target.value)} className="admin-input py-3 bg-[#111] text-white">
                            <option value="STANDARD">STANDARD</option>
                            <option value="PREMIUM">PREMIUM</option>
                            <option value="ECOSYSTEM">ECOSYSTEM</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                            Prize Pool (USDC)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={prizePoolUsdc}
                            onChange={(e) => setPrizePoolUsdc(Number(e.target.value))}
                            className="admin-input py-3 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                        Key Takeaways (One Per Line)
                      </label>
                      <textarea
                        value={keyTakeaways}
                        onChange={(e) => setKeyTakeaways(e.target.value)}
                        className="admin-input h-32 resize-none py-3"
                        placeholder="- Learn how ID routing works&#10;- Understand the tokenomics&#10;- Execute a swap"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">
                        Cover Image URL
                      </label>
                      <input
                        type="url"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="admin-input py-3"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                typeof activeSection === "number" && modules[activeSection] && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#1a1a1a]">
                      <h2 className="font-display text-2xl text-white">Module {activeSection + 1}</h2>
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest">Type:</label>
                        <select
                          value={modules[activeSection].type}
                          onChange={(e) => {
                            const updated = [...modules];
                            const newType = e.target.value as ModuleItem["type"];
                            const mod = updated[activeSection];
                            updated[activeSection] = {
                              type: newType,
                              title: mod.title,
                              points: mod.points ?? 100,
                              ...(newType === "video" ? { videoUrl: "", description: "" } : {}),
                              ...(newType === "task" ? { description: "", actionUrl: "", actionLabel: "" } : {}),
                              ...(newType === "quiz" ? { question: "", options: ["", "", "", ""], correctIndex: 0 } : {}),
                            };
                            setModules(updated);
                          }}
                          className="admin-input py-2 text-sm bg-[#111]"
                        >
                          <option value="video">Video Embed</option>
                          <option value="task">Task / Verification</option>
                          <option value="quiz">Quiz Overlay</option>
                          <option value="locked">Locked</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Module Title</label>
                          <input
                            type="text"
                            value={modules[activeSection].title}
                            onChange={(e) => {
                              const updated = [...modules];
                              updated[activeSection] = { ...updated[activeSection], title: e.target.value };
                              setModules(updated);
                            }}
                            placeholder="e.g. Intro to Tokenomics"
                            className="admin-input py-3"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Points</label>
                          <input
                            type="number"
                            min={0}
                            value={modules[activeSection].points ?? 100}
                            onChange={(e) => {
                              const updated = [...modules];
                              updated[activeSection] = { ...updated[activeSection], points: Number(e.target.value) };
                              setModules(updated);
                            }}
                            className="admin-input py-3 font-mono"
                          />
                        </div>
                      </div>

                      {/* Video Specific */}
                      {modules[activeSection].type === "video" && (
                        <div className="p-6 border border-[#222] bg-[#111]/50 rounded-xl space-y-6">
                          <div>
                            <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Video URL Embed</label>
                            <input
                              type="url"
                              value={modules[activeSection].videoUrl || ""}
                              onChange={(e) => {
                                const updated = [...modules];
                                updated[activeSection] = { ...updated[activeSection], videoUrl: e.target.value };
                                setModules(updated);
                              }}
                              placeholder="Synthesia or YouTube embed URL"
                              className="admin-input py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Short Description</label>
                            <input
                              type="text"
                              value={modules[activeSection].description || ""}
                              onChange={(e) => {
                                const updated = [...modules];
                                updated[activeSection] = { ...updated[activeSection], description: e.target.value };
                                setModules(updated);
                              }}
                              placeholder="Optional context for the video"
                              className="admin-input py-3"
                            />
                          </div>
                        </div>
                      )}

                      {/* Task Specific */}
                      {modules[activeSection].type === "task" && (
                        <div className="p-6 border border-[#222] bg-[#111]/50 rounded-xl space-y-6">
                          <div>
                            <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Task Instructions</label>
                            <textarea
                              value={modules[activeSection].description || ""}
                              onChange={(e) => {
                                const updated = [...modules];
                                updated[activeSection] = { ...updated[activeSection], description: e.target.value };
                                setModules(updated);
                              }}
                              placeholder="Clear instructions on what the user needs to do..."
                              className="admin-input py-3 h-24 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Action URL</label>
                              <input
                                type="url"
                                value={modules[activeSection].actionUrl || ""}
                                onChange={(e) => {
                                  const updated = [...modules];
                                  updated[activeSection] = { ...updated[activeSection], actionUrl: e.target.value };
                                  setModules(updated);
                                }}
                                placeholder="https://..."
                                className="admin-input py-3"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Action Button Label</label>
                              <input
                                type="text"
                                value={modules[activeSection].actionLabel || ""}
                                onChange={(e) => {
                                  const updated = [...modules];
                                  updated[activeSection] = { ...updated[activeSection], actionLabel: e.target.value };
                                  setModules(updated);
                                }}
                                placeholder="e.g. Go to Twitter"
                                className="admin-input py-3"
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#222]">
                            <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-3">Verification Method</label>
                            <select
                              value={modules[activeSection].verificationType || "none"}
                              onChange={(e) => {
                                const updated = [...modules];
                                updated[activeSection] = { ...updated[activeSection], verificationType: e.target.value as ModuleItem["verificationType"] };
                                setModules(updated);
                              }}
                              className="admin-input py-3 bg-[#0a0a0a]"
                            >
                              <option value="none">Self-Reported (Click to Verify)</option>
                              <option value="discord-join">Discord Validation: Must join server</option>
                              <option value="discord-post">Discord Validation: Must post in channel</option>
                            </select>

                            {(modules[activeSection].verificationType === "discord-join" || modules[activeSection].verificationType === "discord-post") && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <label className="block text-[10px] font-mono text-[#888] mb-1.5">Guild/Server ID</label>
                                  <input
                                    type="text"
                                    value={modules[activeSection].guildId || ""}
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      updated[activeSection] = { ...updated[activeSection], guildId: e.target.value };
                                      setModules(updated);
                                    }}
                                    className="admin-input py-2 font-mono text-xs"
                                  />
                                </div>
                                {modules[activeSection].verificationType === "discord-post" && (
                                  <div>
                                    <label className="block text-[10px] font-mono text-[#888] mb-1.5">Channel ID</label>
                                    <input
                                      type="text"
                                      value={modules[activeSection].channelId || ""}
                                      onChange={(e) => {
                                        const updated = [...modules];
                                        updated[activeSection] = { ...updated[activeSection], channelId: e.target.value };
                                        setModules(updated);
                                      }}
                                      className="admin-input py-2 font-mono text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quiz Specific */}
                      {modules[activeSection].type === "quiz" && (
                        <div className="p-6 border border-[#222] bg-[#111]/50 rounded-xl space-y-6">
                          <div>
                            <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-2">Quiz Question</label>
                            <input
                              type="text"
                              value={modules[activeSection].question || ""}
                              onChange={(e) => {
                                const updated = [...modules];
                                updated[activeSection] = { ...updated[activeSection], question: e.target.value };
                                setModules(updated);
                              }}
                              placeholder="e.g. What is the primary function of a .id domain?"
                              className="admin-input py-3"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-3">Options (Select Correct Answer)</label>
                            <div className="space-y-3">
                              {(modules[activeSection].options || ["", "", "", ""]).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-4">
                                  <label className="relative flex cursor-pointer items-center rounded-full p-2">
                                    <input
                                      type="radio"
                                      name={`quiz-correct-${activeSection}`}
                                      checked={modules[activeSection].correctIndex === optIdx}
                                      onChange={() => {
                                        const updated = [...modules];
                                        updated[activeSection] = { ...updated[activeSection], correctIndex: optIdx };
                                        setModules(updated);
                                      }}
                                      className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-full border border-[#444] text-nexid-gold transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-nexid-gold checked:before:bg-nexid-gold hover:before:opacity-10"
                                    />
                                    <span className="absolute text-nexid-gold transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                                        <circle data-name="ellipse" cx="8" cy="8" r="8"></circle>
                                      </svg>
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...modules];
                                      const opts = [...(modules[activeSection].options || ["", "", "", ""])];
                                      opts[optIdx] = e.target.value;
                                      updated[activeSection] = { ...updated[activeSection], options: opts };
                                      setModules(updated);
                                    }}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className={`admin-input py-3 flex-1 ${modules[activeSection].correctIndex === optIdx ? "border-nexid-gold/50 bg-nexid-gold/5" : ""}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminShell>
  );
}
