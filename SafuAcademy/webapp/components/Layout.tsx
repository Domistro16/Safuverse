"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CustomConnect } from "@/components/connectButton";
import { useTheme } from "@/app/providers";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className={`w-full min-h-screen ${isDark
        ? "bg-[#0a0a0f] text-white"
        : "bg-[radial-gradient(circle_at_20%_0%,#fff5d9,transparent_60%),radial-gradient(circle_at_80%_120%,#fff3cd,transparent_60%),linear-gradient(to_bottom,#ffffff,#fff9ea)] text-[#050509]"
        }`}
    >
      <nav className={`w-full flex items-center justify-between px-6 lg:px-10 py-4 lg:py-5 backdrop-blur border-b sticky top-0 z-50 ${isDark ? 'bg-[#0a0a0f]/90 border-white/10' : 'bg-white/60 border-black/5'
          }`}>
          <div className={`flex items-center gap-2 text-[18px] lg:text-[20px] font-bold tracking-[-0.03em] ${isDark ? 'text-white' : 'text-[#111]'
            }`}>
            ✦ Safu Academy
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className={`hover:opacity-100 transition ${isDark ? 'text-white font-semibold' : 'text-[#111] font-semibold'}`}>
              Home
            </Link>
            <Link href="/courses" className={`hover:opacity-100 transition ${isDark ? 'text-gray-400 opacity-80' : 'text-[#555] opacity-80'}`}>
              All Courses
            </Link>
            <Link href="/points" className={`hover:opacity-100 transition ${isDark ? 'text-gray-400 opacity-80' : 'text-[#555] opacity-80'}`}>
              Points
            </Link>
            <Link href="/certificates" className={`hover:opacity-100 transition ${isDark ? 'text-gray-400 opacity-80' : 'text-[#555] opacity-80'}`}>
              Certificates
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5">
            {/* Social Links - Desktop only */}
            <a href="#" className={`hidden md:block text-[18px] lg:text-[20px] opacity-80 hover:opacity-100 transition transform hover:scale-105 ${isDark ? 'text-white' : 'text-[#111]'
              }`}>
              𝕏
            </a>
            <a href="#" className="hidden md:block text-[20px] lg:text-[22px] text-[#5865F2]">
              💬
            </a>
            <button
              className={`flex w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] lg:w-[42px] lg:h-[42px] rounded-full items-center justify-center text-[14px] sm:text-[16px] lg:text-[17px] transition cursor-pointer ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-[#f3f3f8] hover:bg-[#e7e7f3]'
                }`}
              type="button"
              onClick={toggleTheme}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <CustomConnect />
            {/* Mobile Hamburger Button */}
            <button
              className={`md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 ${isDark ? 'text-white' : 'text-[#111]'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 transition-all duration-300 ${isDark ? 'bg-white' : 'bg-[#111]'} ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 transition-all duration-300 ${isDark ? 'bg-white' : 'bg-[#111]'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 transition-all duration-300 ${isDark ? 'bg-white' : 'bg-[#111]'} ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`absolute top-full left-0 right-0 md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'} ${isDark ? 'bg-[#0a0a0f]/95 border-b border-white/10' : 'bg-white/95 border-b border-black/5'}`}>
            <div className="flex flex-col py-4 px-6 gap-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition ${isDark ? 'text-white bg-white/5' : 'text-[#111] bg-[#fef3c7]'}`}
              >
                Home
              </Link>
              <Link
                href="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-sm transition hover:bg-black/5 ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-[#555]'}`}
              >
                All Courses
              </Link>
              <Link
                href="/points"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-sm transition hover:bg-black/5 ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-[#555]'}`}
              >
                Points
              </Link>
              <Link
                href="/certificates"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-sm transition hover:bg-black/5 ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-[#555]'}`}
              >
                Certificates
              </Link>
              {/* Social Links in Mobile Menu */}
              <div className={`flex items-center gap-4 mt-2 pt-3 px-4 border-t ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                <a href="#" className={`text-lg opacity-80 hover:opacity-100 transition ${isDark ? 'text-white' : 'text-[#111]'}`}>
                  𝕏
                </a>
                <a href="#" className="text-lg text-[#5865F2]">
                  💬
                </a>
              </div>
            </div>
          </div>
        </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 pb-24 pt-6">
        {children}
      </main>

      <footer
        className={`w-full pt-20 pb-10 text-center border-t mt-10 ${isDark
          ? "bg-[#0a0a0f] border-white/10"
          : "bg-[#fff9ea] border-black/5"
          }`}
      >
        <h2
          className={`text-3xl md:text-4xl font-bold mb-4 tracking-[-0.03em] ${isDark ? "text-white" : "text-[#111]"
            }`}
        >
          Level Up Your Skills & Knowledge
          <br />
          with Safu Academy Today        </h2>

        <Link href="/courses">
          <button
            className={`px-10 py-4 rounded-full font-semibold text-base md:text-lg transition shadow-[0_20px_50px_rgba(15,23,42,0.35)] ${isDark
              ? "bg-[#ffb000] text-black hover:bg-[#ffa000]"
              : "bg-[#111] text-white hover:bg-[#222]"
              }`}
          >
            Start Learning Now
          </button>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10">
          <a href="https://safuverse.gitbook.io/safuverse-docs/" target="_blank" rel="noopener noreferrer">
            <button
              className={`px-8 py-3 rounded-full border font-medium transition text-sm ${isDark
                ? "border-white/20 text-white bg-white/5 hover:bg-white/10"
                : "border-black/80 text-[#111] bg-white hover:bg-[#f5f5f5]"
                }`}
            >
              Read Docs
            </button>
          </a>

          <a href="https://names.safuverse.com" target="_blank" rel="noopener noreferrer">
            <button
              className={`px-8 py-3 rounded-full shadow-sm border flex items-center gap-2 font-medium transition text-sm ${isDark
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-white border-black/10 text-[#111] hover:bg-[#f5f5f5]"
                }`}
            >
              Mint .safu
            </button>
          </a>

          <a href="https://safupad.app" target="_blank" rel="noopener noreferrer">
            <button
              className={`px-8 py-3 rounded-full shadow-sm border flex items-center gap-2 font-medium transition text-sm ${isDark
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-white border-black/10 text-[#111] hover:bg-[#f5f5f5]"
                }`}
            >
              Try SafuPad
            </button>
          </a>

          <a href="https://safuverse.gitbook.io/safuverse-docs/security/audits" target="_blank" rel="noopener noreferrer">
            <button
              className={`px-8 py-3 rounded-full shadow-sm border flex items-center gap-2 font-medium transition text-sm ${isDark
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-white border-black/10 text-[#111] hover:bg-[#f5f5f5]"
                }`}
            >
              Audit Report
            </button>
          </a>
        </div>

        <p
          className={`mt-12 text-[11px] tracking-[0.18em] uppercase ${isDark ? "text-gray-500" : "text-[#777]"
            }`}
        >
          Safu Academy © 2025 · Designed by Level3 Labs
        </p>
      </footer>
    </div>
  );
};

export default Layout;
