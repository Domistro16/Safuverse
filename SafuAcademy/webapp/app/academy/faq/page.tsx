"use client";

import { useState } from "react";
import { FAQS } from "../_data";

export default function AcademyFaqPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => (prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]));
  };

  return (
    <section className="mx-auto w-full max-w-[900px] px-6 pb-12 pt-16">
      <h1 className="font-display mb-4 text-center text-4xl font-bold text-white">Protocol FAQ</h1>
      <p className="mb-10 text-center text-nexid-muted">Architecture and reward logic explained.</p>
      <div className="space-y-4">
        {FAQS.map((item, idx) => {
          const open = openItems.includes(idx);
          return (
            <div
              key={item.q}
              className={`faq-item premium-panel cursor-pointer overflow-hidden bg-[#0a0a0a] ${open ? "active" : ""}`}
              onClick={() => toggleItem(idx)}
            >
              <div className="flex items-center justify-between p-6">
                <h3 className="font-medium text-white">{item.q}</h3>
                <span className="faq-icon text-nexid-muted">{open ? "-" : "+"}</span>
              </div>
              <div className="faq-content border-t border-[#1a1a1a] bg-[#050505]">
                <div className="p-6 text-sm leading-relaxed text-nexid-muted">{item.a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
