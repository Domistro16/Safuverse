"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  status: string;
  isPublished: boolean;
  startAt: string | null;
  endAt: string | null;
  participantCount: number;
  topScore: number;
  totalScore: number;
};

type StatusFilter = "all" | "live" | "ended";

function formatUsdc(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString();
}

export default function AcademyBrowsePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "reward" | "newest">("featured");

  useEffect(() => {
    let active = true;

    async function loadCampaigns() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/campaigns", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load campaigns");
        }
        if (active) {
          setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load campaigns");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCampaigns();
    return () => {
      active = false;
    };
  }, []);

  const featuredCampaign = useMemo(() => {
    if (campaigns.length === 0) return null;
    const scored = [...campaigns].sort((a, b) => {
      const aScore = a.participantCount * 100 + a.totalScore;
      const bScore = b.participantCount * 100 + b.totalScore;
      return bScore - aScore;
    });
    return scored[0];
  }, [campaigns]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = campaigns.filter((campaign) => {
      const statusMatch =
        statusFilter === "all"
          ? true
          : statusFilter === "live"
            ? campaign.status === "LIVE"
            : campaign.status === "ENDED";

      const searchMatch =
        query.length === 0
          ? true
          : campaign.title.toLowerCase().includes(query) ||
            campaign.sponsorName.toLowerCase().includes(query);

      return statusMatch && searchMatch;
    });

    if (sortBy === "reward") {
      items.sort((a, b) => Number(b.prizePoolUsdc) - Number(a.prizePoolUsdc));
    } else if (sortBy === "newest") {
      items.sort((a, b) => b.id - a.id);
    } else {
      items.sort((a, b) => {
        const aScore = a.participantCount * 100 + a.totalScore;
        const bScore = b.participantCount * 100 + b.totalScore;
        return bScore - aScore;
      });
    }

    return items;
  }, [campaigns, search, sortBy, statusFilter]);

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-10 pt-12 lg:px-12">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display mb-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            Campaign Academy
          </h1>
          <p className="max-w-3xl text-lg text-nexid-muted">
            Complete live campaigns, verify tasks, and climb each campaign leaderboard.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns..."
          className="hidden w-60 rounded-full border border-[#222] bg-[#0a0a0a] px-4 py-2 text-xs text-white lg:block"
        />
      </div>

      {error ? (
        <div className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {featuredCampaign ? (
        <Link
          href={`/academy/campaign/${featuredCampaign.id}`}
          className="course-card premium-panel mb-10 block w-full overflow-hidden text-left"
        >
          <div className="course-image-wrapper relative h-64 border-b border-[#1a1a1a] md:h-80">
            <img
              src="https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=1600"
              alt={featuredCampaign.title}
              className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-luminosity"
            />
          </div>
          <div className="p-8 md:p-10">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-nexid-gold">
              Featured By Activity
            </div>
            <h2 className="font-display mb-2 text-3xl text-white md:text-4xl">
              {featuredCampaign.title}
            </h2>
            <p className="text-nexid-muted">
              ${formatUsdc(featuredCampaign.prizePoolUsdc)} USDC pool · {featuredCampaign.participantCount} participants
            </p>
          </div>
        </Link>
      ) : null}

      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#1a1a1a] pb-4 md:flex-row md:items-center">
        <div className="custom-scroll flex gap-2 overflow-x-auto">
          {([
            { key: "all", label: "All Campaigns" },
            { key: "live", label: "Live" },
            { key: "ended", label: "Ended" },
          ] as const).map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`filter-pill rounded-full border px-4 py-2 text-xs font-medium ${
                statusFilter === filter.key
                  ? "active border-white bg-white text-black"
                  : "border-[#333] bg-[#0a0a0a] text-nexid-muted"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "featured" | "reward" | "newest")}
          className="b2b-input w-40 rounded-lg border border-[#222] bg-[#0a0a0a] px-3 py-2 text-xs text-white"
        >
          <option value="featured">Featured Metrics</option>
          <option value="reward">Highest Prize Pool</option>
          <option value="newest">Newly Added</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-nexid-muted">Loading campaigns...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-nexid-muted">No campaigns found.</div>
      ) : (
        <div className="masonry-grid">
          {filtered.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/academy/campaign/${campaign.id}`}
              className="masonry-item course-card premium-panel flex w-full flex-col overflow-hidden bg-[#0a0a0a] text-left"
            >
              <div className="course-image-wrapper relative h-48 border-b border-[#1a1a1a]">
                <img
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=900"
                  alt={campaign.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display mb-1 text-lg text-white">{campaign.title}</h3>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">
                  By {campaign.sponsorName}
                </div>
                <div className="mb-1 text-xs font-bold text-white">
                  ${formatUsdc(campaign.prizePoolUsdc)} USDC
                </div>
                <div className="text-[11px] text-nexid-muted">
                  {campaign.participantCount} participants · Top score {campaign.topScore}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
