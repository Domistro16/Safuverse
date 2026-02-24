"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface AcademyLayoutProps {
  children: ReactNode;
}

function navClass(active: boolean) {
  return active ? "text-white" : "text-nexid-muted hover:text-white";
}

export default function AcademyLayout({ children }: AcademyLayoutProps) {
  const pathname = usePathname();

  const inBrowse = pathname === "/academy" || pathname.startsWith("/academy/campaign/");
  const inFaq = pathname.startsWith("/academy/faq");

  return (
    <div className="nexid-academy flex h-screen flex-col overflow-hidden">
      <div className="bg-stardust" />
      <div className="bg-glow" />
      <div className="shooting-star star-1" />
      <div className="shooting-star star-2" />
      <div className="shooting-star star-3" />

      <header className="sticky top-0 z-50 h-20 shrink-0 border-b border-nexid-border bg-[#030303]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-10 px-6 lg:px-10">
          <Link href="/academy" className="font-display text-2xl font-black tracking-tighter">
            N<span className="hidden sm:inline">ex</span>ID
            <span className="text-nexid-gold">.</span>
          </Link>

          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <Link href="/academy" className={navClass(inBrowse)}>
              Academy
            </Link>
            <Link href="/academy/faq" className={navClass(inFaq)}>
              Protocol FAQ
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-2.5 rounded-full border border-[#222] bg-[#111] px-4 py-1.5 text-xs text-white sm:flex">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              founder<span className="text-nexid-gold">.id</span>
            </div>
            <Link href="/sovereign-terminal" className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="custom-scroll relative flex-1 overflow-y-auto pb-24">{children}</main>
    </div>
  );
}
