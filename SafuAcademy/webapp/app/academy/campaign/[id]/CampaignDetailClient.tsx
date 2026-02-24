"use client";

import Link from "next/link";
import { useState } from "react";
import type { Campaign } from "../../_data";

interface CampaignDetailClientProps {
  campaign: Campaign;
}

export default function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
  const [activeModule, setActiveModule] = useState(0);
  const [completedUntil, setCompletedUntil] = useState(-1);

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-12 pt-8 lg:px-12">
      <Link href="/academy" className="mb-6 inline-block text-sm font-medium text-nexid-muted hover:text-white">
        {"<-"} Back to Gallery
      </Link>

      <div className="mb-8 flex flex-col gap-8 border-b border-[#1a1a1a] pb-8 lg:flex-row">
        <div className="flex-1">
          <h1 className="font-display mb-4 text-4xl font-bold text-white md:text-5xl">{campaign.title}</h1>
        </div>
        <div className="premium-panel w-full shrink-0 bg-[#0a0a0a] p-6 lg:w-72">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">Sponsored By</div>
          <div className="font-display mb-4 text-xl text-white">{campaign.sponsor}</div>
          <div className="text-sm font-bold text-white">{campaign.pool}</div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="premium-panel mb-6 min-h-[420px] overflow-hidden border border-[#1a1a1a] bg-[#050505]">
            {!campaign.ended ? (
              <div className="flex h-full flex-col">
                <div className="relative h-[300px] bg-black">
                  <img src={campaign.img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 p-6">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-nexid-gold">
                      {campaign.modules[activeModule]?.type ?? "module"}
                    </div>
                    <h3 className="font-display text-2xl text-white">{campaign.modules[activeModule]?.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <button
                    type="button"
                    onClick={() => {
                      setCompletedUntil((prev) => Math.max(prev, activeModule));
                      const next = activeModule + 1;
                      if (next < campaign.modules.length && campaign.modules[next]?.type !== "locked") {
                        setActiveModule(next);
                      }
                    }}
                    className="rounded bg-nexid-gold px-6 py-2.5 text-sm font-bold text-black"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-10 text-center">
                <h3 className="font-display mb-2 text-3xl text-white">Campaign Concluded</h3>
                <p className="mb-6 text-sm text-nexid-muted">Review your reward eligibility.</p>
                {campaign.claimState === "claimable" ? (
                  <button type="button" className="rounded bg-green-500 px-8 py-3 text-sm font-bold text-black">
                    Sign & Claim {campaign.claimAmount}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cursor-not-allowed rounded border border-[#222] bg-[#111] px-8 py-3 text-sm font-bold text-nexid-muted"
                  >
                    Reward Dispensed
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="premium-panel bg-[#0a0a0a] p-6">
            <h3 className="font-display mb-4 text-lg text-white">Key Takeaways</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {campaign.takeaways.map((takeaway) => (
                <div key={takeaway} className="rounded-lg border border-[#222] bg-[#111] p-3 text-xs leading-relaxed text-nexid-muted">
                  {takeaway}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="premium-panel w-full shrink-0 border border-[#1a1a1a] bg-[#0a0a0a] lg:w-[400px]">
          <div className="border-b border-[#1a1a1a] bg-[#111] p-4 text-xs font-bold text-white">Campaign Ledger</div>
          <div className="custom-scroll max-h-[580px] overflow-y-auto">
            {!campaign.ended ? (
              campaign.modules.map((module, idx) => {
                const isCompleted = idx <= completedUntil;
                const isActive = idx === activeModule && !isCompleted;
                const isLocked = idx > completedUntil + 1 || module.type === "locked";
                return (
                  <button
                    key={`${module.title}-${idx}`}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setActiveModule(idx)}
                    className={`syllabus-item w-full border-b border-[#1a1a1a] p-4 text-left ${
                      isLocked ? "locked" : isCompleted ? "completed" : isActive ? "active" : ""
                    }`}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-widest text-nexid-muted">{module.type}</div>
                    <div className="text-sm font-medium text-white">{module.title}</div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-sm text-nexid-muted">Campaign ended. Modules locked. Check claim status.</div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
