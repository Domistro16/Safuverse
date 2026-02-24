import AdminShell from "../_components/AdminShell";

const topNames = ["vitalik.id", "satoshi.id", "punk6529.id", "degen_king.id", "soar_whale.id"];

const rows = Array.from({ length: 100 }, (_, index) => {
  const rank = index + 1;
  const points = Math.max(1200, 98450 - rank * 770);
  const finished = Math.max(2, 14 - Math.floor(rank / 5));
  const claimed = Math.max(100, 2400 - rank * 18);
  const name = rank <= topNames.length ? topNames[rank - 1] : `anon_${1000 + rank}.id`;
  const rep = Math.max(42, 99 - Math.floor(rank > 80 ? rank / 3 : rank / 10));

  return { rank, points, finished, claimed, name, rep };
});

function rankColor(rank: number) {
  if (rank === 1) return "text-[#FFD700]";
  if (rank === 2) return "text-[#C0C0C0]";
  if (rank === 3) return "text-[#CD7F32]";
  return "text-nexid-muted";
}

function repClasses(rep: number) {
  if (rep > 85) return "text-green-500 bg-green-500/10 border-green-500/20";
  if (rep > 60) return "text-nexid-gold bg-nexid-gold/10 border-nexid-gold/20";
  return "text-red-500 bg-red-500/10 border-red-500/20";
}

export default function AdminMatrixPage() {
  return (
    <AdminShell active="matrix">
      <section className="max-w-[1400px] mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="admin-panel p-4 flex justify-between items-center bg-[#0a0a0a]">
            <div>
              <div className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-1">Total Registered Nodes</div>
              <div className="text-2xl font-display text-white">84,210</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-[#222] flex items-center justify-center bg-[#111]">LB</div>
          </div>
          <div className="admin-panel p-4 flex justify-between items-center bg-[#0a0a0a]">
            <div>
              <div className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-1">Total USDC Distributed</div>
              <div className="text-2xl font-display text-green-400">$250,000</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-[#222] flex items-center justify-center bg-[#111] text-green-400">US</div>
          </div>
          <div className="admin-panel p-4 flex justify-between items-center bg-[#0a0a0a]">
            <div>
              <div className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest mb-1">Active Sybil Bans</div>
              <div className="text-2xl font-display text-red-500">142</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-red-500/30 flex items-center justify-center bg-red-500/10 text-red-500">X</div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <input type="text" placeholder="Search .id namespace..." className="admin-input w-64" />
          <div className="flex bg-[#0a0a0a] rounded border border-[#222] text-[10px] font-mono p-1">
            <button className="px-3 py-1 bg-[#222] text-white rounded-sm">Top 100 Power Users</button>
            <button className="px-3 py-1 text-nexid-muted hover:text-white rounded-sm">Flagged Accounts</button>
          </div>
        </div>

        <div className="admin-panel overflow-hidden">
          <table className="linear-table">
            <thead>
              <tr>
                <th className="w-12 text-center">Rank</th>
                <th className="w-auto">Identity Node (.id)</th>
                <th className="w-32 text-right">Total Nex Pts</th>
                <th className="w-32 text-right">Campaigns Finished</th>
                <th className="w-32 text-right">USDC Claimed</th>
                <th className="w-32 text-right">Reputation Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rank}>
                  <td className={`text-center font-mono font-bold ${rankColor(row.rank)}`}>{row.rank}</td>
                  <td className="font-medium text-white">{row.name}</td>
                  <td className="font-mono text-right text-nexid-gold">{row.points.toLocaleString()}</td>
                  <td className="font-mono text-right text-white/80">{row.finished}</td>
                  <td className="font-mono text-right text-green-400">${row.claimed.toLocaleString()}</td>
                  <td className="text-right">
                    <span className={`px-2 py-0.5 rounded border font-mono text-[10px] ${repClasses(row.rep)}`}>{row.rep} / 99</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
