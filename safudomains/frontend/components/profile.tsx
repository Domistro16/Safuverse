'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useAllOwnedNames } from '../hooks/getAllNames';
import { useReferralStats } from '../hooks/useReferralStats';
import { useENSName } from '../hooks/getPrimaryName';
import Nav from './nav';
import { MobileNav } from './mobilenav';
import '../app/profile/profile.css';

const THEME_KEY = 'safudomains-theme';

export default function Profile() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const referralLinkRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState('light');
  const [copied, setCopied] = useState(false);

  // Fetch domains
  const { domains, isLoading: domainsLoading } = useAllOwnedNames(address?.toLowerCase() || '');

  // Fetch referral stats from ReferralVerifier contract
  const { referralCount, totalEarnings, referralPct, isLoading: referralLoading } = useReferralStats(address);

  // Fetch user's primary name (reverse record)
  const { name: primaryName, loading: primaryNameLoading } = useENSName({ owner: address as `0x${string}` });

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }

    // Listen for body class changes (when nav toggles dark mode)
    const observer = new MutationObserver(() => {
      const isDarkMode = document.body.classList.contains('dark-mode');
      setTheme(isDarkMode ? 'dark' : 'light');
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Check initial state from body class
    if (document.body.classList.contains('dark-mode')) {
      setTheme('dark');
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const isDark = theme === 'dark';

  // Calculate stats
  const domainsOwned = domains.length;
  const totalReferrals = referralCount ? Number(referralCount) : 0;
  const earningsInBnb = totalEarnings ? Number(formatEther(totalEarnings)) : 0;
  const currentPct = referralPct ? Number(referralPct) : 25;

  // Get the primary domain for referral link (prefer primary name, fallback to first domain)
  const referralDomain = useMemo(() => {
    // First try the primary name (reverse record)
    if (primaryName && typeof primaryName === 'string' && primaryName.endsWith('.safu')) {
      return primaryName.replace('.safu', '');
    }
    // Fallback to first owned domain
    if (domains.length > 0) {
      return domains[0].name?.replace('.safu', '') || '';
    }
    return '';
  }, [primaryName, domains]);

  const referralLink = referralDomain
    ? `https://names.safuverse.com?ref=${referralDomain}`
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
    <>
      <Nav />
      <MobileNav />
      <div className="soft-mist-bg" />
      <div className="nav-spacer" />

      {/* PROFILE PAGE */}
      <div className="profile-shell">
        <div className="profile-container">
          <header className="profile-header">
            <div className="profile-main-meta">
              <div className="avatar">
                <div className="avatar-inner">🧑‍🦲</div>
              </div>
              <div>
                <h1 className="profile-title">Your SafuVerse Profile</h1>
                <p className="profile-subline">
                  Track your .safu domains, referral rewards, and on‑chain
                  identity in one clean view.
                </p>
              </div>
            </div>
            <div className="pill-row">
              <div className="pill">Identity · Learning · Rewards</div>
              <div className="pill">Live on BNB Chain · .safu</div>
            </div>
          </header>

          <section className="stats-grid" aria-label="profile stats">
            <article className="stat-card">
              <div className="stat-label-row">
                <span>Domains Owned</span>
                <span className="stat-icon-pill">🏷️</span>
              </div>
              <p className="stat-value">{domainsOwned}</p>
              <p className="stat-caption">
                Each name is a permanent .safu identity inside the SafuVerse.
              </p>
            </article>

            <article className="stat-card">
              <div className="stat-label-row">
                <span>Referral Earnings</span>
                <span className="stat-icon-pill">💰</span>
              </div>
              <p className="stat-value">
                {referralLoading ? '...' : `${earningsInBnb.toFixed(4)} BNB`}
              </p>
              <p className="stat-caption">
                Total rewards earned from sharing your unique mint link.
              </p>
            </article>

            <article className="stat-card">
              <div className="stat-label-row">
                <span>Total Referrals</span>
                <span className="stat-icon-pill">👥</span>
              </div>
              <p className="stat-value">{referralLoading ? '...' : totalReferrals}</p>
              <p className="stat-caption">
                People who minted a .safu domain through your link.
              </p>
            </article>
          </section>

          <section className="profile-layout">
            <article className="domains-card">
              <div className="section-heading">
                <h2>Your .safu domains</h2>
                <span className="tag-pill">Primary identity hub</span>
              </div>
              <p className="section-caption">
                Every name you mint can route to your profiles, courses, AI
                agents, or future SafuVerse utilities.
              </p>

              {domainsLoading ? (
                <div className="no-domains">
                  <p>Loading your domains...</p>
                </div>
              ) : domains.length === 0 ? (
                <div className="no-domains">
                  <p>No domains found</p>
                  <button className="register-btn" onClick={() => router.push('/')}>
                    Register a Domain
                  </button>
                </div>
              ) : (
                <>
                  <table className="domains-table">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Status</th>
                        <th>Minted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domains.slice(0, 10).map((domain: any, index: number) => {
                        const now = Math.floor(Date.now() / 1000);
                        const isExpired = domain.expiryDate && Number(domain.expiryDate) < now;

                        return (
                          <tr
                            key={index}
                            onClick={() => router.push(`/resolve/${domain.name?.replace('.safu', '')}`)}
                          >
                            <td className="domain-name">{domain.name}</td>
                            <td>
                              <span className={`status-pill ${isExpired ? 'expired' : ''}`}>
                                <span className={`status-dot ${isExpired ? 'expired' : ''}`} />
                                {isExpired ? 'Expired' : 'Active'}
                              </span>
                            </td>
                            <td>{domain.createdAt ? formatDate(domain.createdAt) : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {domains.length > 10 && (
                    <button className="view-all-btn" onClick={() => router.push('/mynames')}>
                      View all {domains.length} domains
                    </button>
                  )}
                </>
              )}
            </article>

            <article className="referrals-card">
              <div className="section-heading">
                <h2>Referral &amp; rewards</h2>
                <span className="tag-pill">InfoFi ready</span>
              </div>
              <p className="section-caption">
                Share your link, let frens mint, and watch your SafuVerse
                earnings stack over time.
              </p>

              <div className="referral-code-box">
                <div>
                  <div className="referral-label">Your referral link</div>
                  <div
                    className="referral-code-text"
                    ref={referralLinkRef}
                  >
                    {referralLink || 'Register a domain to get your referral link'}
                  </div>
                </div>
                {referralLink && (
                  <button
                    className={`referral-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={copyReferralLink}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              <div className="referral-bullets">
                <p>• Earn {currentPct}% of fees whenever someone mints using your link.</p>
                <p>• Start at 25% and unlock 30% after 5 successful referrals.</p>
                <p>• Rewards sent directly to your wallet on registration.</p>
              </div>
            </article>
          </section>
        </div>
      </div>
    </>
  );
}
