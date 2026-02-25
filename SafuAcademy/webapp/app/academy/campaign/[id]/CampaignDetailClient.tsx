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
      .catch(() => {})
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
      <Link href="/academy" className="mb-6 inline-block text-sm font-medium text-nexid-muted hover:text-white">
        {"<-"} Back to Academy
      </Link>

      <div className="mb-8 flex flex-col gap-8 border-b border-[#1a1a1a] pb-8 lg:flex-row">
        <div className="flex-1">
          <h1 className="font-display mb-4 text-4xl font-bold text-white md:text-5xl">{campaign.title}</h1>
          <p className="max-w-4xl text-sm leading-relaxed text-nexid-muted">{campaign.objective}</p>
        </div>
        <div className="premium-panel w-full shrink-0 bg-[#0a0a0a] p-6 lg:w-80">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">Sponsored By</div>
          <div className="font-display mb-1 text-xl text-white">{campaign.sponsorName}</div>
          {campaign.sponsorNamespace ? (
            <div className="mb-3 font-mono text-[10px] text-nexid-muted">{campaign.sponsorNamespace}</div>
          ) : (
            <div className="mb-3" />
          )}
          <div className="mb-1 text-sm font-bold text-white">${formatUsdc(campaign.prizePoolUsdc)} USDC</div>
          <div className="text-[11px] text-nexid-muted">
            {campaign.tier} · {campaign.ownerType} · {campaign.status}
          </div>
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
        <div className="flex-1">
          <div className="premium-panel mb-6 min-h-[420px] overflow-hidden border border-[#1a1a1a] bg-[#050505]">
            {!isEnded ? (
              <div className="flex h-full flex-col">
                <div className="relative h-[300px] bg-black">
                  <img
                    src={campaignImage}
                    alt={campaign.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 p-6">
                    {hasModules ? (
                      <>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-nexid-gold">
                          {modules[activeModule]?.type ?? "module"}
                        </div>
                        <h3 className="font-display text-2xl text-white">{modules[activeModule]?.title}</h3>
                      </>
                    ) : (
                      <>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-nexid-gold">
                          campaign
                        </div>
                        <h3 className="font-display text-2xl text-white">{campaign.title}</h3>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {hasModules ? (
                    <>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {modules.map((mod, idx) => {
                          const isCompleted = idx <= completedUntil;
                          const isActive = idx === activeModule;
                          const isLocked = mod.type === "locked" && idx > completedUntil + 1;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isLocked}
                              onClick={() => !isLocked && setActiveModule(idx)}
                              className={`rounded border px-3 py-1.5 text-xs ${
                                isActive
                                  ? "border-nexid-gold bg-nexid-gold/10 text-nexid-gold"
                                  : isCompleted
                                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                                    : isLocked
                                      ? "cursor-not-allowed border-[#222] bg-[#111] text-nexid-muted opacity-50"
                                      : "border-[#333] bg-[#111] text-white"
                              }`}
                            >
                              {mod.title}
                            </button>
                          );
                        })}
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

                            // If all modules are now done, call the complete endpoint (DB + on-chain)
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
                          className="rounded bg-nexid-gold px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50"
                        >
                          {completing ? "Completing..." : completedUntil >= modules.length - 1 ? "All Modules Complete" : "Mark Complete"}
                        </button>
                      ) : enrolled && completedAt ? (
                        <div className="rounded border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs text-green-400">
                          Campaign Completed on {formatDate(completedAt) ?? "N/A"}
                        </div>
                      ) : (
                        <div className="text-xs text-nexid-muted">
                          Enroll in this campaign to track module progress.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-nexid-muted">
                      Campaign modules have not been configured yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-10 text-center">
                <h3 className="font-display mb-2 text-3xl text-white">Campaign Concluded</h3>
                <p className="mb-6 text-sm text-nexid-muted">Rewards are distributed by campaign ranking.</p>
                <button
                  type="button"
                  className="cursor-not-allowed rounded border border-[#222] bg-[#111] px-8 py-3 text-sm font-bold text-nexid-muted"
                >
                  Claim Window Managed By Sponsor
                </button>
              </div>
            )}
          </div>

          <div className="premium-panel mb-6 bg-[#0a0a0a] p-6">
            <h3 className="font-display mb-4 text-lg text-white">Key Takeaways</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(campaign.keyTakeaways.length > 0 ? campaign.keyTakeaways : ["No key takeaways published yet."]).map((takeaway) => (
                <div key={takeaway} className="rounded-lg border border-[#222] bg-[#111] p-3 text-xs leading-relaxed text-nexid-muted">
                  {takeaway}
                </div>
              ))}
            </div>
          </div>

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

        <aside className="premium-panel w-full shrink-0 border border-[#1a1a1a] bg-[#0a0a0a] lg:w-[420px]">
          <div className="border-b border-[#1a1a1a] bg-[#111] p-4 text-xs font-bold text-white">
            Campaign Leaderboard
          </div>
          <div className="custom-scroll max-h-[680px] overflow-y-auto">
            {leaderboard.length === 0 ? (
              <div className="p-6 text-sm text-nexid-muted">No leaderboard entries yet.</div>
            ) : (
              leaderboard.map((row, idx) => {
                const rank = row.rank ?? idx + 1;
                return (
                  <div key={`${row.walletAddress}-${rank}`} className="border-b border-[#1a1a1a] p-4 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 text-center font-mono text-xs text-nexid-gold">{rank}</span>
                        <span className="font-mono text-white/90">{shortAddress(row.walletAddress)}</span>
                      </div>
                      <span className="font-mono text-xs text-white">{row.score.toLocaleString()} pts</span>
                    </div>
                    <div className="pl-11 text-[11px] text-nexid-muted">
                      Reward: {row.rewardAmountUsdc ? `$${formatUsdc(row.rewardAmountUsdc)} USDC` : "TBD"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
