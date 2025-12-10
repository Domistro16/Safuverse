import React from "react";
import { Layout } from "../components/Layout";
import { CourseCard } from "../components/CourseCard";
import { ChatWidget } from "../components/ChatWidget";

export const Home: React.FC = () => {
  const stats = [
    { label: "HOURS OF CONTENT", value: "100+", icon: "⏱" },
    { label: "COURSES", value: "20+", icon: "📚" },
    { label: "LEARNERS", value: "20k+", icon: "👥" }
  ];

  const faqItems = [
    {
      q: "What is Safu Academy?",
      a: "Safu Academy is an on-chain learning platform inside the SafuVerse offering modern micro-courses, agents, and EduFi-powered skill paths."
    },
    {
      q: "Who can enroll?",
      a: "Anyone and everyone! Simply choose a .safu name of your choice to get started."
    },
    {
      q: "What's the cost to mint a .safu domain?",
      a: "Prices vary depending on domain name length and registration period. $10 gets you started."
    },
    {
      q: "What can be done with a .safu domain?",
      a: "You can enroll in any course, earn referral fees, and share in platform revenue using your .safu domain."
    },
    {
      q: "Will there be a future airdrop?",
      a: "Yes. When 1 million points from Season 1 are reached. See our docs for details."
    },
    {
      q: "Can someone take my domain after I mint it?",
      a: "No — once you mint a domain, it belongs to you for as long as you keep it registered."
    }
  ];

  const [openFAQ, setOpenFAQ] = React.useState<number | null>(0);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative w-full pt-10 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#fff0c7,transparent_60%),radial-gradient(circle_at_100%_0%,#ffe3b3,transparent_55%),radial-gradient(circle_at_50%_120%,#fff6da,transparent_55%)]" />
        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-black/5 text-xs sm:text-sm text-[#444] mb-5">
              <span className="w-5 h-5 rounded-full bg-[#111] text-white flex items-center justify-center text-[11px] font-semibold">
                SA
              </span>
              <span className="tracking-[-0.01em]">
                On‑chain Education · Creator-Centric
              </span>
            </div>

            <h1 className="text-[34px] sm:text-[42px] lg:text-[52px] font-bold leading-[1.02] tracking-[-0.05em] text-[#050509]">
              Learn Web3
              <br />
              <span className="inline-block mt-1 bg-clip-text text-transparent bg-[linear-gradient(120deg,#f6b948,#ffd873,#fff0b3)]">
                inside the SafuVerse.
              </span>
            </h1>

            <p className="mt-4 text-[#333] text-sm sm:text-base max-w-xl leading-relaxed">
              Human-curated, AI-presented skill-based multilingual courses, available in 32
              languages, powered by your .safu domains. A unique digital identity for content
              creators, artists, and innovators.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">
              <button className="px-7 sm:px-8 py-3 rounded-full bg-[#111] text-white text-[13px] sm:text-[14px] font-semibold shadow-[0_20px_50px_rgba(15,23,42,0.35)] hover:bg-[#222] transition transform hover:scale-105">
                Start Learning
              </button>
              <button className="px-7 sm:px-8 py-3 rounded-full bg-white/70 border border-black/10 text-[13px] sm:text-[14px] font-semibold text-[#111] hover:bg-white transition flex items-center gap-2 shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
                <span className="w-6 h-6 rounded-full bg-[#111] text-white flex items-center justify-center text-[10px]">
                  ▶
                </span>
                Watch intro lesson
              </button>
            </div>

            <div className="flex items-center gap-4 mt-6 text-[11px] sm:text-xs text-[#555]">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe1a3] via-[#ffd2b3] to-[#fff0b3] border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fff1bd] via-[#ffd6a8] to-[#ffe4c4] border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe9b8] via-[#ffe0c1] to-[#fff6da] border-2 border-white" />
              </div>
              <div>
                <div className="font-semibold text-[#111] tracking-[-0.01em]">
                  20,000+ Safu learners
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#777]">
                  From BNB, Plasma, Monad and Solana ecosystems
                </div>
              </div>
            </div>
          </div>

          {/* Hero card */}
          <div className="relative">
            <div className="rounded-[32px] bg-white/75 backdrop-blur-xl border border-black/5 shadow-[0_32px_100px_rgba(15,23,42,0.30)] p-6 sm:p-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fff7df] text-[10px] sm:text-[11px] text-[#555] mb-4">
                <span className="w-6 h-6 rounded-full bg-[#111] text-white flex items-center justify-center text-[10px]">
                  ▶
                </span>
                <span className="truncate">Lesson 03 · Reading SafuVerse Activity</span>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-[#111] mb-2 leading-snug">
                See a full Safu Academy lesson in action.
              </h3>
              <p className="text-xs sm:text-sm text-[#555] mb-5 leading-relaxed">
                Follow a real walkthrough of on-chain dashboards, agents, and transactions. No
                fluff, just the exact flows you'll use inside the SafuVerse.
              </p>

              <div className="mb-5">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#777] mb-2">
                  <span>Progress</span>
                  <span>36 min · Intermediate</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#fff0c7] overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#f6b948] via-[#ffd873] to-[#fff0b3]" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#555]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#111] text-white flex items-center justify-center text-[10px]">
                    ◎
                  </span>
                  <span>Certificate & on‑chain proof of completion</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#fff7df] text-[#111] font-medium">
                  Live cohorts
                </span>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-28 rounded-2xl bg-[#111] text-white text-[10px] sm:text-[11px] shadow-[0_22px_60px_rgba(15,23,42,0.55)] p-3 flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#ffe9a6]">
                XP EARNED
              </span>
              <span className="text-sm font-semibold">+320 Safu Points</span>
              <span className="text-[9px] text-[#f5f5f5]">This week</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative p-7 rounded-[26px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-white/70"
            >
              <div className="absolute -top-5 left-6 w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffe1a3] via-[#ffd873] to-[#fff0b3] shadow-md flex items-center justify-center text-xl">
                {stat.icon}
              </div>
              <div className="mt-6">
                <div className="text-2xl md:text-3xl font-bold text-[#111]">
                  {stat.value}
                </div>
                <div className="mt-1 text-[11px] tracking-[0.18em] text-[#777]">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[11px] text-[#999]">
          Adopted by builders across{" "}
          <span className="font-semibold text-[#555]">Blockchain, Marketing, AI, and more</span>
        </p>
      </section>

      {/* FEATURED COURSES */}
      <section className="py-14">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 mb-4 rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-black/5 text-[11px] text-[#777]">
            <span className="text-base">🎓</span>
            <span>Featured Courses</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.03em]">
            Pick your first learning path
          </h2>
          <p className="text-[#555] max-w-2xl mx-auto mt-3 text-sm sm:text-base leading-relaxed">
            From core skills to advanced on‑chain topics, choose a Safu Academy course that matches
            where you are right now.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <CourseCard
            title="Wallets & On‑Chain Safety"
            price="$59"
            level="Beginner"
            badge="Start here"
            summary="Understand wallets, signatures and safety habits before diving deeper into the SafuVerse."
          />
          <CourseCard
            title="Safu Agents & Automations"
            price="$89"
            level="Intermediate"
            badge="Popular"
            summary="Use AI agents to monitor flows, trigger alerts and streamline your on‑chain work."
            highlight
          />
          <CourseCard
            title="On‑Chain Research 2025"
            price="$79"
            level="Intermediate"
            badge="For builders"
            summary="Decode data, read dashboards and spot opportunities across chains with confidence."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-black/5 text-[11px] text-[#777] mb-4">
            <span className="text-base">❓</span>
            <span>FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.04em]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={item.q}
              className="group rounded-2xl bg-white/80 border border-black/5 shadow-[0_12px_35px_rgba(15,23,42,0.10)] p-5 cursor-pointer transition-all duration-500 hover:shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
              onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-[#111] font-medium tracking-[-0.01em]">
                  {item.q}
                </span>
                <span
                  className={`text-[#999] text-xl transition-transform duration-300 ${
                    openFAQ === idx ? "rotate-180" : ""
                  }`}
                >
                  {openFAQ === idx ? "−" : "+"}
                </span>
              </div>
              <div
                className={`grid transition-all duration-500 overflow-hidden ${
                  openFAQ === idx ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden text-[#555] text-sm leading-relaxed">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ChatWidget />
    </Layout>
  );
};

export default Home;
