export type Filter = "all" | "defi" | "infra" | "identity" | "ended";

export type Module = {
  type: "video" | "task" | "locked";
  title: string;
  desc?: string;
};

export type Campaign = {
  id: number;
  title: string;
  cat: Filter;
  tag: "Live" | "Evergreen" | "Ended";
  pool: string;
  sponsor: string;
  img: string;
  ended: boolean;
  points: number;
  modules: Module[];
  takeaways: string[];
  claimState?: "claimable" | "claimed";
  claimAmount?: string;
};

const BASE_MODULES: Module[] = [
  { type: "video", title: "Core Concepts" },
  { type: "task", title: "Community Verify", desc: "Follow protocol on X." },
  { type: "video", title: "Advanced Execution" },
  { type: "task", title: "On-Chain Activity", desc: "Execute a testnet action." },
  { type: "locked", title: "Final Review", desc: "Unlocks in 24 hours." },
];

export const CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    title: "Soar Ecosystem: Liquidity & Routing",
    cat: "defi",
    tag: "Live",
    pool: "$25,000 USDC + 1k Free .id",
    sponsor: "Soar Protocol",
    img: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=1600",
    ended: false,
    points: 5000,
    modules: BASE_MODULES,
    takeaways: [
      "Master AMM constant product logic.",
      "Deploy liquidity safely on L2s.",
      "Understand slippage and IL metrics.",
      "Execute low-latency routing.",
    ],
  },
  {
    id: 2,
    title: "Smart Contract Infrastructure",
    cat: "infra",
    tag: "Evergreen",
    pool: "$5,000 USDC + SBT",
    sponsor: "NexID Core",
    img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    ended: false,
    points: 2200,
    modules: BASE_MODULES,
    takeaways: [
      "Trace contract architecture by call-path.",
      "Understand deployment lifecycle and observability.",
      "Verify state transitions on-chain.",
      "Apply secure integration patterns.",
    ],
  },
  {
    id: 3,
    title: "ENS vs .id Routing",
    cat: "identity",
    tag: "Live",
    pool: "$2,000 USDC + Free .id",
    sponsor: "NexID",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    ended: false,
    points: 3500,
    modules: BASE_MODULES,
    takeaways: [
      "Compare resolver models and naming trust.",
      "Implement reverse lookup patterns.",
      "Integrate decentralized identity at app level.",
      "Model account abstraction identity UX.",
    ],
  },
  {
    id: 4,
    title: "Phantom Security Bootcamp",
    cat: "ended",
    tag: "Ended",
    pool: "$50,000 USDC Dist.",
    sponsor: "Phantom",
    img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800",
    ended: true,
    points: 0,
    modules: [],
    takeaways: [
      "Operationalize wallet security policy.",
      "Detect social engineering vectors.",
      "Apply custody hygiene across teams.",
      "Respond to incident patterns quickly.",
    ],
    claimState: "claimable",
    claimAmount: "250 USDC",
  },
  {
    id: 5,
    title: "Genesis Node Deployment",
    cat: "ended",
    tag: "Ended",
    pool: "$100,000 USDC Dist.",
    sponsor: "NexID",
    img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=800",
    ended: true,
    points: 0,
    modules: [],
    takeaways: [
      "Model node architecture across environments.",
      "Instrument service-level telemetry.",
      "Control rollout risk and rollback safety.",
      "Harden uptime and scaling operations.",
    ],
    claimState: "claimed",
    claimAmount: "1,000 USDC",
  },
];

export const FAQS = [
  {
    q: "How are USDC rewards distributed?",
    a: "Rewards are distributed from sponsor liquidity pools via contract settlement. Eligible users sign a claim transaction.",
  },
  {
    q: "How do on-chain verifications work?",
    a: "Backend verification queries chain RPC for your wallet's required transactions before unlocking the next module.",
  },
  {
    q: "Can I transfer my sovereign scorecard?",
    a: "No, scorecards are soulbound and permanently tied to your identity namespace.",
  },
];

export function getCampaignById(id: number): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}
