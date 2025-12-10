import React from "react";
import { NavLink } from "react-router-dom";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-[radial-gradient(circle_at_20%_0%,#fff5d9,transparent_60%),radial-gradient(circle_at_80%_120%,#fff3cd,transparent_60%),linear-gradient(to_bottom,#ffffff,#fff9ea)] text-[#050509]">
      <nav className="w-full flex items-center justify-between px-6 lg:px-10 py-4 lg:py-5 bg-white/70 backdrop-blur border-b border-black/5 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-[18px] lg:text-[20px] font-bold tracking-[-0.03em] text-[#111]">
          ✦ Safu Academy
        </div>
        <div className="flex items-center gap-4 lg:gap-6 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hidden sm:inline-block hover:opacity-100 transition ${
                isActive ? "text-[#111] font-semibold" : "text-[#555] opacity-80"
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/courses"
            className={({ isActive }) =>
              `hidden sm:inline-block hover:opacity-100 transition ${
                isActive ? "text-[#111] font-semibold" : "text-[#555] opacity-80"
              }`
            }
          >
            All Courses
          </NavLink>
          <NavLink
            to="/points"
            className={({ isActive }) =>
              `hidden sm:inline-block hover:opacity-100 transition ${
                isActive ? "text-[#111] font-semibold" : "text-[#555] opacity-80"
              }`
            }
          >
            Points
          </NavLink>
          <NavLink
            to="/certificates"
            className={({ isActive }) =>
              `hidden sm:inline-block hover:opacity-100 transition ${
                isActive ? "text-[#111] font-semibold" : "text-[#555] opacity-80"
              }`
            }
          >
            Certificates
          </NavLink>
          <button
            className="px-[18px] lg:px-[22px] py-[8px] lg:py-[9px] rounded-full border border-[#111] bg-[#111] text-white font-semibold text-[13px] lg:text-[14px] cursor-pointer transition hover:bg-white hover:text-[#111]"
            type="button"
          >
            Login
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 pb-24 pt-6">{children}</main>

      <footer className="w-full bg-[#fff9ea] pt-20 pb-10 text-center border-t border-black/5 mt-10">
        <h2 className="text-3xl md:text-4xl font-bold text-[#111] mb-4 tracking-[-0.03em]">
          Boost your Learning & Knowledge
          <br />
          with Safu Academy Now
        </h2>

        <button className="px-10 py-4 bg-[#111] text-white rounded-full font-semibold text-base md:text-lg hover:bg-[#222] transition shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
          Start Learning Now
        </button>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10">
          <button className="px-8 py-3 rounded-full border border-black/80 text-[#111] font-medium bg-white hover:bg-[#f5f5f5] transition text-sm">
            Notify Me
          </button>

          <button className="px-8 py-3 rounded-full bg-white shadow-sm border border-black/10 flex items-center gap-2 text-[#111] font-medium hover:bg-[#f5f5f5] transition text-sm">
            ⭐ Try Demo
          </button>

          <button className="px-8 py-3 rounded-full bg-white shadow-sm border border-black/10 flex items-center gap-2 text-[#111] font-medium hover:bg-[#f5f5f5] transition text-sm">
            📄 Get Template
          </button>

          <button className="px-8 py-3 rounded-full bg-white shadow-sm border border-black/10 flex items-center gap-2 text-[#111] font-medium hover:bg-[#f5f5f5] transition text-sm">
            ⌗ Made in Framer
          </button>
        </div>

        <p className="mt-12 text-[#777] text-[11px] tracking-[0.18em] uppercase">
          Safu Academy © 2025 · Designed by Level3 Labs
        </p>
      </footer>
    </div>
  );
};

export default Layout;
