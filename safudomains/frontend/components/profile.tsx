'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useAllOwnedNames } from '../hooks/getAllNames';
import { useReferralStats } from '../hooks/useReferralStats';
import Nav from './nav';
import { MobileNav } from './mobilenav';

const THEME_KEY = 'safudomains-theme';

export default function Profile() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const referralLinkRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState('light');
  const [copied, setCopied] = useState(false);

  // Fetch domains
  const { domains } = useAllOwnedNames(address?.toLowerCase() || '');

  // Fetch referral stats from ReferralVerifier contract
  const { referralCount, totalEarnings, referralPct, isLoading: referralLoading } = useReferralStats(address);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    window.localStorage.setItem(THEME_KEY, newTheme);
  };

  // Calculate stats
  const domainsOwned = domains.length;
  const totalReferrals = referralCount ? Number(referralCount) : 0;
  // totalEarnings is stored in BNB with 18 decimals
  const earningsInBnb = totalEarnings ? Number(formatEther(totalEarnings)) : 0;
  const currentPct = referralPct ? Number(referralPct) : 25;

  // Get the primary domain for referral link
  const primaryDomain = useMemo(() => {
    if (domains.length > 0) {
      return domains[0].name?.replace('.safu', '') || '';
    }
    return '';
  }, [domains]);

  const referralLink = primaryDomain
    ? `https://safu.domains?ref=${primaryDomain}`
    : '';

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('execCommand copy failed', e);
    }
    document.body.removeChild(textarea);
  };

  const copyReferralLink = () => {
    const text = referralLinkRef.current?.textContent?.trim();
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.warn('Clipboard API blocked, falling back', err);
          fallbackCopy(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    } else {
      fallbackCopy(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (timestamp: string | number) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-orange-50 via-white to-amber-50'}`}>
      <Nav />
      <MobileNav />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start gap-6 mb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <span role="img" aria-label="avatar">&#129489;</span>
            </div>
            <div className="flex-1">
              <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Your SafuVerse Profile
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Track your .safu domains, referral rewards, and on-chain identity in one clean view.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-lg transition-all`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
              Identity · Learning · Rewards
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              Live on BNB Chain · .safu
            </span>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" aria-label="profile stats">
          <article className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Domains Owned
              </span>
              <span className={`px-3 py-1 rounded-lg text-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                🏷️
              </span>
            </div>
            <p className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {domainsOwned}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Each name is a permanent .safu identity inside the SafuVerse.
            </p>
          </article>

          <article className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Referrals
              </span>
              <span className={`px-3 py-1 rounded-lg text-lg ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                👥
              </span>
            </div>
            <p className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {referralLoading ? '...' : totalReferrals}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              People who registered using your referral link.
            </p>
          </article>

          <article className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Referral Earnings
              </span>
              <span className={`px-3 py-1 rounded-lg text-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                💰
              </span>
            </div>
            <p className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {referralLoading ? '...' : `${earningsInBnb.toFixed(4)} BNB`}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Total earnings from referral rewards.
            </p>
          </article>
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domains Card */}
          <article className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Your .safu domains
                </h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                  Primary identity hub
                </span>
              </div>
            </div>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Every name you mint can route to your profiles, courses, AI agents, or future SafuVerse utilities.
            </p>

            {domains.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="mb-4">No domains found</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Register a Domain
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <th className="pb-3 font-medium">Domain</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Minted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.slice(0, 10).map((domain: any, index: number) => {
                      const now = Math.floor(Date.now() / 1000);
                      const isExpired = domain.expiryDate && Number(domain.expiryDate) < now;

                      return (
                        <tr
                          key={index}
                          className={`border-t cursor-pointer hover:bg-opacity-50 ${isDark ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}
                          onClick={() => router.push(`/resolve/${domain.name?.replace('.safu', '')}`)}
                        >
                          <td className={`py-4 font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                            {domain.name}
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                              isExpired
                                ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')
                                : (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600')
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-400' : 'bg-green-400'}`} />
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className={`py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {domain.createdAt ? formatDate(domain.createdAt) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {domains.length > 10 && (
                  <button
                    onClick={() => router.push('/mynames')}
                    className={`mt-4 w-full py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                  >
                    View all {domains.length} domains
                  </button>
                )}
              </div>
            )}
          </article>

          {/* Referrals Card */}
          <article className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Referral & rewards
                </h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                  InfoFi ready
                </span>
              </div>
            </div>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Share your link, let frens mint, and watch your SafuVerse earnings stack over time.
            </p>

            {/* Referral Link Box */}
            <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Your referral link
                  </div>
                  <div
                    ref={referralLinkRef}
                    className={`text-sm font-mono truncate ${isDark ? 'text-orange-400' : 'text-orange-600'}`}
                  >
                    {referralLink || 'Register a domain to get your referral link'}
                  </div>
                </div>
                {referralLink && (
                  <button
                    onClick={copyReferralLink}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* Referral Info */}
            <div className={`space-y-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Earn <strong>{currentPct}%</strong> of registration fees when someone mints using your link.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Start at 25% and unlock 30% after 5 successful referrals.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Rewards are sent directly to your wallet instantly on registration.
              </p>
            </div>
          </article>
        </section>
      </div>

      {/* Footer */}
      <footer className={`py-12 ${isDark ? 'bg-gray-900/50' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`}>
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Boost your Learning & Knowledge<br />
            with SafuVerse Now
          </h2>
          <button
            onClick={() => router.push('/')}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${isDark ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white hover:bg-gray-100 text-orange-600'}`}
          >
            Explore Domains
          </button>
          <div className={`mt-8 text-sm ${isDark ? 'text-gray-500' : 'text-white/80'}`}>
            SafuVerse © 2025
          </div>
        </div>
      </footer>
    </div>
  );
}
