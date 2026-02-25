"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useENSName } from "@/hooks/getPrimaryName";

interface AcademyLayoutProps {
  children: ReactNode;
}

function navClass(active: boolean) {
  return active ? "text-white" : "text-nexid-muted hover:text-white";
}

export default function AcademyLayout({ children }: AcademyLayoutProps) {
  const pathname = usePathname();
  const { address } = useAccount();
  const { name: domainName } = useENSName({ owner: (address || "0x0000000000000000000000000000000000000000") as `0x${string}` });
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (domainName && typeof domainName === "string" && domainName.length > 0) {
      setDisplayName(domainName);
    } else if (address) {
      setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
    }
  }, [domainName, address]);

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
            {displayName ? (
              <div className="hidden items-center gap-2.5 rounded-full border border-[#222] bg-[#111] px-4 py-1.5 text-xs text-white sm:flex">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {displayName}
              </div>
            ) : null}
            <Link href="/academy/dashboard" className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="custom-scroll relative flex-1 overflow-y-auto pb-24">{children}</main>
    </div>
  );
}
