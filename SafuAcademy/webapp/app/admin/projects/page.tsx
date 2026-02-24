"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";

type Project = {
  id: string;
  partner: string;
  symbol: string;
  campaign: string;
  tier: string;
  status: "Active" | "Draft" | "Ended";
  escrow: string;
  students: string;
  live: boolean;
};

type CampaignRequest = {
  id: string;
  partnerName: string;
  partnerNamespace: string | null;
  campaignTitle: string;
  primaryObjective: string;
  tier: string;
  prizePoolUsdc: string;
  briefFileName: string | null;
  callBookedFor: string | null;
  callTimeSlot: string | null;
  callTimezone: string | null;
  callBookingNotes: string | null;
  status: string;
};

const PROJECTS: Project[] = [
  { id: "C-014", partner: "Soar Protocol", symbol: "S", campaign: "Soar Ecosystem: Liquidity", tier: "ECOSYSTEM", status: "Active", escrow: "$25k", students: "12,405", live: true },
  { id: "C-013", partner: "Only Bags", symbol: "O", campaign: "Only Bags Tokenomics", tier: "PREMIUM", status: "Active", escrow: "$10k", students: "8,902", live: true },
  { id: "C-012", partner: "Nuvyx", symbol: "N", campaign: "Nuvyx Audio Protocol", tier: "STANDARD", status: "Active", escrow: "$8k", students: "3,402", live: true },
  { id: "C-015", partner: "Soar Protocol", symbol: "S", campaign: "Advanced Tokenomics", tier: "PREMIUM", status: "Draft", escrow: "$0", students: "-", live: false },
  { id: "C-008", partner: "Phantom", symbol: "P", campaign: "Phantom Security Bootcamp", tier: "ECOSYSTEM", status: "Ended", escrow: "$50k (Dist)", students: "42,110", live: false },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [selectedId, setSelectedId] = useState(PROJECTS[0].id);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [campaignRequests, setCampaignRequests] = useState<CampaignRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  async function fetchCampaigns() {
    setProjectsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const res = await fetch("/api/admin/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.campaigns) || data.campaigns.length === 0) {
        return;
      }

      const mapped: Project[] = data.campaigns.map((campaign: {
        id: number;
        sponsorName: string;
        title: string;
        tier: string;
        status: string;
        prizePoolUsdc: string;
      }) => {
        const status =
          campaign.status === "LIVE"
            ? "Active"
            : campaign.status === "DRAFT"
              ? "Draft"
              : "Ended";

        return {
          id: `C-${String(campaign.id).padStart(3, "0")}`,
          partner: campaign.sponsorName,
          symbol: campaign.sponsorName?.[0]?.toUpperCase() || "C",
          campaign: campaign.title,
          tier: campaign.tier,
          status,
          escrow: `$${Number(campaign.prizePoolUsdc).toLocaleString()}`,
          students: "-",
          live: campaign.status === "LIVE",
        };
      });

      setProjects(mapped);
      setSelectedId((current) =>
        mapped.some((campaign) => campaign.id === current) ? current : mapped[0].id,
      );
    } catch {
      // Keep static fallback data if live fetch fails.
    } finally {
      setProjectsLoading(false);
    }
  }

  async function fetchCampaignRequests() {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setRequestsError("Missing admin token.");
        return;
      }

      const res = await fetch("/api/admin/campaign-requests?status=PENDING", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setRequestsError(data?.error || "Failed to fetch requests.");
        return;
      }

      setCampaignRequests(data.requests || []);
    } catch {
      setRequestsError("Failed to fetch requests.");
    } finally {
      setRequestsLoading(false);
    }
  }

  async function reviewRequest(id: string, decision: "APPROVE" | "REJECT") {
    setRequestActionId(id);
    setRequestsError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setRequestsError("Missing admin token.");
        return;
      }

      const res = await fetch(`/api/admin/campaign-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          createCampaign: decision === "APPROVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRequestsError(data?.error || "Failed to review request.");
        return;
      }

      await fetchCampaignRequests();
      if (decision === "APPROVE") {
        await fetchCampaigns();
      }
    } catch {
      setRequestsError("Failed to review request.");
    } finally {
      setRequestActionId(null);
    }
  }

  useEffect(() => {
    fetchCampaigns();
    fetchCampaignRequests();
  }, []);

  const leaderboard = useMemo(() => {
    const rows: Array<{ rank: number; handle: string; score: string; color: string }> = [];
    let score = selected.live ? 15000 : 500;

    for (let i = 1; i <= 20; i += 1) {
      score -= Math.floor(Math.random() * (selected.live ? 400 : 15));
      const color = i === 1 ? "text-[#FFD700]" : i === 2 ? "text-[#C0C0C0]" : i === 3 ? "text-[#CD7F32]" : "text-nexid-muted";
      rows.push({ rank: i, handle: `anon_${Math.floor(Math.random() * 9999)}.id`, score: `${score.toLocaleString()} ${selected.live ? "pts" : "USDC"}`, color });
    }
    return rows;
  }, [selected]);

  return (
    <AdminShell active="projects">
      <section className="max-w-[1600px] mx-auto space-y-4">
        <div className="admin-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-widest text-nexid-gold">
              Pending Campaign Requests
            </h3>
            <span className="text-[10px] font-mono text-nexid-muted">
              {campaignRequests.length} pending
            </span>
          </div>
          {requestsError ? <p className="mb-3 text-xs text-red-500">{requestsError}</p> : null}
          {requestsLoading ? (
            <p className="text-xs text-nexid-muted">Loading requests...</p>
          ) : campaignRequests.length === 0 ? (
            <p className="text-xs text-nexid-muted">No pending campaign requests.</p>
          ) : (
            <div className="space-y-2">
              {campaignRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-[#222] bg-[#0a0a0a] p-3"
                >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-white">
                        {request.campaignTitle}
                      </div>
                      <div className="font-mono text-[10px] text-nexid-muted">
                        {request.tier} - ${Number(request.prizePoolUsdc).toLocaleString()} USDC
                      </div>
                    </div>
                  <div className="mb-2 text-[11px] text-nexid-muted">
                    {request.partnerName}
                    {request.partnerNamespace ? ` (${request.partnerNamespace})` : ""}
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-white/80">
                    {request.primaryObjective}
                  </p>
                  <div className="mb-3 rounded border border-[#222] bg-[#050505] px-3 py-2 text-[11px] text-white/70">
                    <span className="font-mono uppercase tracking-wider text-nexid-gold">
                      Strategy Call:
                    </span>{" "}
                    {request.callBookedFor
                      ? `${new Date(request.callBookedFor).toLocaleDateString()} at ${request.callTimeSlot ?? "TBD"} (${request.callTimezone ?? "UTC"})`
                      : "Not booked"}
                    {request.callBookingNotes ? (
                      <div className="mt-1 text-nexid-muted">
                        Notes: {request.callBookingNotes}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => reviewRequest(request.id, "APPROVE")}
                      disabled={requestActionId === request.id}
                      className="rounded border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve + Create Campaign
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewRequest(request.id, "REJECT")}
                      disabled={requestActionId === request.id}
                      className="rounded border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#050505] p-2 rounded-lg border border-[#1a1a1a]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Filter campaigns (Cmd+K)" className="admin-input px-3 py-1.5 w-64 border-none" />
            <select className="admin-input px-3 py-1.5 w-32 border-none">
              <option>Status: All</option>
              <option>Live</option>
              <option>Draft</option>
              <option>Ended</option>
            </select>
          </div>
          <button className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition-colors shrink-0">
            + New Campaign
          </button>
        </div>

        <div className="admin-panel overflow-hidden flex flex-col lg:flex-row h-[600px]">
          <div className="w-full lg:w-2/3 border-r border-[#1a1a1a] overflow-y-auto custom-scroll">
            <table className="linear-table">
              <thead>
                <tr>
                  <th className="w-12">ID</th>
                  <th className="w-48">Partner Protocol</th>
                  <th className="w-auto">Campaign Designation</th>
                  <th className="w-24">Tier</th>
                  <th className="w-24">Status</th>
                  <th className="w-24 text-right">Escrow</th>
                  <th className="w-24 text-right">Students</th>
                </tr>
              </thead>
              <tbody>
                {(projectsLoading ? PROJECTS : projects).map((project) => (
                  <tr
                    key={project.id}
                    className={`${selected.id === project.id ? "active-row" : ""} ${project.status === "Ended" ? "opacity-60" : ""}`}
                    onClick={() => setSelectedId(project.id)}
                  >
                    <td className="font-mono text-nexid-muted">{project.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-[#111] border border-[#333] flex items-center justify-center text-[8px] font-bold text-white">
                          {project.symbol}
                        </div>
                        <span className="font-medium text-white">{project.partner}</span>
                      </div>
                    </td>
                    <td className="text-white/90">{project.campaign}</td>
                    <td>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#333] bg-[#111] text-nexid-muted">{project.tier}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${project.status === "Active" ? "bg-green-500" : project.status === "Draft" ? "bg-nexid-gold animate-pulse" : "bg-[#555]"}`} />
                        <span className={project.status === "Draft" ? "text-nexid-gold" : project.status === "Ended" ? "text-[#888]" : "text-white"}>
                          {project.status}
                        </span>
                      </div>
                    </td>
                    <td className={`font-mono text-right ${project.live ? "text-nexid-gold" : "text-white/50"}`}>{project.escrow}</td>
                    <td className={`font-mono text-right ${project.live ? "text-white/80" : "text-white/30"}`}>{project.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="w-full lg:w-1/3 bg-[#030303] flex flex-col">
            <div className="p-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[9px] font-mono text-nexid-gold tracking-widest uppercase">Project Leaderboard</div>
                <div className="text-[9px] font-mono text-nexid-muted">{selected.id}</div>
              </div>
              <h3 className="text-sm font-bold text-white truncate">{selected.campaign}</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll p-2">
              {leaderboard.map((row) => (
                <div key={row.rank} className="flex justify-between items-center p-2.5 border-b border-[#111] hover:bg-[#111] rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-4 text-center font-mono text-xs font-bold ${row.color}`}>{row.rank}</span>
                    <span className="text-xs text-white">{row.handle}</span>
                  </div>
                  <span className={`font-mono text-xs ${row.color}`}>{row.score}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[#1a1a1a] bg-[#0a0a0a]">
              <button className="w-full py-2 border border-[#333] text-xs text-white rounded hover:bg-[#111] transition-colors">Export CSV Data</button>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
