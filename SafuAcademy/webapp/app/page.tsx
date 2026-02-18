"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CourseCard } from "../components/CourseCard";
import { ChatWidget } from "../components/ChatWidget";
import { useReadContract } from "wagmi";
import { abi, Deploy, OnChainCourse } from "@/lib/constants";
import { useTheme } from "@/app/providers";
import { NavBar } from "@/components/NavBar";
import { User } from "lucide-react";

// Backend course type for featured courses API
interface FeaturedCourse {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  thumbnailUrl: string | null;
  duration: string;
  completionPoints: number;
  minPointsToAccess: number;
  enrollmentCost: number;
  isIncentivized: boolean;
  _count?: {
    lessons: number;
  };
}

// Component to fetch and display featured courses with personalization
function FeaturedCourses() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // State for API-based featured courses
  const [apiCourses, setApiCourses] = useState<FeaturedCourse[] | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);

  // Fallback: contract-based courses
  const { data: contractCourses, isPending: contractLoading } = useReadContract({
    abi: abi,
    functionName: "getAllCourses",
    address: Deploy,
  }) as {
    data: OnChainCourse[];
    isPending: boolean;
  };

  // Try to fetch personalized featured courses from API
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/courses/featured?limit=3', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.courses && data.courses.length > 0) {
            setApiCourses(data.courses);
            setIsPersonalized(data.personalized);
          }
        }
      } catch (err) {
        console.error('Failed to fetch featured courses:', err);
      } finally {
        setApiLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // Use API courses if available, otherwise fall back to contract
  const useApiData = apiCourses && apiCourses.length > 0;
  const isLoading = useApiData ? apiLoading : (apiLoading && contractLoading);

  // Convert API courses to match CourseCard format
  const featuredCourses = useApiData
    ? apiCourses.map(c => ({
      id: BigInt(c.id),
      title: c.title,
      description: c.description,
      instructor: c.instructor,
      category: c.category,
      level: c.level,
      thumbnailUrl: c.thumbnailUrl || '',
      duration: c.duration,
      totalLessons: BigInt(c._count?.lessons ?? 0),
      minPointsToAccess: BigInt(c.minPointsToAccess ?? 0),
      enrollmentCost: BigInt(c.enrollmentCost ?? 0),
      objectives: [],
      prerequisites: [],
      longDescription: c.description,
      isIncentivized: c.isIncentivized ?? false,
    } as OnChainCourse))
    : (contractCourses?.slice(0, 3) ?? []);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`rounded-[28px] border shadow-[0_18px_55px_rgba(15,23,42,0.10)] h-80 animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-black/5'
              }`}
          />
        ))}
      </div>
    );
  }

  if (featuredCourses.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
        No courses available yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
      {featuredCourses.map((course) => (
        <CourseCard key={String(course.id)} course={course} />
      ))}
    </div>
  );
}


const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const testimonials = [
    {
      name: "Ada",
      role: "Web3 Designer",
      quote: "The courses are clear, modern and not overloaded. Nex Academy helped me become job-ready fast",
      color: "from-[#ffbdf2] to-[#cbb8ff]",
    },
    {
      name: "Leo",
      role: "Protocol Founder",
      quote: "The content goes straight to what matters. I felt job-ready sooner than expected",
      color: "from-[#c6e7ff] to-[#ffb8cb]",
    },
    {
      name: "Sakura",
      role: "Community Lead",
      quote: "Everything feels modern and well structured. I became confident in my skills much faster",
      color: "from-[#ffd7b8] to-[#b8e2ff]",
    },
  ];

  const stats = [
    { label: "HOURS OF CONTENT", value: "100+", icon: "📅" },
    { label: "COURSES", value: "15+", icon: "📚" },
    { label: "STUDENTS", value: "20k+", icon: "👥" },
  ];

  const topics = [
    "Wallet Basics",
    "On-Chain Safety",
    "Smart Contracts",
    "On-Chain Data",
    "Agents",
    "EduFi",
    "Domains",
    "Personal Branding",
    "DeFi",
    "NFTs",
  ];

  const faqItems = [
    { q: "What is Nex Academy?", a: "Nex Academy is a next-generation learning platform offering interactive, skill-based courses designed for real-world application." },
    { q: "Who is SafuAcademy for?", a: "Nex Academy is built for learners at any level who want practical skills, clear learning paths, and modern education experiences." },
    { q: "What kind of courses does SafuAcademy offer?", a: "Nex Academy offers micro-courses and deeper learning tracks focused on building practical, job-ready skills." },
    { q: "How is Nex Academy different from traditional learning platforms?", a: "Nex Academy focuses on interactive, skill-first learning instead of passive videos and static content." },
    { q: "Do I need technical knowledge to use Nex Academy?", a: "No. The learning experience is designed to feel simple and familiar, without technical barriers." },
    { q: "How do I access Nex Academy?", a: "Nex Academy is accessible through NexID ecosystem, with learning unlocked through digital identity." },
  ];

  const [openFAQ, setOpenFAQ] = React.useState<number | null>(0);

  return (
    <div className={isDark ? "dark" : ""}>
      <div className={`w-full min-h-screen font-sans antialiased ${isDark
        ? 'bg-[#0a0a0f] text-white'
        : 'bg-[radial-gradient(circle_at_20%_0%,#fff5d9,transparent_60%),radial-gradient(circle_at_80%_120%,#fff3cd,transparent_60%),linear-gradient(to_bottom,#ffffff,#fff9ea)] text-[#050509]'
        }`}>

        {/* NAVBAR */}
        <NavBar />

        {/* Floating Profile Button - Bottom Left */}
        <Link
          href="/profile"
          className={`fixed bottom-6 left-6 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${isDark
            ? "bg-[#ffb000] text-black hover:bg-[#ffa000]"
            : "bg-[#111] text-white hover:bg-[#333]"
            }`}
          aria-label="Go to Profile"
        >
          <User className="w-5 h-5" />
        </Link>

        {/* HERO SECTION */}
        <section className="relative w-full pt-24 md:pt-28 lg:pt-32 pb-32 lg:pb-40 overflow-hidden">
          {isDark ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#1a1a3e,transparent_60%),radial-gradient(circle_at_100%_0%,#2a1a3e,transparent_55%),radial-gradient(circle_at_50%_120%,#1a2a3e,transparent_55%)]" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#fff0c7,transparent_60%),radial-gradient(circle_at_100%_0%,#ffd6e9,transparent_55%),radial-gradient(circle_at_50%_120%,#e4f1ff,transparent_55%),linear-gradient(to_bottom,#ffffff,#fff9ea)]" />
          )}
          {!isDark && <div className="absolute left-1/2 -translate-x-1/2 bottom-[-180px] w-[980px] h-[980px] bg-white/55 blur-[190px]" />}

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-20 items-center">
            {/* LEFT: TEXT COLUMN */}
            <div className="text-left">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.08)] border text-xs sm:text-sm mb-6 ${isDark ? 'bg-white/10 border-white/10 text-gray-300' : 'bg-white/50 border-black/5 text-[#444]'
                }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${isDark ? 'bg-[#ffb000] text-black' : 'bg-[#111] text-white'
                  }`}>
                  SA
                </span>
                <span className="tracking-[-0.01em]">Next Generation EduFi</span>
              </div>

              <h1 className={`text-[34px] sm:text-[42px] lg:text-[56px] xl:text-[64px] font-bold leading-[1.02] tracking-[-0.05em] ${isDark ? 'text-white' : 'text-[#050509]'
                }`}>
                AI-Powered
                <br />
                <span className="inline-block mt-1 bg-clip-text text-transparent bg-[linear-gradient(120deg,#ffb000,#ffd700,#fff0b3)]">
                  Skill-based Education.
                </span>
              </h1>

              <p className={`mt-5 text-sm sm:text-base lg:text-[15px] max-w-xl leading-relaxed ${isDark ? 'text-gray-300' : 'text-[#333]'
                }`}>
                Multilingual, interactive AI learning that turns practice into real skills, and learning into earning, powered by .id - a unique digital identity across the Web
              </p>

              <div className="flex flex-wrap gap-3 sm:gap-4 mt-7">
                <Link href="/courses">
                  <button className={`px-7 sm:px-8 py-3 rounded-full text-[13px] sm:text-[14px] font-semibold shadow-[0_20px_50px_rgba(15,23,42,0.35)] transition transform hover:scale-105 ${isDark ? 'bg-[#ffb000] text-black hover:bg-[#ffa000]' : 'bg-[#111] text-white hover:bg-[#222]'
                    }`}>
                    Start Learning
                  </button>
                </Link>
                <button className={`px-7 sm:px-8 py-3 rounded-full border text-[13px] sm:text-[14px] font-semibold transition flex items-center gap-2 shadow-[0_10px_30px_rgba(15,23,42,0.10)] ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white/50 border-black/10 text-[#111] hover:bg-white'
                  }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#ffb000] text-black' : 'bg-[#111] text-white'
                    }`}>
                    ▶
                  </span>
                  Watch intro lesson
                </button>
              </div>

              <div className={`flex items-center gap-4 mt-6 text-[11px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-[#555]'
                }`}>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffb5e8] via-[#c9b8ff] to-[#9ad4ff] border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffd1b3] via-[#ff9ac2] to-[#9ad4ff] border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b3e9ff] via-[#c9b8ff] to-[#ffb5e8] border-2 border-white" />
                </div>
                <div>
                  <div className={`font-semibold tracking-[-0.01em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    20,000+ NexID Learners
                  </div>
                  <div className={`text-[10px] sm:text-[11px] ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
                    From Growing, learning and earning in NexID
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: HERO CARD STACK */}
            <div className="relative h-full flex justify-center lg:justify-end">
              <div className={`relative w-full max-w-lg rounded-[32px] backdrop-blur-xl border shadow-[0_32px_100px_rgba(15,23,42,0.30)] p-6 sm:p-7 ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/60 border-black/5'
                }`}>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-[11px] mb-4 ${isDark ? 'bg-white/10 text-gray-300' : 'bg-[#f5f2ff] text-[#555]'
                  }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#ffb000] text-black' : 'bg-[#111] text-white'
                    }`}>
                    ▶
                  </span>
                  <span className="truncate">Lesson 03 · Reading On-chain Activity</span>
                </div>

                <h3 className={`text-base sm:text-lg font-semibold mb-2 leading-snug ${isDark ? 'text-white' : 'text-[#111]'
                  }`}>
                  See a full Nex Academy lesson in action.
                </h3>
                <p className={`text-xs sm:text-sm mb-5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#555]'
                  }`}>
                  Follow a real walkthrough of on-chain dashboards, agents and
                  transactions. No fluff — just the exact flows you'll use in NexID.
                </p>

                <div className="mb-5">
                  <div className={`flex items-center justify-between text-[10px] sm:text-[11px] mb-2 ${isDark ? 'text-gray-500' : 'text-[#777]'
                    }`}>
                    <span>Progress</span>
                    <span>36 min · Intermediate</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-[#ecebff]'
                    }`}>
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#ffb000] via-[#ffd700] to-[#fff0b3]" />
                  </div>
                </div>

                <div className={`flex items-center justify-between text-[10px] sm:text-[11px] ${isDark ? 'text-gray-400' : 'text-[#555]'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#ffb000] text-black' : 'bg-[#111] text-white'
                      }`}>
                      ◎
                    </span>
                    <span>Certificate & on-chain proof of completion</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-[#f5f5ff] text-[#111]'
                    }`}>
                    Live cohorts
                  </span>
                </div>
              </div>

              {/* Floating XP card */}
              <div className="absolute -top-4 -right-4 w-28 rounded-2xl bg-[#111] text-white text-[10px] sm:text-[11px] shadow-[0_22px_60px_rgba(15,23,42,0.55)] p-3 flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#ffb000]">XP EARNED</span>
                <span className="text-sm font-semibold">+320 Safu Points</span>
                <span className="text-[9px] text-[#ccccff]">This week</span>
              </div>

              {/* Floating Agents card */}
              <div className={`absolute -bottom-6 left-0 w-40 rounded-2xl border text-[10px] sm:text-[11px] shadow-[0_18px_55px_rgba(15,23,42,0.22)] p-3 flex items-center gap-2 ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/60 border-black/5'
                }`}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ffb5e8] via-[#c9b8ff] to-[#9ad4ff]" />
                <div>
                  <div className={`font-semibold leading-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    Safu Agents Lab
                  </div>
                  <div className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
                    New cohort starts in 3 days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 pb-32">

          {/* STATS SECTION */}
          <section className="py-16 lg:py-20">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-1 mb-5 rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.06)] border text-xs sm:text-sm ${isDark ? 'bg-white/10 border-white/10 text-gray-400' : 'bg-white border-black/5 text-[#555]'
                }`}>
                <span className="w-5 h-5 rounded-full bg-[#f4e8ff] flex items-center justify-center text-[10px]">🎓</span>
                <span>Nex Academy · What We Offer</span>
              </div>

              <h2 className={`text-3xl md:text-4xl font-bold mb-3 tracking-[-0.03em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                Build Real Skills
              </h2>
              <p className={`max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                From guided learning to hands-on mastery, Nex Academy helps you grow, practice, and progress with confidence.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mt-12 max-w-5xl mx-auto">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`relative p-9 rounded-[26px] shadow-[0_20px_60px_rgba(15,23,42,0.12)] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-white/70'
                    }`}
                >
                  <div className="absolute -top-5 left-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffb5e8] via-[#c9b8ff] to-[#9ad4ff] shadow-md flex items-center justify-center text-2xl">
                    {stat.icon}
                  </div>
                  <div className="mt-6">
                    <div className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>
                      {stat.value}
                    </div>
                    <div className={`mt-1 text-[11px] tracking-[0.18em] ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-12 text-center text-[11px] ${isDark ? 'text-gray-600' : 'text-[#999]'}`}>
              Built on Base.
              <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                On-chain experience that feels like Web2
              </span>
            </div>
          </section>

          {/* FEATURED COURSES */}
          <section className="py-16">
            <div className="text-center mb-10 md:mb-12">
              <div className={`inline-flex items-center gap-2 px-4 py-1 mb-4 rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.06)] border text-[11px] ${isDark ? 'bg-white/10 border-white/10 text-gray-400' : 'bg-white border-black/5 text-[#777]'
                }`}>
                <span className="text-base">🎓</span>
                <span>Our Courses</span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold tracking-[-0.03em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                Featured Courses
              </h2>
              <p className={`max-w-2xl mx-auto mt-3 text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                From essential skills to advanced mastery, choose a learning path that fits where you are today.

              </p>
            </div>

            <FeaturedCourses />

            <div className="flex justify-center mt-10">
              <Link href="/courses">
                <button className={`px-8 py-3 rounded-full border text-sm font-semibold shadow-[0_10px_30px_rgba(15,23,42,0.10)] transition transform hover:scale-105 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-black/10 text-[#111] hover:bg-[#f7f7ff]'
                  }`}>
                  View All Courses
                </button>
              </Link>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="py-20 lg:py-24 relative">
            {!isDark && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#faf6ff,transparent_70%)] pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full shadow-[0_8px_25px_rgba(15,23,42,0.06)] border text-[11px] mb-4 ${isDark ? 'bg-white/10 border-white/10 text-gray-400' : 'bg-white/60 border-black/5 text-[#777]'
                  }`}>
                  <span className="text-base">💜</span>
                  <span>Testimonials</span>
                </div>
                <h2 className={`text-3xl md:text-4xl font-bold tracking-[-0.04em] leading-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
                  What NexID Learners Are Saying
                </h2>
                <p className={`mt-3 text-sm sm:text-base max-w-md leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                  Real learners from around the world using Nex Academy to build real skills.

                </p>
              </div>
              <Link href="/courses">
                <button className={`self-start sm:self-auto px-6 py-3 rounded-full text-sm font-semibold shadow-[0_20px_55px_rgba(15,23,42,0.35)] transition transform hover:scale-105 ${isDark ? 'bg-[#ffb000] text-black hover:bg-[#ffa000]' : 'bg-[#111] text-white hover:bg-[#222]'
                  }`}>
                  Start Learning Now
                </button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className={`group relative p-7 rounded-[28px] backdrop-blur border shadow-[0_15px_45px_rgba(15,23,42,0.10)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_35px_95px_rgba(15,23,42,0.25)] ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/5'
                    }`}
                >
                  <div className={`absolute -top-4 -right-4 w-10 h-10 rounded-2xl bg-gradient-to-br ${t.color} opacity-70 blur-sm transition-all duration-500 group-hover:scale-125`} />

                  <p className={`mb-6 leading-relaxed text-[14px] ${isDark ? 'text-gray-300' : 'text-[#333]'}`}>"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color}`} />
                    <div className="text-xs">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-[#111]'}`}>{t.name}</div>
                      <div className={isDark ? 'text-gray-500' : 'text-[#777]'}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* COURSE TOPICS */}
          <section className="py-24 relative overflow-hidden">
            {!isDark && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,#f7e9ff,transparent_60%),radial-gradient(circle_at_80%_120%,#e1f0ff,transparent_60%)] opacity-70 pointer-events-none" />
            )}

            <div className="relative z-10 text-center mb-12">
              <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.06)] border text-[12px] mb-4 ${isDark ? 'bg-white/10 border-white/10 text-gray-400' : 'bg-white border-black/5 text-[#777]'
                }`}>
                <span className="text-base">📚</span>
                <span>Course Topics</span>
              </div>

              <h2 className={`text-3xl md:text-4xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                Explore Topics
              </h2>
              <p className={`mt-3 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                Discover micro-courses and deep dives designed to build real skills.              </p>
            </div>

            <div className="relative max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {topics.map((topic) => (
                <div
                  key={topic}
                  className={`group relative p-4 sm:p-5 rounded-[22px] border shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur transition duration-500 hover:-translate-y-2 hover:shadow-[0_25px_70px_rgba(15,23,42,0.18)] cursor-pointer ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/50 border-black/5'
                    }`}
                >
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-xl bg-gradient-to-br from-[#ffbdf2] to-[#cbb8ff] blur-sm opacity-60 group-hover:scale-125 transition duration-500" />
                  <span className={`relative z-10 text-[13px] sm:text-[14px] font-medium tracking-[-0.01em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    {topic}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ SECTION */}
          <section className="py-24 relative overflow-hidden">
            {!isDark && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,#f7e9ff,transparent_60%),radial-gradient(circle_at_80%_120%,#e1f0ff,transparent_60%)] opacity-70 pointer-events-none" />
            )}

            <div className="relative z-10 text-center mb-12">
              <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.06)] border text-[11px] mb-4 ${isDark ? 'bg-white/10 border-white/10 text-gray-400' : 'bg-white border-black/5 text-[#777]'
                }`}>
                <span className="text-base">❓</span>
                <span>FAQ</span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item, idx) => (
                <div
                  key={item.q}
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className={`group rounded-2xl border shadow-[0_12px_35px_rgba(15,23,42,0.10)] p-6 cursor-pointer transition-all duration-500 hover:shadow-[0_22px_55px_rgba(15,23,42,0.18)] ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/5'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm sm:text-base font-medium tracking-[-0.01em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                      {item.q}
                    </span>
                    <span className={`text-xl transition-transform duration-300 ${openFAQ === idx ? "rotate-180" : ""} ${isDark ? 'text-gray-500' : 'text-[#999]'}`}>
                      {openFAQ === idx ? "−" : "+"}
                    </span>
                  </div>
                  <div className={`grid transition-all duration-500 overflow-hidden ${openFAQ === idx ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className={`overflow-hidden text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                      {item.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className={`w-full pt-28 pb-10 text-center border-t ${isDark ? 'bg-[#0a0a0f] border-white/10' : 'bg-[#fafafa] border-black/5'
          }`}>
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 tracking-[-0.03em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Level Up Your Skills & Knowledge
            <br />
            with Nex Academy Today          </h2>

          <Link href="/courses">
            <button className={`px-10 py-4 rounded-full font-semibold text-base md:text-lg transition shadow-[0_20px_50px_rgba(15,23,42,0.35)] ${isDark ? 'bg-[#ffb000] text-black hover:bg-[#ffa000]' : 'bg-[#111] text-white hover:bg-[#222]'
              }`}>
              Start Learning Now
            </button>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10">
            <a
              href="https://safuverse.gitbook.io/safuverse-docs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="px-8 py-3 rounded-full border font-semibold font-bold transition text-sm border-black/80 text-[#111] bg-white hover:bg-[#f5f5f5] dark:border-white/20 dark:text-white dark:bg-white/5 dark:hover:bg-white/10">
                Read Docs
              </button>
            </a>

            <a
              href="https://names.idverse.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="px-8 py-3 rounded-full shadow-sm border flex font-bold items-center gap-2 font-semibold transition text-sm bg-white border-black/10 text-[#111] hover:bg-[#f5f5f5] dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                Mint .id
              </button>
            </a>

            <a
              href="https://safupad.xyz"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="px-8 py-3 rounded-full shadow-sm border font-bold flex items-center gap-2 font-semibold transition text-sm bg-white border-black/10 text-[#111] hover:bg-[#f5f5f5] dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                Try SafuPad
              </button>
            </a>

            <a
              href="https://safuverse.gitbook.io/safuverse-docs/security/audits"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="px-8 py-3 rounded-full shadow-sm border flex font-bold items-center gap-2 font-semibold transition text-sm bg-white border-black/10 text-[#111] hover:bg-[#f5f5f5] dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                Audit Report
              </button>
            </a>
          </div>


          <p className={`mt-12 text-[11px] tracking-[0.18em] uppercase ${isDark ? 'text-gray-600' : 'text-[#777]'}`}>
            Nex Academy © 2025 · Designed by Level3 Labs
          </p>
        </footer>

        <ChatWidget />
      </div>
    </div>
  );
};

export default Home;
