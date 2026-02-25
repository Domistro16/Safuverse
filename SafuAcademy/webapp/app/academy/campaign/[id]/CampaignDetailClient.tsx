"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Campaign = {
  id: number;
  slug: string;
  title: string;
  objective: string;
  sponsorName: string;
  sponsorNamespace: string | null;
  tier: string;
  ownerType: string;
  contractType: string;
  prizePoolUsdc: string;
  keyTakeaways: string[];
  coverImageUrl: string | null;
  modules: Module[];
  status: string;
  isPublished: boolean;
  startAt: string | null;
  endAt: string | null;
  onChainCampaignId: number | null;
};

type LeaderboardRow = {
  rank: number | null;
  score: number;
  rewardAmountUsdc: string | null;
  walletAddress: string;
};

type OnChainSnapshot = {
  contractType: "PARTNER_CAMPAIGNS" | "NEXID_CAMPAIGNS";
  contractAddress: string;
  campaignId: number;
  participantCount: number;
  sponsorAddress: string | null;
} | null;

type CampaignResponse = {
  campaign: Campaign;
  leaderboard: LeaderboardRow[];
  onChain: OnChainSnapshot;
};

type Module = {
  type: "video" | "task" | "locked";
  title: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function shortAddress(value: string) {
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatUsdc(value: string | null) {
  if (!value) return "-";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return amount.toLocaleString();
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface CampaignDetailClientProps {
  campaignId: string;
}

export default function CampaignDetailClient({ campaignId }: CampaignDetailClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CampaignResponse | null>(null);
  const [activeModule, setActiveModule] = useState(0);
  const [completedUntil, setCompletedUntil] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState<"syllabus" | "leaderboard">("syllabus");

  // Enrollment state
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentScore, setEnrollmentScore] = useState(0);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  // Load campaign data
  useEffect(() => {
    let active = true;

    async function loadCampaign() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`, { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error || "Failed to load campaign");
        }
        if (active) {
          setData(body);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load campaign");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCampaign();
    return () => {
      active = false;
    };
  }, [campaignId]);

  // Check enrollment status
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token || !data) return;

    fetch(`/api/campaigns/${campaignId}/enroll`, { headers: authHeaders() })
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json();
          setEnrolled(body.enrolled);
          if (body.participant) {
            setEnrollmentScore(body.participant.score ?? 0);
            if (body.participant.completedAt) {
              setCompletedAt(body.participant.completedAt);
            }
          }
        }
      })
      .catch(() => { })
      .finally(() => setEnrollmentChecked(true));
  }, [campaignId, data]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/enroll`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        const body = await res.json();
        setEnrolled(body.enrolled);
      }
    } catch {
      // silently fail
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-12 pt-10 text-sm text-nexid-muted">
        Loading campaign...
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-12 pt-10">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error || "Campaign not found"}
        </div>
        <Link href="/academy" className="mt-4 inline-block text-sm text-nexid-muted hover:text-white">
          {"<-"} Back to Academy
        </Link>
      </section>
    );
  }

  const { campaign, leaderboard, onChain } = data;
  const isEnded = campaign.status === "ENDED";
  const isLive = campaign.status === "LIVE";
  const modules: Module[] =
    Array.isArray(campaign.modules) && campaign.modules.length > 0
      ? campaign.modules
      : [];
  const hasModules = modules.length > 0;
  const campaignImage = campaign.coverImageUrl || FALLBACK_IMAGE;
  const startDate = formatDate(campaign.startAt);
  const endDate = formatDate(campaign.endAt);
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("auth_token");

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-12 pt-8 lg:px-12">
      {/* Back */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm font-medium text-nexid-muted hover:text-white transition-colors mb-6 group w-max"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Gallery
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-8 border-b border-[#1a1a1a] pb-8 lg:flex-row items-start">
        <div className="flex-1">
          <div className="flex gap-2 mb-4">
            <span className={`${isEnded ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-nexid-gold/10 text-nexid-gold border-nexid-gold/30"} text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest border shadow-inner-glaze`}>
              {campaign.status}
            </span>
          </div>
          <h1 className="font-display mb-4 text-4xl font-bold text-white md:text-5xl tracking-tight leading-tight">{campaign.title}</h1>
          <p className="max-w-4xl text-sm leading-relaxed text-nexid-muted">{campaign.objective}</p>
        </div>
        <div className="premium-panel w-full shrink-0 bg-[#0a0a0a] p-6 lg:w-72 text-right shadow-inner-glaze">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">Sponsored By</div>
          <div className="font-display mb-4 text-xl text-white">{campaign.sponsorName}</div>
          <div className="h-px w-full bg-[#1a1a1a] mb-4" />
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-nexid-gold">Rewards</div>
          <div className="text-sm font-bold text-white">${formatUsdc(campaign.prizePoolUsdc)} USDC</div>
          {(startDate || endDate) ? (
            <div className="mt-2 text-[11px] text-nexid-muted">
              {startDate ? `Start: ${startDate}` : null}
              {startDate && endDate ? " · " : null}
              {endDate ? `End: ${endDate}` : null}
            </div>
          ) : null}

          {isLive && hasToken && enrollmentChecked ? (
            <div className="mt-4">
              {enrolled ? (
                <div className="rounded border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                  Enrolled · Score: {enrollmentScore}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full rounded bg-nexid-gold py-2.5 text-sm font-bold text-black disabled:opacity-50"
                >
                  {enrolling ? "Enrolling..." : "Join Campaign"}
                </button>
              )}
            </div>
          ) : null}
          {isLive && !hasToken ? (
            <div className="mt-4 text-[10px] text-nexid-muted">
              Connect wallet to enroll in this campaign.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Theater Stage */}
          <div className="premium-panel overflow-hidden border border-[#1a1a1a] flex flex-col relative bg-[#050505] min-h-[500px] lg:h-[600px]">
            {!isEnded ? (
              <div className="flex h-full flex-col">
                <div className="relative w-full h-full bg-black">
                  <img
                    src={campaignImage}
                    alt={campaign.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  {hasModules ? (
                    <div className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-end">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-nexid-gold mb-1">
                          Module {activeModule + 1}
                        </div>
                        <h3 className="font-display text-2xl text-white">{modules[activeModule]?.title}</h3>
                      </div>
                      {enrolled && !completedAt ? (
                        <button
                          type="button"
                          disabled={completing}
                          onClick={async () => {
                            const newCompleted = Math.max(completedUntil, activeModule);
                            setCompletedUntil(newCompleted);
                            const next = activeModule + 1;
                            if (next < modules.length && modules[next]?.type !== "locked") {
                              setActiveModule(next);
                            }
                            if (newCompleted >= modules.length - 1) {
                              setCompleting(true);
                              try {
                                const res = await fetch(`/api/campaigns/${campaignId}/complete`, {
                                  method: "POST",
                                  headers: authHeaders(),
                                });
                                if (res.ok) {
                                  const body = await res.json();
                                  setCompletedAt(body.participant?.completedAt ?? new Date().toISOString());
                                }
                              } catch {
                                // silently fail
                              } finally {
                                setCompleting(false);
                              }
                            }
                          }}
                          className="px-6 py-2.5 bg-nexid-gold text-black font-bold text-sm rounded hover:shadow-gold-glow transition-all"
                        >
                          {completing ? "Completing..." : completedUntil >= modules.length - 1 ? "All Complete" : "Mark Complete"}
                        </button>
                      ) : enrolled && completedAt ? (
                        <div className="rounded border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs text-green-400">
                          Completed {formatDate(completedAt) ?? ""}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-nexid-gold mb-2">Campaign</div>
                        <h3 className="font-display text-2xl text-white">{campaign.title}</h3>
                        <p className="text-sm text-nexid-muted mt-2">Modules have not been configured yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center border-t-4 border-nexid-gold">
                <div className="w-24 h-24 rounded-2xl rotate-45 border-2 border-nexid-gold/40 bg-nexid-gold/10 flex items-center justify-center mb-10 shadow-gold-glow">
                  <svg className="w-10 h-10 text-nexid-gold -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-display text-3xl text-white mb-2">Campaign Concluded</h3>
                <p className="text-sm text-nexid-muted mb-8 max-w-sm">Your score has been aggregated. Review your reward eligibility below.</p>
                <button
                  type="button"
                  className="cursor-not-allowed rounded-xl border border-[#222] bg-[#111] px-8 py-4 text-sm font-bold text-nexid-muted uppercase tracking-widest"
                >
                  Claim Window Managed By Sponsor
                </button>
              </div>
            )}
          </div>

          {/* Key Takeaways */}
          <div className="premium-panel p-6 bg-[#0a0a0a]">
            <div className="flex items-center gap-2 mb-4 border-b border-[#1a1a1a] pb-4">
              <svg className="w-5 h-5 text-nexid-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              <h3 className="font-display text-lg text-white">Key Takeaways</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(campaign.keyTakeaways.length > 0 ? campaign.keyTakeaways : ["No key takeaways published yet."]).map((takeaway) => (
                <div key={takeaway} className="flex items-start gap-3 bg-[#111] p-3 rounded-lg border border-[#222]">
                  <div className="w-1.5 h-1.5 rounded-full bg-nexid-gold mt-1.5 shrink-0 shadow-[0_0_5px_#ffb000]" />
                  <p className="text-xs leading-relaxed text-nexid-muted">{takeaway}</p>
                </div>
              ))}
            </div>
          </div>

          {/* On-Chain Snapshot */}
          <div className="premium-panel bg-[#0a0a0a] p-6">
            <h3 className="font-display mb-3 text-lg text-white">On-Chain Snapshot</h3>
            {onChain ? (
              <div className="space-y-2 text-xs text-white/80">
                <div>
                  Contract: <span className="font-mono text-nexid-gold">{onChain.contractType}</span>
                </div>
                <div>
                  Address: <span className="font-mono text-nexid-muted">{shortAddress(onChain.contractAddress)}</span>
                </div>
                <div>
                  On-chain Campaign ID: <span className="font-mono">{onChain.campaignId}</span>
                </div>
                <div>
                  On-chain Participants: <span className="font-mono">{onChain.participantCount}</span>
                </div>
                {onChain.sponsorAddress ? (
                  <div>
                    Sponsor Wallet: <span className="font-mono">{shortAddress(onChain.sponsorAddress)}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-xs text-nexid-muted">
                On-chain mapping not configured for this campaign yet.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[400px] shrink-0 flex flex-col premium-panel border border-[#1a1a1a] bg-[#0a0a0a] lg:h-[calc(600px+150px)]">
          {/* Tabs */}
          <div className="p-2 border-b border-[#1a1a1a] shrink-0 flex gap-2 bg-[#111]">
            <button
              type="button"
              onClick={() => setSidebarTab("syllabus")}
              className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${sidebarTab === "syllabus" ? "bg-[#222] text-white shadow-sm border border-[#333]" : "text-nexid-muted hover:text-white border border-transparent"}`}
            >
              Campaign Ledger
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("leaderboard")}
              className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${sidebarTab === "leaderboard" ? "bg-[#222] text-white shadow-sm border border-[#333]" : "text-nexid-muted hover:text-white border border-transparent"}`}
            >
              Leaderboard
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll relative">
            {/* Syllabus */}
            {sidebarTab === "syllabus" ? (
              <div>
                {isEnded ? (
                  <div className="p-6 text-center text-sm text-nexid-muted">Campaign ended. Modules locked. Check claim status.</div>
                ) : hasModules ? (
                  modules.map((mod, idx) => {
                    const isCompleted = idx <= completedUntil;
                    const isActive = idx === activeModule;
                    const isLocked = mod.type === "locked" && idx > completedUntil + 1;
                    const stateClass = isCompleted ? "completed" : isActive ? "active" : isLocked ? "locked" : "";

                    return (
                      <div
                        key={idx}
                        className={`syllabus-item ${stateClass} p-4 border-b border-[#1a1a1a] flex gap-4 ${!isLocked ? "cursor-pointer" : ""}`}
                        onClick={() => !isLocked && setActiveModule(idx)}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center shrink-0">
                          {isCompleted ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ) : isActive ? (
                            <span className="w-3 h-3 bg-nexid-gold rounded-full shadow-[0_0_10px_#ffb000] pulse-gold" />
                          ) : isLocked ? (
                            <svg className="w-4 h-4 text-[#555]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          ) : (
                            <span className="w-2 h-2 bg-[#333] rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-nexid-muted mb-1 uppercase tracking-widest">{mod.type}</div>
                          <div className="text-sm font-medium text-white">{mod.title}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-sm text-nexid-muted">Campaign modules have not been configured yet.</div>
                )}
              </div>
            ) : (
              /* Leaderboard */
              <div className="p-2 space-y-1">
                {leaderboard.length === 0 ? (
                  <div className="p-6 text-sm text-nexid-muted">No leaderboard entries yet.</div>
                ) : (
                  leaderboard.map((row, idx) => {
                    const rank = row.rank ?? idx + 1;
                    const color = rank === 1 ? "text-[#FFD700]" : rank === 2 ? "text-[#C0C0C0]" : rank === 3 ? "text-[#CD7F32]" : "text-nexid-muted";
                    return (
                      <div key={`${row.walletAddress}-${rank}`} className="p-2.5 rounded hover:bg-[#111] flex items-center justify-between transition-colors border-b border-[#1a1a1a] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 text-center font-mono text-xs font-bold ${color}`}>{rank}</div>
                          <div className="font-medium text-white/90 text-xs">{shortAddress(row.walletAddress)}</div>
                        </div>
                        <div className={`font-mono text-xs ${color}`}>{row.score.toLocaleString()} pts</div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
