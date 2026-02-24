"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CAMPAIGNS, type Filter } from "./_data";

export default function AcademyBrowsePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<"trending" | "reward" | "newest">("trending");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let items = [...CAMPAIGNS];

    items = items.filter((campaign) => {
      const categoryMatch = filter === "all" ? true : filter === "ended" ? campaign.ended : campaign.cat === filter;
      const searchMatch = q
        ? campaign.title.toLowerCase().includes(q) || campaign.sponsor.toLowerCase().includes(q)
        : true;
      return categoryMatch && searchMatch;
    });

    if (sortBy === "reward") items.sort((a, b) => b.points - a.points);
    if (sortBy === "newest") items.sort((a, b) => b.id - a.id);
    if (sortBy === "trending") items.sort((a, b) => Number(a.ended) - Number(b.ended));

    return items;
  }, [filter, search, sortBy]);

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-10 pt-12 lg:px-12">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display mb-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            Master the ecosystem.
          </h1>
          <p className="max-w-3xl text-lg text-nexid-muted">
            Complete technical tracks, verify microtasks on-chain, and compete for USDC prize pools.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns..."
          className="hidden w-60 rounded-full border border-[#222] bg-[#0a0a0a] px-4 py-2 text-xs text-white lg:block"
        />
      </div>

      <Link href={`/academy/campaign/${CAMPAIGNS[0].id}`} className="course-card premium-panel mb-10 block w-full overflow-hidden text-left">
        <div className="course-image-wrapper relative h-64 border-b border-[#1a1a1a] md:h-80">
          <img src={CAMPAIGNS[0].img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" />
        </div>
        <div className="p-8 md:p-10">
          <h2 className="font-display mb-2 text-3xl text-white md:text-4xl">{CAMPAIGNS[0].title}</h2>
          <p className="text-nexid-muted">{CAMPAIGNS[0].pool}</p>
        </div>
      </Link>

      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#1a1a1a] pb-4 md:flex-row md:items-center">
        <div className="custom-scroll flex gap-2 overflow-x-auto">
          {(["all", "defi", "infra", "identity", "ended"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`filter-pill rounded-full border px-4 py-2 text-xs font-medium ${
                filter === f ? "active border-white bg-white text-black" : "border-[#333] bg-[#0a0a0a] text-nexid-muted"
              }`}
            >
              {f === "all" ? "All Campaigns" : f === "ended" ? "Ended (Claims)" : f}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "trending" | "reward" | "newest")}
          className="b2b-input w-40 rounded-lg border border-[#222] bg-[#0a0a0a] px-3 py-2 text-xs text-white"
        >
          <option value="trending">Trending Status</option>
          <option value="reward">Highest Prize Pool</option>
          <option value="newest">Newly Added</option>
        </select>
      </div>

      <div className="masonry-grid">
        {filtered.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/academy/campaign/${campaign.id}`}
            className="masonry-item course-card premium-panel flex w-full flex-col overflow-hidden bg-[#0a0a0a] text-left"
          >
            <div className="course-image-wrapper relative h-48 border-b border-[#1a1a1a]">
              <img src={campaign.img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity" />
            </div>
            <div className="p-5">
              <h3 className="font-display mb-1 text-lg text-white">{campaign.title}</h3>
              <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">By {campaign.sponsor}</div>
              <div className="text-xs font-bold text-white">{campaign.pool}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
