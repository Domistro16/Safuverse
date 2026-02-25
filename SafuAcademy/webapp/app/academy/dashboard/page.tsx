"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

type GlobalView = "dashboard" | "profile";
type ProfileTab = "general" | "wallets" | "security" | "prefs";
type LeaderboardTab = "24h" | "7d" | "all";

const CAROUSEL = [
  {
    tag: "TRENDING",
    title: "L2 Rollup Architecture",
    desc: "Master ZK vs Optimistic.",
    img: "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80&w=800",
  },
  {
    tag: "NEW",
    title: "Advanced Tokenomics",
    desc: "Design sustainable economies.",
    img: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=800",
  },
  {
    tag: "SECURITY",
    title: "DeFi Auditing",
    desc: "Identify smart contract vulnerabilities.",
    img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800",
  },
];

const LEDGER = [
  { name: "Smart Contracts w/ Desmond", active: true, progress: "72%" },
  { name: "Identity Fundamentals", active: false, progress: "100%" },
  { name: "Web3 Economics", active: false, progress: "100%" },
  { name: "Zero-Knowledge Proofs 101", active: false, progress: "100%" },
  { name: "Solidity Best Practices", active: false, progress: "100%" },
  { name: "EVM Under the Hood", active: false, progress: "100%" },
  { name: "L2 Scaling Solutions", active: false, progress: "100%" },
  { name: "Cross-Chain Bridges", active: false, progress: "100%" },
  { name: "Governance & DAOs", active: false, progress: "100%" },
  { name: "NFT Metadata Standards", active: false, progress: "100%" },
];

export default function SovereignTerminalPage() {
  const [view, setView] = useState<GlobalView>("dashboard");
  const [profileTab, setProfileTab] = useState<ProfileTab>("general");
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>("24h");
  const [slide, setSlide] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [top100Open, setTop100Open] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [cardTransform, setCardTransform] = useState("rotateX(0deg) rotateY(0deg)");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlide((prev) => (prev + 1) % CAROUSEL.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const topRows = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        rank: i + 4,
        name: `anon_${(i * 353 + 77) % 9999}.id`,
        score: 80000 - i * 3500,
      })),
    [],
  );

  const top100 = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        rank: i + 1,
        name: `anon_${(i * 187 + 109) % 9999}.id`,
        score: 100000 - i * 730,
      })),
    [],
  );

  const handleCardMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -12;
    const ry = ((x - cx) / cx) * 12;
    setCardTransform(`rotateX(${rx}deg) rotateY(${ry}deg)`);
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleCardLeave = () => {
    setCardTransform("rotateX(0deg) rotateY(0deg)");
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="nexid-terminal flex h-screen overflow-hidden">
      <aside className="z-40 flex w-20 shrink-0 flex-col border-r border-nexid-border bg-nexid-base/90 backdrop-blur-xl lg:w-64">
        <div className="flex h-20 cursor-pointer items-center justify-center border-b border-nexid-border lg:justify-start lg:px-8">
          <div className="font-display text-2xl font-black tracking-tighter">
            N<span className="hidden lg:inline">ex</span>ID
            <span className="text-nexid-gold">.</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-8">
          <SideItem label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <SideItem label="Profile Settings" active={view === "profile"} onClick={() => setView("profile")} />
        </nav>
      </aside>

      <main className="custom-scroll relative flex h-full flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b border-nexid-border bg-nexid-base/80 px-8 backdrop-blur-md">
          <h1 className="font-display text-xl tracking-tight text-white">
            {view === "dashboard" ? "Dashboard" : "Profile Settings"}
          </h1>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-3 md:flex">
              <div className="shadow-inner-glaze rounded-md border border-[#222] bg-[#111] px-3 py-1.5 font-mono text-[11px] text-nexid-gold">
                <span className="mr-2 text-white/40">BAL</span> 14,200 Nex Points
              </div>
            </div>
            <button type="button" onClick={() => setView("profile")} className="h-9 w-9 rounded-full border border-[#333] p-0.5 hover:border-nexid-gold">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150"
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            </button>
          </div>
        </header>

        {view === "dashboard" ? (
          <section className="mx-auto w-full max-w-[1400px] space-y-8 p-6 lg:p-10">
            <div className="grid auto-rows-fr grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="id-card-wrapper min-h-[220px]">
                <div
                  ref={cardRef}
                  className="id-card premium-panel relative h-full w-full cursor-crosshair overflow-hidden border-white/10 p-6 shadow-premium"
                  style={{ transform: cardTransform }}
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                >
                  <div className="id-card-bg" />
                  <div
                    className="id-card-glare"
                    style={{
                      opacity: glare.opacity,
                      background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.15), transparent 50%)`,
                    }}
                  />
                  <div className="id-card-content relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-display text-2xl font-black text-white">
                          NexID<span className="text-nexid-gold">.</span>
                        </div>
                        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-nexid-gold">
                          Sovereign Asset
                        </div>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-nexid-gold/30 bg-nexid-gold/10">
                        <span className="text-xs text-nexid-gold">✓</span>
                      </div>
                    </div>
                    <div className="mt-8">
                      <div className="font-display mb-1 text-3xl tracking-tight text-white">
                        founder.id
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-white/60">
                        <span>0x71C8...976F</span>
                        <span>EST. 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-panel group relative flex min-h-[220px] flex-col justify-between overflow-hidden p-6">
                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity transition-transform duration-1000 group-hover:scale-105" />
                <div className="relative z-10 mb-6 flex items-start justify-between">
                  <div className="shadow-inner-glaze rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white border border-white/10">Active Module</div>
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">▶</button>
                </div>
                <div className="relative z-10 mt-auto">
                  <h3 className="font-display mb-1 text-lg text-white">Smart Contracts w/ Desmond</h3>
                  <p className="mb-4 text-xs text-nexid-muted">Infrastructure Gas Optimization</p>
                  <div className="flex items-center gap-4">
                    <div className="h-1 flex-1 overflow-hidden rounded-full border border-white/5 bg-black">
                      <div className="h-full w-[72%] bg-nexid-gold shadow-[0_0_10px_#ffb000]" />
                    </div>
                    <span className="font-mono text-xs text-nexid-gold">72%</span>
                  </div>
                </div>
              </div>

              <div className="premium-panel relative min-h-[220px] overflow-hidden">
                <div className="absolute right-4 top-4 z-20 flex gap-1.5">
                  {CAROUSEL.map((_, idx) => (
                    <div key={idx} className={`h-1.5 w-1.5 rounded-full ${slide === idx ? "bg-nexid-gold" : "bg-white/20"}`} />
                  ))}
                </div>
                {CAROUSEL.map((item, idx) => (
                  <div key={item.title} className={`carousel-item flex h-full flex-col justify-between p-6 ${slide === idx ? "active" : ""}`}>
                    <img src={item.img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
                    <div className="relative z-10 self-start rounded border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white">{item.tag}</div>
                    <div className="relative z-10">
                      <h3 className="font-display mb-1 text-lg text-white">{item.title}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="truncate pr-4 text-xs text-nexid-muted">{item.desc}</p>
                        <button type="button" className="shrink-0 rounded bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black">Join</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="premium-panel flex h-[500px] flex-col lg:col-span-7">
                <div className="flex items-center justify-between border-b border-[#1a1a1a] p-5">
                  <h3 className="font-display text-lg text-white">Global Hierarchy</h3>
                  <div className="flex rounded-md border border-[#222] bg-[#050505] p-1 font-mono text-[10px]">
                    {(["24h", "7d", "all"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setLeaderboardTab(tab)}
                        className={`rounded px-3 py-1 transition-colors ${leaderboardTab === tab ? "bg-[#222] text-white" : "text-nexid-muted"}`}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="custom-scroll flex-1 overflow-y-auto p-3">
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-nexid-gold/30 bg-[#111]/95 p-3">
                    <div className="flex items-center gap-4">
                      <div className="w-6 text-center font-mono text-sm font-bold text-nexid-gold">42</div>
                      <div className="font-medium text-white">founder.id <span className="rounded border border-white/5 bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-nexid-muted">YOU</span></div>
                    </div>
                    <div className="font-mono text-sm text-nexid-gold">14,200 pts</div>
                  </div>

                  <RankRow rank={1} name="vitalik.id" score="98,450 pts" />
                  <RankRow rank={2} name="satoshi.id" score="89,200 pts" />
                  <RankRow rank={3} name="punk6529.id" score="85,110 pts" />
                  {topRows.map((r) => (
                    <RankRow key={r.rank} rank={r.rank} name={r.name} score={`${r.score.toLocaleString()} pts`} />
                  ))}
                </div>
                <div className="rounded-b-xl border-t border-[#1a1a1a] bg-[#0a0a0a] p-4">
                  <button type="button" onClick={() => setTop100Open(true)} className="w-full rounded-lg border border-[#222] bg-[#111] py-2.5 text-sm font-medium text-white hover:border-white/20">
                    View Top 100 Ledger
                  </button>
                </div>
              </div>

              <div className="premium-panel flex h-[500px] flex-col lg:col-span-5">
                <div className="flex items-center justify-between border-b border-[#1a1a1a] p-5">
                  <h3 className="font-display flex items-center gap-2 text-lg text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                    Global Comm
                  </h3>
                  <button type="button" onClick={() => setRulesOpen(true)} className="rounded border border-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-nexid-gold hover:border-nexid-gold/30">
                    Protocol Rules
                  </button>
                </div>
                <div className="custom-scroll flex-1 space-y-5 overflow-y-auto p-5 text-sm">
                  <ChatLine user="desmond.id" time="14:02 UTC" text="Gas optimization module is live. Review registry state variables closely." />
                  <ChatLine user="builder.id" time="14:05 UTC" text="Working through the array packing section now." />
                  <ChatLine user="nuvyx.id" time="14:12 UTC" text="Anyone routed .id data to Soar yet? Need eyes on REST API." />
                </div>
                <div className="rounded-b-xl border-t border-[#1a1a1a] bg-[#0a0a0a] p-4">
                  <div className="flex items-center rounded-lg border border-[#222] bg-[#111]">
                    <span className="absolute ml-3 font-mono text-[10px] tracking-widest text-nexid-gold">founder.id &gt;</span>
                    <input type="text" placeholder="Execute message..." className="w-full border-none bg-transparent py-3 pl-[90px] pr-10 text-sm text-white placeholder:text-nexid-muted/50 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display mb-4 text-xl text-white">Academic Ledger</h3>
              <div className="premium-panel overflow-hidden">
                <div className="divide-y divide-[#1a1a1a]">
                  {LEDGER.map((item) => (
                    <div key={item.name} className="flex flex-col items-center gap-5 p-5 transition-colors hover:bg-[#111] sm:flex-row">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-[#050505] shadow-inner-glaze ${item.active ? "border-nexid-gold/30" : "border-white/5 opacity-50"}`}>⬢</div>
                      <div className="w-full flex-1">
                        <h4 className="mb-1 text-sm font-medium text-white">{item.name}</h4>
                        {item.active ? (
                          <div className="flex items-center gap-3">
                            <div className="h-1 flex-1 overflow-hidden rounded-full border border-[#222] bg-black">
                              <div className="h-full bg-nexid-gold" style={{ width: item.progress }} />
                            </div>
                            <span className="font-mono text-[10px] text-nexid-gold">{item.progress}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-nexid-muted">Completed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0a0a0a] p-4">
                  <button type="button" onClick={() => setLedgerOpen(true)} className="w-full rounded-lg border border-[#222] bg-[#111] py-3 text-sm font-medium text-white hover:border-white/20">
                    View Complete Academic Ledger
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {view === "profile" ? (
          <section className="mx-auto w-full max-w-6xl space-y-8 p-6 lg:p-10">
            <div className="flex flex-col gap-6 border-b border-nexid-border pb-8 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-6">
                <div className="group relative h-28 w-28 cursor-pointer rounded-full border border-nexid-gold/50 p-1 shadow-gold-glow">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300" alt="" className="h-full w-full rounded-full object-cover" />
                </div>
                <div>
                  <h2 className="font-display mb-1.5 flex items-center gap-3 text-4xl font-bold tracking-tight text-white">
                    founder.id <span className="text-blue-400">✔</span>
                  </h2>
                  <div className="font-mono text-[11px] text-nexid-muted">
                    <span className="shadow-inner-glaze rounded border border-[#222] bg-[#111] px-2 py-0.5 text-white">0x71C8...976F</span>
                  </div>
                </div>
              </div>
              <button type="button" className="rounded-lg bg-white px-8 py-3 text-sm font-bold text-black">Save Matrix</button>
            </div>

            <div className="flex flex-col gap-10 md:flex-row">
              <nav className="custom-scroll flex w-full flex-row gap-1.5 overflow-x-auto pb-4 md:w-56 md:flex-col md:pb-0">
                <ProfileTabButton tab="general" active={profileTab === "general"} onClick={setProfileTab} label="Identity Matrix" />
                <ProfileTabButton tab="wallets" active={profileTab === "wallets"} onClick={setProfileTab} label="Nodes & Socials" />
                <ProfileTabButton tab="security" active={profileTab === "security"} onClick={setProfileTab} label="Security Auth" />
                <ProfileTabButton tab="prefs" active={profileTab === "prefs"} onClick={setProfileTab} label="Preferences" />
              </nav>

              <div className="min-h-[500px] max-w-3xl flex-1">
                {profileTab === "general" ? <GeneralPanel /> : null}
                {profileTab === "wallets" ? <WalletPanel /> : null}
                {profileTab === "security" ? <SecurityPanel /> : null}
                {profileTab === "prefs" ? <PrefsPanel /> : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {rulesOpen ? (
        <Modal title="Terminal Protocol" onClose={() => setRulesOpen(false)}>
          <div className="mb-8 space-y-4 border-y border-[#222] py-6 text-sm leading-relaxed text-nexid-muted">
            <p><strong className="text-white/80">No Media Attachments:</strong> Text stream only.</p>
            <p><strong className="text-white/80">Zero External Links:</strong> External URLs are removed automatically.</p>
            <p><strong className="text-white/80">No Spam or Sybil Attacks:</strong> Abuse triggers temporary bans.</p>
            <p><strong className="text-white/80">Verifiable Networking:</strong> Use `.id` namespaces for trusted collaboration.</p>
          </div>
          <button type="button" onClick={() => setRulesOpen(false)} className="w-full rounded-lg bg-nexid-gold py-3.5 text-sm font-bold uppercase tracking-widest text-black">I Acknowledge</button>
        </Modal>
      ) : null}

      {top100Open ? (
        <Modal title="Top 100 Ledger" onClose={() => setTop100Open(false)} maxWidth="max-w-2xl" fullHeight>
          <div className="custom-scroll flex-1 space-y-1 overflow-y-auto rounded-lg border border-[#1a1a1a] bg-[#050505] p-2">
            {top100.map((row) => (
              <div key={row.rank} className="flex items-center justify-between rounded border-b border-[#111] p-3 text-sm last:border-0 hover:bg-[#0d0d0d]">
                <div className="flex items-center gap-6">
                  <div className={`w-8 text-right font-mono font-black ${row.rank <= 3 ? `rank-${row.rank}` : "text-nexid-muted"}`}>{row.rank}</div>
                  <div className="text-white/90">{row.name}</div>
                </div>
                <div className={`font-mono text-xs ${row.rank <= 3 ? `rank-${row.rank}` : "text-nexid-muted"}`}>{row.score.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}

      {ledgerOpen ? (
        <Modal title="Complete Academic Ledger" onClose={() => setLedgerOpen(false)} maxWidth="max-w-4xl" fullHeight>
          <div className="custom-scroll flex-1 overflow-y-auto rounded-xl border border-[#1a1a1a] bg-[#050505] p-2">
            {Array.from({ length: 10 }, (_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-5 rounded-lg border-b border-[#111] p-5 transition-colors last:border-0 hover:bg-[#0d0d0d] sm:flex-row">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#333] bg-[#111]">⬢</div>
                <div className="w-full flex-1">
                  <h4 className="mb-1 text-sm font-medium text-white">{["Web3 Economics", "Zero-Knowledge Proofs 101", "Solidity Best Practices", "EVM Under the Hood", "L2 Scaling Solutions", "Cross-Chain Bridges", "Governance & DAOs", "NFT Metadata Standards", "Smart Contract Auditing", "Decentralized Storage"][idx]}</h4>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-green-400">VERIFIED ON-CHAIN</div>
                </div>
                <div className="text-xs text-nexid-muted">Score: {90 + (idx % 10)}%</div>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function SideItem({
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
      className={`group flex w-full items-center justify-center gap-4 rounded-xl px-3 py-3.5 transition-all lg:justify-start lg:px-4 ${active ? "border border-[#222] bg-[#111] text-white" : "border border-transparent text-nexid-muted hover:bg-white/5 hover:text-white"}`}
    >
      <span className="hidden text-sm font-medium lg:block">{label}</span>
      <span className="text-sm lg:hidden">•</span>
    </button>
  );
}

function RankRow({ rank, name, score }: { rank: number; name: string; score: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-[#111]">
      <div className="flex items-center gap-4">
        <div className={`w-6 text-center font-mono text-xs ${rank <= 3 ? `rank-${rank}` : "text-nexid-muted"} ${rank <= 3 ? "font-bold" : ""}`}>
          {rank}
        </div>
        <div className="text-sm font-medium text-white/80">{name}</div>
      </div>
      <div className={`font-mono text-xs ${rank <= 3 ? `rank-${rank}` : "text-nexid-muted"}`}>
        {score}
      </div>
    </div>
  );
}

function ChatLine({ user, time, text }: { user: string; time: string; text: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-xs font-medium text-white">{user}</span>
        <span className="font-mono text-[9px] text-nexid-muted">{time}</span>
      </div>
      <div className="text-sm leading-relaxed text-white/80">{text}</div>
    </div>
  );
}

function ProfileTabButton({
  tab,
  active,
  onClick,
  label,
}: {
  tab: ProfileTab;
  active: boolean;
  onClick: (tab: ProfileTab) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(tab)}
      className={`w-full flex-shrink-0 rounded-md px-4 py-3 text-left text-sm font-medium ${active ? "border border-[#222] bg-[#111] text-white" : "border border-transparent text-nexid-muted hover:bg-[#111]/50 hover:text-white"}`}
    >
      {label}
    </button>
  );
}

function GeneralPanel() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display mb-2 text-2xl text-white">Identity Matrix</h3>
        <p className="text-sm text-nexid-muted">Manage your public-facing resolver data.</p>
      </div>
      <div className="rounded-lg border border-nexid-gold/30 bg-nexid-gold/10 p-4 text-sm leading-relaxed text-nexid-gold/90">
        Updating fields executes a transaction to your `.id` resolver contract.
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Public Alias" value="NexID Founder" />
        <Field label="Timezone" value="UTC (Coordinated Universal Time)" />
      </div>
    </div>
  );
}

function WalletPanel() {
  return (
    <div className="space-y-8">
      <h3 className="font-display text-2xl text-white">Nodes & Socials</h3>
      <div className="rounded-lg border border-[#222] bg-[#0a0a0a] p-4">
        <div className="text-sm font-medium text-white">Ethereum Mainnet</div>
        <div className="mt-0.5 font-mono text-[10px] text-nexid-muted">0x71C...976F</div>
      </div>
      <div className="rounded-lg border border-[#222] bg-[#0a0a0a] p-4">
        <div className="text-sm font-medium text-white">X (Twitter)</div>
        <div className="mt-0.5 font-mono text-[10px] text-nexid-muted">@NexID_Founder</div>
      </div>
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="space-y-8">
      <h3 className="font-display text-2xl text-white">Security Auth</h3>
      <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-6">
        <h4 className="mb-1 text-sm font-bold text-white">Hardware Passkey</h4>
        <p className="mb-4 text-xs text-nexid-muted">Require hardware passkey for high-risk profile actions.</p>
        <button type="button" className="rounded bg-white px-4 py-2 text-xs font-bold text-black">Initialize</button>
      </div>
    </div>
  );
}

function PrefsPanel() {
  return (
    <div className="space-y-8">
      <h3 className="font-display text-2xl text-white">Preferences</h3>
      <div className="rounded-lg border border-[#222] bg-[#0a0a0a] p-4">
        <div className="mb-1 text-sm font-medium text-white">Academic Alerts</div>
        <div className="text-[11px] text-nexid-muted">Push notifications for modules and grading.</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-nexid-muted">
        {label}
      </label>
      <input type="text" defaultValue={value} className="w-full rounded-lg border border-[#222] bg-[#0a0a0a] px-4 py-3 text-sm text-white" />
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  maxWidth = "max-w-lg",
  fullHeight = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: string;
  fullHeight?: boolean;
}) {
  return (
    <div className="modal-overlay active fixed inset-0 flex items-center justify-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className={`modal-content premium-panel relative w-full ${maxWidth} ${fullHeight ? "h-[80vh] flex flex-col" : ""} p-6`}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-2xl text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md border border-[#222] bg-[#111] p-2 text-nexid-muted">
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}