import AdminShell from "../_components/AdminShell";

const syllabus = [
  { title: "Campaign Global Settings", meta: "Core", active: true },
  { title: "1. Tokenomics Intro", meta: "Video Embed" },
  { title: "Knowledge Check", meta: "Overlay @ 04:12" },
  { title: "2. Verify X Connection", meta: "Social Verification" },
  { title: "3. Bootstrapping Liquidity", meta: "Video Embed" },
  { title: "4. Verify Testnet Swap", meta: "On-Chain Action" },
];

export default function AdminBuilderPage() {
  return (
    <AdminShell active="builder">
      <section className="h-full max-w-[1600px] mx-auto">
        <div className="admin-panel h-[calc(100vh-120px)] flex flex-col overflow-hidden">
          <div className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-4 bg-[#0a0a0a] shrink-0">
            <div className="flex items-center gap-3 w-1/3">
              <input
                type="text"
                value="Draft: Advanced Web3 Economics"
                readOnly
                className="bg-transparent border-none text-white font-medium text-sm focus:ring-0 w-full hover:bg-[#111] px-2 py-1 rounded transition-colors"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-nexid-muted font-mono mr-2">Auto-saved 2m ago</span>
              <button className="px-4 py-1.5 border border-[#333] text-white text-xs font-medium rounded hover:bg-[#111] transition-colors">
                Preview
              </button>
              <button className="px-5 py-1.5 bg-nexid-gold text-black text-xs font-bold rounded hover:shadow-gold-glow transition-all">
                Publish Live
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden bg-[#050505]">
            <div className="w-1/3 border-r border-[#1a1a1a] flex flex-col bg-[#080808]">
              <div className="p-3 border-b border-[#1a1a1a] flex justify-between items-center bg-[#0a0a0a]">
                <span className="text-[10px] font-mono text-nexid-muted uppercase tracking-widest">Syllabus Outline</span>
                <button className="p-1 hover:bg-[#222] rounded text-white">+</button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
                {syllabus.map((item, idx) => (
                  <div key={item.title} className={`cms-node p-2.5 rounded flex items-center gap-3 cursor-pointer ${item.active ? "active" : ""}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-nexid-gold" : "bg-[#555]"}`} />
                    <div className="overflow-hidden">
                      <div className="text-xs font-medium text-white truncate">{item.title}</div>
                      <div className="text-[9px] text-nexid-muted font-mono">{item.meta}</div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 px-2">
                  <button className="w-full py-2 border border-dashed border-[#333] text-nexid-muted text-[10px] font-mono uppercase tracking-widest rounded hover:border-nexid-gold hover:text-nexid-gold transition-colors">
                    + Add Module
                  </button>
                </div>
              </div>
            </div>

            <div className="w-2/3 bg-[#0a0a0a] flex flex-col relative">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll border-l border-[#1a1a1a]">
                <h3 className="text-sm font-bold text-white border-b border-[#1a1a1a] pb-3">Campaign Global Settings</h3>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">Campaign Title</label>
                    <input type="text" className="admin-input" defaultValue="Advanced Web3 Economics" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">Partner / Sponsor</label>
                    <input type="text" className="admin-input" defaultValue="NexID Core" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">Category</label>
                    <select className="admin-input text-white">
                      <option>DeFi & Swaps</option>
                      <option>Infrastructure</option>
                      <option>Identity</option>
                    </select>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 border border-[#222] p-4 bg-[#050505] rounded-lg">
                    <div>
                      <label className="block text-[10px] font-mono text-nexid-gold uppercase mb-1.5">Prize Pool (USDC)</label>
                      <input type="number" className="admin-input font-mono" defaultValue="15000" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-nexid-gold uppercase mb-1.5">Additional Rewards</label>
                      <input type="text" className="admin-input" defaultValue="Scorecard SBT" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono text-nexid-muted uppercase mb-1.5">Key Takeaways (Bullet Points)</label>
                    <textarea className="admin-input h-24 resize-none leading-relaxed" defaultValue={"1. Understand tokenomics models.\n2. Analyze liquidity bootstrapping.\n3. Implement vesting schedules safely."} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
