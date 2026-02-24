import AdminShell from "../_components/AdminShell";

export default function AdminAnalyticsPage() {
  return (
    <AdminShell active="analytics">
      <section className="max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="admin-panel p-0 flex flex-col overflow-hidden border-red-500/40 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)] h-[450px]">
            <div className="p-4 border-b border-red-500/20 bg-red-500/5 flex justify-between items-center">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-500">Sybil Detection Radar</h3>
              <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">2 THREATS ACTIVE</span>
            </div>

            <div className="h-64 radar-container bg-[#050505] border-b border-[#1a1a1a]">
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-16 border border-red-500/20 rounded-full" /></div>
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-32 h-32 border border-red-500/20 rounded-full" /></div>
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-48 h-48 border border-red-500/20 rounded-full" /></div>
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-red-500/20" /></div>
              <div className="absolute inset-0 flex items-center justify-center"><div className="h-full w-px bg-red-500/20" /></div>
              <div className="absolute inset-0 flex items-center justify-center"><div className="radar-sweep" /></div>
              <div className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] top-16 left-32" />
              <div className="absolute w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316] bottom-20 right-24" />
            </div>

            <div className="p-3 space-y-2 bg-[#0a0a0a] flex-1 overflow-y-auto custom-scroll">
              <div className="p-3 border border-red-500/30 bg-red-500/10 rounded flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono mb-1">
                    <span className="text-red-500 font-bold">SYBIL_CLUSTER</span>
                    <span className="text-nexid-muted">Target: Soar Campaign</span>
                  </div>
                  <div className="text-xs text-white/80">75 identical RPC queries from subnet 104.28.x.x.</div>
                </div>
                <button className="text-[9px] uppercase font-bold tracking-widest bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600">
                  Ban IP
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="admin-panel p-5 h-[220px]">
              <h3 className="text-xs font-mono uppercase tracking-widest text-nexid-muted mb-4 border-b border-[#1a1a1a] pb-2">Threat Resolution Ledger</h3>
              <div className="space-y-3 overflow-y-auto custom-scroll h-[120px]">
                <div className="flex justify-between text-xs"><span className="text-white">IP Ban: 192.168.x.x</span><span className="text-green-500 font-mono">Resolved</span></div>
                <div className="flex justify-between text-xs"><span className="text-white">Botnet Frozen (12 accounts)</span><span className="text-green-500 font-mono">Resolved</span></div>
                <div className="flex justify-between text-xs"><span className="text-white">API Rate Limit Enforced</span><span className="text-green-500 font-mono">Resolved</span></div>
                <div className="flex justify-between text-xs"><span className="text-white">Suspicious Claim Blocked</span><span className="text-green-500 font-mono">Resolved</span></div>
              </div>
            </div>

            <div className="admin-panel p-5 h-[206px]">
              <h3 className="text-xs font-mono uppercase tracking-widest text-nexid-muted mb-4">API Verification Latency</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono"><span className="text-white">X (Twitter) Auth</span> <span className="text-nexid-gold">1.2s</span></div>
                  <div className="h-1.5 w-full bg-[#111] rounded overflow-hidden"><div className="h-full bg-nexid-gold w-[40%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono"><span className="text-white">Ethereum Mainnet RPC</span> <span className="text-green-500">0.4s</span></div>
                  <div className="h-1.5 w-full bg-[#111] rounded overflow-hidden"><div className="h-full bg-green-500 w-[15%]" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
