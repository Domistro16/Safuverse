import React from "react";
import { Layout } from "../components/Layout";

export const Certificates: React.FC = () => {
  const certs = [
    { id: 1, title: "Wallet Basics", date: "2025-10-12" },
    { id: 2, title: "On‑Chain Safety", date: "2025-10-20" }
  ];

  return (
    <Layout>
      <section className="pt-8 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.04em] mb-6">
          Your Certificates
        </h1>
        <p className="text-[#555] text-sm sm:text-base mb-6 max-w-xl">
          Download and share your on‑chain verified Safu Academy certificates.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {certs.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl bg-white/80 border border-black/5 shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs text-[#777] mb-2 uppercase tracking-[0.18em]">
                  Safu Certificate
                </div>
                <h2 className="font-semibold text-lg text-[#111] mb-1">{c.title}</h2>
                <p className="text-[11px] text-[#777]">Issued on {c.date}</p>
              </div>
              <button className="mt-4 w-full px-4 py-2 rounded-full bg-[#111] text-white text-xs font-semibold hover:bg-[#222] transition">
                Download PDF
              </button>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Certificates;
