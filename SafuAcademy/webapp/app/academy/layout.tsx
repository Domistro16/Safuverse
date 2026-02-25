"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useENSName } from "@/hooks/getPrimaryName";

interface AcademyLayoutProps {
  children: ReactNode;
}

function navClass(active: boolean) {
  return active ? "text-white" : "text-nexid-muted hover:text-white transition-colors";
}

export default function AcademyLayout({ children }: AcademyLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { name: domainName } = useENSName({ owner: (address || "0x0000000000000000000000000000000000000000") as `0x${string}` });
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  useEffect(() => {
    if (domainName && typeof domainName === "string" && domainName.length > 0) {
      setDisplayName(domainName);
    } else if (address) {
      setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
    }
  }, [domainName, address]);

  const inBrowse = pathname === "/academy" || pathname.startsWith("/academy/campaign/");
  const inLeaderboard = pathname.startsWith("/academy/leaderboard");
  const inFaq = pathname.startsWith("/academy/faq");

  function handleSearchKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const q = searchValue.trim();
      if (q) {
        router.push(`/academy?q=${encodeURIComponent(q)}`);
      } else {
        router.push("/academy");
      }
    }
  }

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
            <Link href="/academy/leaderboard" className={navClass(inLeaderboard)}>
              Global Leaderboard
            </Link>
            <Link href="/academy/faq" className={navClass(inFaq)}>
              Protocol FAQ
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-5">
            {/* Search */}
            <div className="relative hidden lg:block group">
              <svg className="w-4 h-4 text-nexid-muted absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-nexid-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyUp={handleSearchKeyUp}
                placeholder="Search campaigns..."
                className="bg-[#0a0a0a] border border-[#222] rounded-full pl-9 pr-4 py-2 text-xs text-white transition-all w-60 focus:w-80 focus:bg-[#111] placeholder:text-[#555]"
              />
            </div>

            {displayName ? (
              <div className="hidden items-center gap-2.5 rounded-full border border-[#222] bg-[#111] px-4 py-1.5 text-xs font-medium text-white shadow-inner-glaze sm:flex cursor-pointer hover:border-white/20 transition-colors">
                <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                {displayName}
              </div>
            ) : null}
            <Link href="/academy/dashboard" className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all shrink-0">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="custom-scroll relative flex-1 overflow-y-auto pb-24">{children}</main>
    </div>
  );
}
