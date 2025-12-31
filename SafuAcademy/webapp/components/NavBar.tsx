"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CustomConnect } from "@/components/connectButton";
import { useTheme } from "@/app/providers";

function NavLink({
  href,
  children,
  isDark,
}: {
  href: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`hover:opacity-100 transition ${isActive
        ? isDark
          ? "text-white font-semibold"
          : "text-[#111] font-semibold"
        : isDark
          ? "text-gray-400 opacity-80"
          : "text-[#555] opacity-80"
        }`}
    >
      {children}
    </Link>
  );
}

export const NavBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className={`w-full flex items-center justify-between px-6 lg:px-10 py-4 lg:py-5 backdrop-blur border-b sticky top-0 z-50 ${isDark
        ? "bg-[#0a0a0f]/90 border-white/10"
        : "bg-white/60 border-black/5"
        }`}
    >
      <Link
        href="/"
        className={`flex items-center gap-2 text-[18px] lg:text-[20px] font-bold tracking-[-0.03em] ${isDark ? "text-white" : "text-[#111]"
          }`}
      >
        <img src="/Safuverse.png" className="h-10 hidden md:block"/>
         <img src="/small.png" className="h-11 block md:hidden"/>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm">
        <NavLink href="/" isDark={isDark}>
          Home
        </NavLink>
        <NavLink href="/courses" isDark={isDark}>
          All Courses
        </NavLink>
        <NavLink href="/points" isDark={isDark}>
          Points
        </NavLink>
        <NavLink href="/certificates" isDark={isDark}>
          Certificates
        </NavLink>
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

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] lg:w-[42px] lg:h-[42px] rounded-full items-center justify-center text-[14px] sm:text-[16px] lg:text-[17px] transition cursor-pointer ${isDark
            ? "bg-white/10 hover:bg-white/20"
            : "bg-[#f3f3f8] hover:bg-[#e7e7f3]"
            }`}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        <CustomConnect />

        {/* Mobile Hamburger Button */}
        <button
          className={`md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 ${isDark ? "text-white" : "text-[#111]"}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 transition-all duration-300 ${isDark ? "bg-white" : "bg-[#111]"} ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 transition-all duration-300 ${isDark ? "bg-white" : "bg-[#111]"} ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 transition-all duration-300 ${isDark ? "bg-white" : "bg-[#111]"} ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`absolute top-full left-0 right-0 md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"} ${isDark ? "bg-[#0a0a0f]/95 border-b border-white/10" : "bg-white/95 border-b border-black/5"}`}>
        <div className="flex flex-col py-4 px-6 gap-1">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-3 px-4 rounded-xl text-sm font-medium transition ${isDark ? "text-white hover:bg-white/5" : "text-[#111] hover:bg-black/5"}`}
          >
            Home
          </Link>
          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-3 px-4 rounded-xl text-sm transition hover:bg-black/5 ${isDark ? "text-gray-300 hover:bg-white/5" : "text-[#555]"}`}
          >
            All Courses
          </Link>
          <Link
            href="/points"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-3 px-4 rounded-xl text-sm transition hover:bg-black/5 ${isDark ? "text-gray-300 hover:bg-white/5" : "text-[#555]"}`}
          >
            Points
          </Link>
          <Link
            href="/certificates"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-3 px-4 rounded-xl text-sm transition hover:bg-black/5 ${isDark ? "text-gray-300 hover:bg-white/5" : "text-[#555]"}`}
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
  );
};

export default NavBar;
