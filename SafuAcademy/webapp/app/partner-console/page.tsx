"use client";

import { ReactNode, useMemo, useRef, useState } from "react";

type ViewKey = "dashboard" | "analytics" | "brief" | "review";
type CampaignKey = "all" | "soar_ecosystem" | "soar_v1";

const VIEW_TITLES: Record<ViewKey, string> = {
  dashboard: "Command Center",
  analytics: "Telemetry & Data",
  brief: "Campaign Architect",
  review: "Studio Review",
};

const ANALYTICS = {
  all: {
    m1: "36,515",
    m2: "12m 45s",
    m3: "42,104",
    m4: "8,401",
    path: "M0,180 C100,150 200,160 300,100 C400,20 500,140 600,80 C700,40 800,110 900,30 L1000,10",
    dotY: 10,
  },
  soar_ecosystem: {
    m1: "12,405",
    m2: "18m 10s",
    m3: "14,200",
    m4: "1,204",
    path: "M0,150 C100,120 200,180 300,90 C400,0 500,140 600,100 C700,60 800,130 900,40 L1000,20",
    dotY: 20,
  },
  soar_v1: {
    m1: "24,110",
    m2: "08m 20s",
    m3: "27,904",
    m4: "7,197",
    path: "M0,80 C100,100 200,40 300,120 C400,180 500,60 600,140 C700,180 800,90 900,120 L1000,160",
    dotY: 160,
  },
};

function leaderboard(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    rank: i + 1,
    user: `anon_${(i * 73 + 211) % 9999}.id`,
    score: Math.max(1000, 25000 - i * 170),
  }));
}

export default function PartnerConsolePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [campaign, setCampaign] = useState<CampaignKey>("soar_ecosystem");
  const [anaTab, setAnaTab] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [wizardStep, setWizardStep] = useState(1);
  const [tier, setTier] = useState<"standard" | "premium" | "ecosystem">(
    "standard",
  );
  const [prizePool, setPrizePool] = useState(15000);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [primaryObjective, setPrimaryObjective] = useState("");
  const [briefFileName, setBriefFileName] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [pin, setPin] = useState<{ percent: number; time: string } | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const top10 = useMemo(() => leaderboard(10), []);
  const top100 = useMemo(() => leaderboard(100), []);
  const a = ANALYTICS[campaign];
  const stepProgress =
    wizardStep === 1 ? "w-0" : wizardStep === 2 ? "w-1/2" : "w-full";

  const partnerProfile = {
    partnerName: "Soar Protocol",
    partnerNamespace: "admin.soar.id",
  };

  async function submitCampaignRequest() {
    setRequestError(null);
    setRequestSuccess(null);

    if (!campaignTitle.trim()) {
      setRequestError("Campaign title is required.");
      return;
    }
    if (!primaryObjective.trim()) {
      setRequestError("Primary objective is required.");
      return;
    }
    if (prizePool < 15000) {
      setRequestError("Minimum deployment pool is $15,000.");
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/partner/campaign-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: partnerProfile.partnerName,
          partnerNamespace: partnerProfile.partnerNamespace,
          campaignTitle: campaignTitle.trim(),
          primaryObjective: primaryObjective.trim(),
          tier: tier.toUpperCase(),
          prizePoolUsdc: prizePool,
          briefFileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRequestError(data?.error || "Failed to submit campaign request.");
        return;
      }

      setRequestSuccess(
        `Request submitted: ${data?.request?.id ?? "pending id"} (status: ${data?.request?.status ?? "PENDING"})`,
      );
      setWizardStep(1);
      setCampaignTitle("");
      setPrimaryObjective("");
      setBriefFileName(null);
      setPrizePool(15000);
      setTier("standard");
      goView("dashboard");
    } catch {
      setRequestError("Failed to submit campaign request.");
    } finally {
      setSubmittingRequest(false);
    }
  }

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    const totalSeconds = 310;
    const seconds = Math.floor((pct / 100) * totalSeconds);
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    setPin({ percent: pct, time: `${mm}:${ss}` });
  };

  const goView = (next: ViewKey) => {
    setView(next);
    setSidebarOpen(false);
  };

  return (
    <div className="nexid-console h-screen w-full overflow-hidden bg-nexid-base">
      {!isLoggedIn ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030303] bg-[radial-gradient(circle_at_center,rgba(255,176,0,0.03)_0%,transparent_50%)]">
          <div className="w-full max-w-sm animate-[fadeUpConsole_0.8s_cubic-bezier(0.16,1,0.3,1)] p-8">
            <div className="font-display mb-2 text-center text-4xl font-black tracking-tighter">
              NexID<span className="text-nexid-gold">.</span>
            </div>
            <div className="shadow-inner-glaze mx-auto mb-10 w-max rounded border border-[#222] bg-[#0a0a0a] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">
              Enterprise Console
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setIsLoggedIn(true)}
                className="shadow-inner-glaze w-full rounded-lg border border-[#333] bg-[#0a0a0a] py-3.5 text-sm font-medium text-white transition-all hover:border-nexid-gold"
              >
                Connect Deployer Wallet
              </button>
              <div className="relative flex items-center py-2">
                <div className="grow border-t border-[#222]" />
                <span className="mx-4 shrink-0 font-mono text-[10px] uppercase text-nexid-muted">
                  OR
                </span>
                <div className="grow border-t border-[#222]" />
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@protocol.com"
                  className="b2b-input w-full py-3.5 pl-4 pr-24 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsLoggedIn(true)}
                  className="absolute bottom-1.5 right-1.5 top-1.5 rounded border border-[#333] bg-[#111] px-4 text-xs font-medium text-white hover:bg-[#1a1a1a]"
                >
                  Magic Link
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`h-full w-full ${isLoggedIn ? "active" : ""}`} id="app-layout">
        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#1a1a1a] bg-[#050505] transition-transform duration-300 ease-in-out md:static md:w-64 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-[#1a1a1a] px-6">
            <div className="font-display text-xl font-bold tracking-tighter">
              NexID<span className="text-nexid-gold">.</span>{" "}
              <span className="ml-2 rounded border border-[#333] px-1.5 py-0.5 font-mono text-[9px] font-normal tracking-widest text-nexid-muted">
                B2B
              </span>
            </div>
            <button
              type="button"
              className="text-nexid-muted md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              X
            </button>
          </div>

          <div className="p-6 pb-2">
            <div className="shadow-inner-glaze flex items-center gap-3 rounded-lg border border-[#222] bg-[#0a0a0a] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#333] bg-[#111] text-[10px] font-bold text-white">
                SOAR
              </div>
              <div>
                <div className="text-xs font-bold text-white">{partnerProfile.partnerName}</div>
                <div className="font-mono text-[10px] text-nexid-muted">
                  {partnerProfile.partnerNamespace}
                </div>
              </div>
            </div>
          </div>

          <nav className="custom-scroll flex-1 space-y-1 overflow-y-auto px-4 py-6">
            <div className="mb-3 px-2 font-mono text-[9px] uppercase tracking-widest text-nexid-muted">
              Platform
            </div>
            <NavItem label="Dashboard" active={view === "dashboard"} onClick={() => goView("dashboard")} />
            <NavItem label="Live Analytics" active={view === "analytics"} onClick={() => goView("analytics")} />
            <div className="mb-3 mt-8 px-2 font-mono text-[9px] uppercase tracking-widest text-nexid-muted">
              Campaigns
            </div>
            <NavItem label="Draft Review" active={view === "review"} onClick={() => goView("review")} />
            <NavItem label="New Campaign" active={view === "brief"} onClick={() => goView("brief")} />
          </nav>
        </aside>

        <main className="custom-scroll relative flex h-full flex-1 flex-col overflow-y-auto bg-[#030303]">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1a1a1a] bg-[#030303]/90 px-6 backdrop-blur-md lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-white md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
              <h2 className="text-sm font-medium text-white">{VIEW_TITLES[view]}</h2>
            </div>
            <div className="flex items-center gap-2 rounded border border-green-500/20 bg-green-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-green-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Subgraph Synced
            </div>
          </header>

          {view === "dashboard" ? (
            <section className="mx-auto w-full max-w-6xl space-y-8 p-6 lg:p-8">
              <div>
                <h1 className="font-display mb-1 text-2xl text-white">
                  Partner Overview
                </h1>
                <p className="text-sm text-nexid-muted">
                  Track the performance of your active educational campaigns.
                </p>
                {requestSuccess ? (
                  <p className="mt-2 text-xs text-green-400">{requestSuccess}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total Enrollments" value="12,405" sub="14% vs last week" highlight />
                <MetricCard label="Completion Rate" value="68.2%" sub="Avg across 2 campaigns" />
                <MetricCard label="RPC Verifications" value="8,902" sub="Confirmed on-chain" />
                <MetricCard label="Active Prize Pool" value="$25.0k" sub="USDC Locked in Escrow" gold />
              </div>

              <div>
                <h3 className="mb-4 text-sm font-medium text-white">Campaign Management</h3>
                <div className="premium-panel custom-scroll overflow-x-auto bg-[#0a0a0a]">
                  <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#222] bg-[#111]">
                        <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">Campaign Name</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">Status</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">Enrollments</th>
                        <th className="p-4 text-right font-mono text-[10px] uppercase tracking-widest text-nexid-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#1a1a1a]">
                        <td className="p-4 font-medium text-white">Soar Ecosystem: Liquidity & Routing</td>
                        <td className="p-4"><span className="rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-green-400">Live</span></td>
                        <td className="p-4 font-mono text-nexid-muted">12,405</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setCampaign("soar_ecosystem");
                              goView("analytics");
                            }}
                            className="rounded border border-[#333] bg-[#222] px-4 py-1.5 text-xs font-medium text-white"
                          >
                            View Telemetry
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-[#1a1a1a]">
                        <td className="p-4 font-medium text-white">Advanced Tokenomics Architecture</td>
                        <td className="p-4"><span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-red-500">Draft Action Req.</span></td>
                        <td className="p-4 font-mono text-nexid-muted">-</td>
                        <td className="p-4 text-right">
                          <button type="button" onClick={() => goView("review")} className="rounded bg-nexid-gold px-4 py-1.5 text-xs font-bold text-black">Review Studio</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-white/60">Soar V1 Basics</td>
                        <td className="p-4"><span className="rounded border border-[#333] bg-[#222] px-2 py-1 text-[10px] uppercase tracking-wider text-nexid-muted">Concluded</span></td>
                        <td className="p-4 font-mono text-nexid-muted">24,110</td>
                        <td className="p-4 text-right">
                          <button type="button" onClick={() => setRewardOpen(true)} className="rounded border border-nexid-gold px-4 py-1.5 text-xs font-bold text-nexid-gold hover:bg-nexid-gold hover:text-black">Distribute Rewards</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}

          {view === "analytics" ? (
            <section className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-nexid-gold">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-nexid-gold" />
                    Live Telemetry
                  </div>
                  <select
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value as CampaignKey)}
                    className="b2b-input rounded border border-[#222] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
                  >
                    <option value="all">All Campaigns (Aggregate)</option>
                    <option value="soar_ecosystem">Soar Ecosystem: Liquidity & Routing</option>
                    <option value="soar_v1">Soar V1 Basics</option>
                  </select>
                </div>
                <div className="flex rounded-lg border border-[#222] bg-[#0a0a0a] p-1 text-xs font-mono">
                  {(["24h", "7d", "30d", "all"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAnaTab(t)}
                      className={`rounded-md px-4 py-1.5 transition-colors ${anaTab === t ? "bg-[#222] text-white" : "text-nexid-muted"}`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <MetricTile label="Active Students" value={a.m1} />
                <MetricTile label="Avg Watch Time" value={a.m2} />
                <MetricTile label="Tasks Verified" value={a.m3} />
                <MetricTile label="Scorecards Minted" value={a.m4} />
              </div>

              <div className="premium-panel overflow-hidden bg-[#0a0a0a] p-6">
                <div className="mb-6 text-sm font-medium text-white">Engagement Over Time</div>
                <div className="relative h-64 w-full">
                  <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                    <defs>
                      <linearGradient id="chartGradientConsole" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,176,0,0.3)" />
                        <stop offset="100%" stopColor="rgba(255,176,0,0)" />
                      </linearGradient>
                    </defs>
                    <path d={`${a.path} L1000,200 L0,200 Z`} fill="url(#chartGradientConsole)" />
                    <path d={a.path} fill="none" stroke="#ffb000" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="1000" cy={a.dotY} r="5" fill="#ffb000" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="premium-panel h-[380px] overflow-hidden bg-[#0a0a0a] p-6">
                  <h3 className="mb-6 border-b border-[#1a1a1a] pb-4 text-sm font-medium text-white">
                    Syllabus Drop-off Funnel
                  </h3>
                  <FunnelRow label="Mod 1: Intro to AMM" pct={100} />
                  <FunnelRow label="Task 1: X Verification" pct={82} />
                  <FunnelRow label="Mod 2: Liquidity Pools" pct={75} />
                  <FunnelRow label="Task 2: Testnet Swap" pct={68} />
                </div>

                <div className="premium-panel h-[380px] overflow-hidden bg-[#0a0a0a]">
                  <div className="flex items-center justify-between border-b border-[#1a1a1a] bg-[#111] p-5">
                    <h3 className="text-sm font-medium text-white">Top Performers</h3>
                    <span className="font-mono text-[10px] text-nexid-muted">SOAR PTS</span>
                  </div>
                  <div className="custom-scroll h-[280px] overflow-y-auto bg-[#050505] p-2">
                    {top10.map((row) => (
                      <div key={row.rank} className="flex items-center justify-between rounded border-b border-[#1a1a1a] p-2.5 text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`w-4 text-center font-mono ${row.rank <= 3 ? `rank-${row.rank}` : "text-nexid-muted"}`}>{row.rank}</span>
                          <span className="text-white/90">{row.user}</span>
                        </div>
                        <span className="font-mono text-nexid-muted">{row.score.toLocaleString()} pts</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#1a1a1a] bg-[#111] p-3">
                    <button type="button" onClick={() => setLedgerOpen(true)} className="w-full rounded border border-[#333] py-2 text-xs text-white hover:bg-[#222]">
                      View Complete Ledger
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {view === "brief" ? (
            <section className="mx-auto w-full max-w-4xl space-y-8 p-6 lg:p-8">
              <div>
                <h1 className="font-display mb-1 text-2xl text-white">Architect New Campaign</h1>
                <p className="text-sm text-nexid-muted">Submit protocol requirements to the curriculum team. Minimum deployment pool is $15,000 USDC.</p>
              </div>

              <div className="relative flex items-center justify-between px-4">
                <div className="absolute left-4 right-4 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-[#222]" />
                <div className={`absolute left-4 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-nexid-gold transition-all ${stepProgress}`} />
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex flex-col items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${wizardStep >= n ? "bg-nexid-gold text-black" : "border border-[#333] bg-[#111] text-nexid-muted"}`}>{n}</div>
                  </div>
                ))}
              </div>

              {wizardStep === 1 ? (
                <div className="premium-panel space-y-6 bg-[#0a0a0a] p-6 lg:p-8">
                  <Field
                    label="Campaign Title"
                    placeholder="e.g., Advanced Tokenomics Architecture"
                    value={campaignTitle}
                    onChange={setCampaignTitle}
                  />
                  <Field
                    label="Primary Objective"
                    placeholder="Protocol Education & Awareness"
                    value={primaryObjective}
                    onChange={setPrimaryObjective}
                  />
                  <div className="flex justify-end border-t border-[#1a1a1a] pt-6">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      disabled={!campaignTitle.trim() || !primaryObjective.trim()}
                      className="rounded-lg bg-white px-8 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {wizardStep === 2 ? (
                <div className="premium-panel space-y-8 bg-[#0a0a0a] p-6 lg:p-8">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <TierPick name="Standard" value="$15k" active={tier === "standard"} onClick={() => setTier("standard")} />
                    <TierPick name="Premium" value="$50k" active={tier === "premium"} onClick={() => setTier("premium")} />
                    <TierPick name="Ecosystem" value="$100k+" active={tier === "ecosystem"} onClick={() => setTier("ecosystem")} />
                  </div>
                  <label className="upload-area block cursor-pointer rounded-xl bg-[#050505] p-8 text-center text-sm text-nexid-muted">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setBriefFileName(e.target.files?.[0]?.name ?? null)}
                    />
                    {briefFileName ? `Uploaded: ${briefFileName}` : "Click to upload PDF or DOCX"}
                  </label>
                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-nexid-muted">Exact Prize Pool (USDC)</label>
                    <input
                      type="number"
                      min={15000}
                      value={prizePool}
                      onChange={(e) => setPrizePool(Number(e.target.value))}
                      className={`b2b-input w-full px-4 py-3 text-sm font-mono ${prizePool < 15000 ? "border-red-500" : ""}`}
                    />
                    {prizePool < 15000 ? (
                      <p className="mt-1 text-[10px] text-red-500">Minimum deployment pool is $15,000.</p>
                    ) : null}
                  </div>
                  <div className="flex justify-between border-t border-[#1a1a1a] pt-6">
                    <button type="button" onClick={() => setWizardStep(1)} className="rounded-lg border border-[#333] px-6 py-3 text-sm text-white">Back</button>
                    <button type="button" onClick={() => prizePool >= 15000 && setWizardStep(3)} className="rounded-lg bg-white px-8 py-3 text-sm font-bold text-black">Finalize & Book Call</button>
                  </div>
                </div>
              ) : null}

              {wizardStep === 3 ? (
                <div className="premium-panel bg-[#0a0a0a] p-6 lg:p-8">
                  <h3 className="font-display mb-2 text-2xl text-white">Schedule Strategy Call</h3>
                  <p className="mb-8 text-sm text-nexid-muted">Finalize smart contract integrations with the curriculum team.</p>
                  {requestError ? <p className="mb-4 text-xs text-red-500">{requestError}</p> : null}
                  {requestSuccess ? <p className="mb-4 text-xs text-green-400">{requestSuccess}</p> : null}
                  <div className="flex justify-between">
                    <button type="button" onClick={() => setWizardStep(2)} className="rounded-lg border border-[#333] px-6 py-3 text-sm text-white">Back</button>
                    <button
                      type="button"
                      onClick={submitCampaignRequest}
                      disabled={submittingRequest}
                      className="rounded-lg bg-nexid-gold px-8 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingRequest ? "Submitting..." : "Submit Campaign Request"}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {view === "review" ? (
            <section className="flex h-[calc(100vh-64px)] flex-col">
              <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/10 px-6 py-2.5 text-sm text-white">
                <div>
                  <strong>Action Required:</strong> Please review Module 1.
                </div>
                <div className="rounded border border-red-500/30 bg-red-500/5 px-3 py-1 font-mono text-xs text-red-500">
                  Auto-Approves in 71:42:15
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
                <div className="flex flex-1 flex-col items-center justify-center bg-[#050505] p-6">
                  <div className="mb-4 text-sm text-white">Timeline Review</div>
                  <div
                    ref={timelineRef}
                    onClick={handleTimelineClick}
                    className="premium-panel relative h-52 w-full max-w-3xl cursor-crosshair border border-[#222] bg-[#0a0a0a]"
                  >
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 border-t border-white/5 bg-gradient-to-t from-black/90 px-4">
                      <div className="relative mt-4 h-1.5 rounded-full bg-white/20">
                        <div className="h-full w-[30%] rounded-full bg-nexid-gold" />
                        {pin ? <div className="video-pin" style={{ left: `${pin.percent}%` }} /> : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="custom-scroll h-80 w-full overflow-y-auto border-l border-[#1a1a1a] bg-[#0a0a0a] p-4 lg:h-full lg:w-80">
                  <div className="mb-3 text-xs uppercase tracking-widest text-nexid-muted">
                    Timestamped Notes
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#222] bg-[#111] p-3 text-sm text-white/80">
                      Draft generated from your upload. Verify AMM curve at 01:24.
                    </div>
                    {pin ? (
                      <div className="rounded-lg border border-nexid-gold/30 bg-[#050505] p-3 text-sm text-white/80">
                        Feedback pinned at {pin.time}.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {rewardOpen ? (
        <Modal onClose={() => setRewardOpen(false)} title="Final Settlement Execution">
          <p className="mb-4 text-sm text-nexid-muted">Execute distribution for Soar V1 Basics.</p>
          <button type="button" className="rounded-lg bg-green-500 px-6 py-2 text-sm font-bold text-black">
            Sign Transaction & Execute
          </button>
        </Modal>
      ) : null}

      {ledgerOpen ? (
        <Modal onClose={() => setLedgerOpen(false)} title="Campaign Ledger">
          <div className="custom-scroll max-h-[60vh] space-y-2 overflow-y-auto">
            {top100.map((row) => (
              <div key={row.rank} className="flex items-center justify-between rounded border border-[#222] bg-[#050505] p-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-mono ${row.rank <= 3 ? `rank-${row.rank}` : "text-nexid-muted"}`}>{row.rank}</span>
                  <span className="text-white/90">{row.user}</span>
                </div>
                <span className="font-mono text-nexid-muted">{row.score.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-all ${
        active
          ? "border-[#222] bg-[#111] text-white"
          : "border-transparent text-nexid-muted hover:bg-[#111]/50 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({
  label,
  value,
  sub,
  highlight = false,
  gold = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  gold?: boolean;
}) {
  return (
    <div className={`premium-panel p-5 ${gold ? "border-nexid-gold/30" : ""}`}>
      <div className={`mb-2 font-mono text-[10px] uppercase tracking-widest ${gold ? "text-nexid-gold" : "text-nexid-muted"}`}>{label}</div>
      <div className="font-display mb-1 text-3xl text-white">{value}</div>
      <div className={`text-xs ${highlight ? "text-green-400" : "text-nexid-muted"}`}>{sub}</div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-panel bg-[#0a0a0a] p-4">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">
        {label}
      </div>
      <div className="font-display text-2xl text-white">{value}</div>
    </div>
  );
}

function FunnelRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-white">{label}</span>
        <span className="font-mono text-nexid-muted">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-[#111]">
        <div className="h-full rounded bg-nexid-gold" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-nexid-muted">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="b2b-input w-full px-4 py-3 text-sm"
      />
    </div>
  );
}

function TierPick({
  name,
  value,
  active,
  onClick,
}: {
  name: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tier-card rounded-xl p-4 text-center ${active ? "active bg-[#050505]" : "bg-[#111]"}`}
    >
      <div className="mb-1 text-xs font-bold text-white">{name}</div>
      <div className="font-display text-lg text-nexid-gold">{value}</div>
    </button>
  );
}

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="modal-overlay active fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-content relative w-full max-w-2xl rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded border border-[#222] bg-[#111] px-2 py-1 text-nexid-muted">
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
