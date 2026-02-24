export default function AcademyLeaderboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 pb-12 pt-12 lg:px-12">
      <h1 className="font-display mb-4 text-center text-4xl font-bold text-white md:text-5xl">Global Hierarchy</h1>
      <p className="mx-auto mb-10 max-w-2xl text-center text-nexid-muted">
        Top ranks are weighted for future ecosystem opportunities.
      </p>

      <div className="premium-panel mx-auto max-w-4xl overflow-hidden bg-[#0a0a0a]">
        <div className="border-b border-[#1a1a1a] bg-[#111] p-4 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">
          All-Time Rankings
        </div>
        <div className="p-2">
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="flex items-center justify-between rounded border-b border-[#1a1a1a] p-3 text-sm">
              <div className="flex items-center gap-4">
                <span className={`w-8 text-center font-mono ${i < 3 ? `rank-${i + 1}` : "text-nexid-muted"}`}>{i + 1}</span>
                <span className="text-white/90">anon_{(i * 39 + 311) % 9999}.id</span>
              </div>
              <span className="font-mono text-nexid-muted">{(98000 - i * 1200).toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
