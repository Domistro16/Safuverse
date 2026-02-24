"use client";

import { useEffect } from "react";
import AdminShell from "../_components/AdminShell";

export default function AdminOverviewPage() {
  useEffect(() => {
    const log = document.getElementById("network-log");
    if (!log) return;

    const interval = window.setInterval(() => {
      const lines = Array.from(log.children);
      if (lines.length > 5) lines[0]?.remove();

      const actions = ["API_SYNC", "RPC_CALL", "TX_CONFIRM", "SCORECARD_MINT", "MODULE_FINISH"];
      const colors = ["text-blue-500", "text-nexid-muted", "text-green-500", "text-nexid-gold", "text-purple-500"];
      const idx = Math.floor(Math.random() * actions.length);

      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");

      const div = document.createElement("div");
      div.className = "new-entry";
      div.innerHTML = `<span class="${colors[idx]}">[${hh}:${mm}:${ss}]</span> ${actions[idx]}: System execution OK.`;

      lines.forEach((line) => line.classList.remove("new-entry"));
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }, 2500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <AdminShell active="overview">
      <section className="space-y-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="admin-panel p-4 flex flex-col justify-between h-28 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(255,176,0,0.15),transparent_70%)] pointer-events-none" />
            <div className="text-[10px] font-mono text-nexid-gold uppercase tracking-widest">Escrow Treasury (TVL)</div>
            <div>
              <div className="text-3xl font-display text-white tracking-tight">$450,000</div>
              <div className="text-[10px] font-mono text-green-400">+12.4% MoM</div>
            </div>
          </div>
          <div className="admin-panel p-4 flex flex-col justify-between h-28">
            <div className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest">Protocol Setup Fees</div>
            <div>
              <div className="text-3xl font-display text-white tracking-tight">$45,000</div>
              <div className="text-[10px] font-mono text-nexid-muted">Realized Revenue</div>
            </div>
          </div>
          <div className="admin-panel p-4 flex flex-col justify-between h-28">
            <div className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest">Active Partner Campaigns</div>
            <div>
              <div className="text-3xl font-display text-white tracking-tight">14</div>
              <div className="text-[10px] font-mono text-nexid-gold border border-nexid-gold/30 px-1.5 py-0.5 rounded inline-block bg-nexid-gold/10">
                3 Pending Launch
              </div>
            </div>
          </div>
          <div className="admin-panel p-4 flex flex-col justify-between h-28">
            <div className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest">Global Enrollments</div>
            <div>
              <div className="text-3xl font-display text-white tracking-tight">84,210</div>
              <div className="w-full h-1 bg-[#111] rounded mt-2 overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 admin-panel p-5 flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xs font-mono uppercase tracking-widest text-nexid-muted">Treasury Flow & Escrow TVL</h3>
              <select className="admin-input px-2 py-1 bg-transparent border-none w-auto text-[10px]">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <div className="flex-1 relative w-full">
              <div className="absolute inset-0 flex flex-col justify-between z-0 pointer-events-none">
                <div className="border-t border-[#1a1a1a] w-full h-0" />
                <div className="border-t border-[#1a1a1a] w-full h-0" />
                <div className="border-t border-[#1a1a1a] w-full h-0" />
                <div className="border-t border-[#1a1a1a] w-full h-0" />
              </div>
              <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-10 overflow-visible">
                <defs>
                  <linearGradient id="adminChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,176,0,0.2)" />
                    <stop offset="100%" stopColor="rgba(255,176,0,0)" />
                  </linearGradient>
                </defs>
                <path d="M0,180 L100,160 L200,120 L300,140 L400,90 L500,110 L600,60 L700,80 L800,40 L900,50 L1000,20 L1000,200 L0,200 Z" fill="url(#adminChart)" />
                <path d="M0,180 L100,160 L200,120 L300,140 L400,90 L500,110 L600,60 L700,80 L800,40 L900,50 L1000,20" fill="none" stroke="#ffb000" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="admin-panel p-5 flex flex-col h-[350px]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-nexid-muted mb-4 shrink-0 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-nexid-success rounded-full animate-pulse" /> Network Log
            </h3>
            <div
              className="flex-1 overflow-y-auto custom-scroll bg-[#030303] border border-[#111] rounded p-3 matrix-log space-y-2 flex flex-col justify-end"
              id="network-log"
            >
              <div>
                <span className="text-green-500">[22:40:11]</span> VERIFY: On-chain task success.
              </div>
              <div>
                <span className="text-blue-500">[22:40:14]</span> API_REQ: Soar protocol metadata sync.
              </div>
              <div>
                <span className="text-nexid-gold">[22:40:15]</span> ESCROW: Locked 15,000 USDC.
              </div>
              <div>
                <span className="text-green-500">[22:40:18]</span> TX_MINT: Scorecard deployed to whale.id.
              </div>
              <div className="new-entry">
                <span className="text-blue-500">[22:40:21]</span> SYNC: Analytics chron-job executed.
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
