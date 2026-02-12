'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { formatEther, namehash, keccak256, toBytes } from 'viem';
import { useAllOwnedNames } from '../hooks/getAllNames';
import { useReferralStats } from '../hooks/useReferralStats';
import { useENSName } from '../hooks/getPrimaryName';
import {
  LayoutGrid,
  Fingerprint,
  CreditCard,
  Award,
  History,
  Settings,
  TrendingUp,
  RefreshCw,
  Download,
  Check,
  Plus,
  Wallet,
  Twitter,
  Github,
  Activity,
  Shield,
  MoreVertical,
  Image as ImageIcon,
  Package,
  Star,
  X,
  CheckCircle,
} from 'lucide-react';
import { constants } from '../constant';
import Modal from 'react-modal';
import DomainImage from './DomainImage';
import '../app/dashboard/dashboard.css';

if (typeof window !== 'undefined') {
  Modal.setAppElement(document.body);
}

// ── ABI Definitions (reused from profile) ──────────────────────────
const isWrappedAbi = [
  {
    inputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }],
    name: 'isWrapped',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const setAddrAbi = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'address', name: 'a', type: 'address' },
    ],
    name: 'setAddr',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const wrapETH2LDAbi = [
  {
    inputs: [
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address', name: 'wrappedOwner', type: 'address' },
      { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
      { internalType: 'address', name: 'resolver', type: 'address' },
    ],
    name: 'wrapETH2LD',
    outputs: [{ internalType: 'uint64', name: 'expiry', type: 'uint64' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const approveAbi = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const unwrapETH2LDAbi = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'labelhash', type: 'bytes32' },
      { internalType: 'address', name: 'registrant', type: 'address' },
      { internalType: 'address', name: 'controller', type: 'address' },
    ],
    name: 'unwrapETH2LD',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const setNameAbi = [
  {
    inputs: [{ internalType: 'string', name: 'name', type: 'string' }],
    name: 'setName',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const addrAbi = [
  {
    inputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }],
    name: 'addr',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// ── Hooks ──────────────────────────────────────────────────────────
function useIsWrapped(name: string) {
  const { data: wrapped } = useReadContract({
    abi: isWrappedAbi,
    functionName: 'isWrapped',
    address: constants.NameWrapper,
    args: [namehash(name)],
  });
  return wrapped as boolean | undefined;
}

// ── Modal Props ────────────────────────────────────────────────────
interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
}

// ── Domain Image Modal ─────────────────────────────────────────────
function DomainImageModal({ isOpen, onClose, domain }: ActionModalProps) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} closeTimeoutMS={300} className="modal-content" overlayClassName="modal-overlay">
      <div className="action-modal" style={{ background: '#1a1a1a' }}>
        <button onClick={onClose} className="modal-close-btn" style={{ color: '#888' }}>
          <X size={24} />
        </button>
        <h2 className="modal-title" style={{ color: '#fff' }}>{domain}</h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DomainImage domain={domain} className="w-full max-w-md rounded-lg" />
        </div>
      </div>
    </Modal>
  );
}

// ── Change BSC Record Modal ────────────────────────────────────────
function ChangeBSCRecordModal({ isOpen, onClose, domain }: ActionModalProps) {
  const [bscAddress, setBscAddress] = useState('');
  const [step, setStep] = useState(0);
  const { writeContractAsync, isPending, data: hash } = useWriteContract();

  const { data: currentAddr } = useReadContract({
    abi: addrAbi,
    address: constants.PublicResolver,
    functionName: 'addr',
    args: [namehash(domain)],
  });
  const currentBscAddress = currentAddr as string | undefined;

  const handleSetBSCRecord = async () => {
    try {
      await writeContractAsync({
        abi: setAddrAbi,
        address: constants.PublicResolver,
        functionName: 'setAddr',
        args: [namehash(domain), bscAddress as `0x${string}`],
      });
      setStep(1);
    } catch (error) {
      console.error('Set BSC record error:', error);
    }
  };

  const handleClose = () => { setStep(0); setBscAddress(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} closeTimeoutMS={300} className="modal-content" overlayClassName="modal-overlay">
      <div className="action-modal" style={{ background: '#1a1a1a' }}>
        <button onClick={handleClose} className="modal-close-btn" style={{ color: '#888' }}><X size={24} /></button>
        {step === 0 ? (
          <>
            <h2 className="modal-title" style={{ color: '#fff' }}>Change BSC Record for {domain}</h2>
            <p className="modal-desc" style={{ color: '#aaa' }}>Enter the BSC address this domain should resolve to</p>
            <input value={bscAddress} onChange={(e) => setBscAddress(e.target.value)} placeholder={currentBscAddress || '0x...'} className="modal-input" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }} />
            <div className="modal-buttons">
              <button onClick={handleClose} className="modal-btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
              <button onClick={handleSetBSCRecord} disabled={isPending || !bscAddress} className="modal-btn-primary" style={{ background: '#fff', color: '#000', opacity: (isPending || !bscAddress) ? 0.6 : 1 }}>
                {isPending ? 'Confirming...' : 'Update Record'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title" style={{ color: '#fff', textAlign: 'center' }}>BSC Record Updated!</h2>
            <p className="modal-desc" style={{ color: '#aaa', textAlign: 'center' }}>{domain} now resolves to {bscAddress.slice(0, 6)}...{bscAddress.slice(-4)}</p>
            {hash && <p style={{ color: '#888', fontSize: '12px', wordBreak: 'break-all', textAlign: 'center' }}>TX: {hash}</p>}
            <button onClick={handleClose} className="modal-btn-primary" style={{ width: '100%', background: '#fff', color: '#000', marginTop: '16px' }}>Done</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Wrap Modal ─────────────────────────────────────────────────────
function WrapModal({ isOpen, onClose, domain }: ActionModalProps) {
  const label = domain.replace(/\.id$/, '');
  const { address } = useAccount();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState('');
  const { writeContractAsync: approveContract } = useWriteContract();
  const { writeContractAsync: wrapContract, data: hash } = useWriteContract();

  const handleWrap = async () => {
    const labelhash = keccak256(toBytes(label));
    try {
      setStep(1); setInfo('Approving wrapper contract...');
      await approveContract({ abi: approveAbi, address: constants.BaseRegistrar, functionName: 'approve', args: [constants.NameWrapper, labelhash] });
      setInfo('Wrapping name...');
      await wrapContract({ abi: wrapETH2LDAbi, address: constants.NameWrapper, functionName: 'wrapETH2LD', args: [label, address, 0, constants.PublicResolver] });
      setInfo('Wrap complete!');
    } catch (error) { console.error('Wrap error:', error); setInfo('Error wrapping name'); }
  };

  const handleClose = () => { setStep(0); setInfo(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} closeTimeoutMS={300} className="modal-content" overlayClassName="modal-overlay">
      <div className="action-modal" style={{ background: '#1a1a1a' }}>
        <button onClick={handleClose} className="modal-close-btn" style={{ color: '#888' }}><X size={24} /></button>
        {step === 0 ? (
          <>
            <h2 className="modal-title" style={{ color: '#fff' }}>Wrap {domain}</h2>
            <p className="modal-desc" style={{ color: '#aaa' }}>Wrapping your name gives you new features like permissions and subname control.</p>
            <div className="modal-buttons">
              <button onClick={handleClose} className="modal-btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
              <button onClick={handleWrap} className="modal-btn-primary" style={{ background: '#fff', color: '#000' }}>Wrap Name</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title" style={{ color: '#fff', textAlign: 'center' }}>{info}</h2>
            {hash && <p style={{ color: '#888', fontSize: '12px', wordBreak: 'break-all', textAlign: 'center' }}>TX: {hash}</p>}
            {info === 'Wrap complete!' && <button onClick={handleClose} className="modal-btn-primary" style={{ width: '100%', background: '#fff', color: '#000', marginTop: '16px' }}>Done</button>}
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Unwrap Modal ───────────────────────────────────────────────────
function UnwrapModal({ isOpen, onClose, domain }: ActionModalProps) {
  const label = domain.replace(/\.id$/, '');
  const { address } = useAccount();
  const [step, setStep] = useState(0);
  const [ownerAddress, setOwnerAddress] = useState(address || '');
  const [managerAddress, setManagerAddress] = useState(address || '');
  const { writeContractAsync, isPending, data: hash } = useWriteContract();

  const handleUnwrap = async () => {
    const labelhash = keccak256(toBytes(label));
    try {
      await writeContractAsync({ abi: unwrapETH2LDAbi, address: constants.NameWrapper, functionName: 'unwrapETH2LD', args: [labelhash, ownerAddress as `0x${string}`, managerAddress as `0x${string}`] });
      setStep(1);
    } catch (error) { console.error('Unwrap error:', error); }
  };

  const handleClose = () => { setStep(0); setOwnerAddress(address || ''); setManagerAddress(address || ''); onClose(); };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} closeTimeoutMS={300} className="modal-content" overlayClassName="modal-overlay">
      <div className="action-modal" style={{ background: '#1a1a1a' }}>
        <button onClick={handleClose} className="modal-close-btn" style={{ color: '#888' }}><X size={24} /></button>
        {step === 0 ? (
          <>
            <h2 className="modal-title" style={{ color: '#fff' }}>Unwrap {domain}</h2>
            <p className="modal-desc" style={{ color: '#aaa' }}>Owner address (receives the NFT)</p>
            <input value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} placeholder="Owner address" className="modal-input" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }} />
            <p className="modal-desc" style={{ color: '#aaa', marginTop: '12px' }}>Manager address</p>
            <input value={managerAddress} onChange={(e) => setManagerAddress(e.target.value)} placeholder="Manager address" className="modal-input" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }} />
            <div className="modal-buttons">
              <button onClick={handleClose} className="modal-btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
              <button onClick={handleUnwrap} disabled={isPending} className="modal-btn-primary" style={{ background: '#fff', color: '#000', opacity: isPending ? 0.6 : 1 }}>
                {isPending ? 'Confirming...' : 'Unwrap'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title" style={{ color: '#fff', textAlign: 'center' }}>Transaction Submitted</h2>
            <p className="modal-desc" style={{ color: '#aaa', textAlign: 'center' }}>Your unwrap transaction has been submitted.</p>
            {hash && <p style={{ color: '#888', fontSize: '12px', wordBreak: 'break-all', textAlign: 'center' }}>TX: {hash}</p>}
            <button onClick={handleClose} className="modal-btn-primary" style={{ width: '100%', background: '#fff', color: '#000', marginTop: '16px' }}>Done</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Set Primary Modal ──────────────────────────────────────────────
function SetPrimaryModal({ isOpen, onClose, domain }: ActionModalProps) {
  const [step, setStep] = useState(0);
  const { writeContractAsync, isPending, data: hash } = useWriteContract();

  const handleSetPrimary = async () => {
    try {
      await writeContractAsync({ abi: setNameAbi, address: constants.ReverseRegistrar, functionName: 'setName', args: [domain] });
      setStep(1);
    } catch (error) { console.error('Set primary error:', error); }
  };

  const handleClose = () => { setStep(0); onClose(); };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} closeTimeoutMS={300} className="modal-content" overlayClassName="modal-overlay">
      <div className="action-modal" style={{ background: '#1a1a1a' }}>
        <button onClick={handleClose} className="modal-close-btn" style={{ color: '#888' }}><X size={24} /></button>
        {step === 0 ? (
          <>
            <h2 className="modal-title" style={{ color: '#fff' }}>Set as Primary Name</h2>
            <p className="modal-desc" style={{ color: '#aaa' }}>Setting <strong>{domain}</strong> as your primary name will display it across dApps when you connect your wallet.</p>
            <div className="modal-buttons">
              <button onClick={handleClose} className="modal-btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
              <button onClick={handleSetPrimary} disabled={isPending} className="modal-btn-primary" style={{ background: '#fff', color: '#000', opacity: isPending ? 0.6 : 1 }}>
                {isPending ? 'Confirming...' : 'Set Primary'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title" style={{ color: '#fff', textAlign: 'center' }}>Primary Name Set!</h2>
            <p className="modal-desc" style={{ color: '#aaa', textAlign: 'center' }}>{domain} is now your primary name.</p>
            {hash && <p style={{ color: '#888', fontSize: '12px', wordBreak: 'break-all', textAlign: 'center' }}>TX: {hash}</p>}
            <button onClick={handleClose} className="modal-btn-primary" style={{ width: '100%', background: '#fff', color: '#000', marginTop: '16px' }}>Done</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Actions Dropdown ───────────────────────────────────────────────
function ActionsDropdown({ domain, isPrimary }: { domain: string; isPrimary: boolean }) {
  const isWrapped = useIsWrapped(domain);
  const [isOpen, setIsOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showResolverModal, setShowResolverModal] = useState(false);
  const [showWrapModal, setShowWrapModal] = useState(false);
  const [showUnwrapModal, setShowUnwrapModal] = useState(false);
  const [showPrimaryModal, setShowPrimaryModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div ref={dropdownRef} className="actions-dropdown-container">
        <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="actions-trigger-btn">
          <MoreVertical size={16} />
        </button>
        {isOpen && (
          <div className="actions-menu" onClick={(e) => e.stopPropagation()}>
            <button className="actions-menu-item" onClick={() => { setShowImageModal(true); setIsOpen(false); }}><ImageIcon size={14} /> View Image</button>
            <button className="actions-menu-item" onClick={() => { setShowResolverModal(true); setIsOpen(false); }}><Settings size={14} /> Change BSC Record</button>
            {isWrapped ? (
              <button className="actions-menu-item" onClick={() => { setShowUnwrapModal(true); setIsOpen(false); }}><Package size={14} /> Unwrap</button>
            ) : (
              <button className="actions-menu-item" onClick={() => { setShowWrapModal(true); setIsOpen(false); }}><Package size={14} /> Wrap</button>
            )}
            {!isPrimary && (
              <button className="actions-menu-item" onClick={() => { setShowPrimaryModal(true); setIsOpen(false); }}><Star size={14} /> Set as Primary</button>
            )}
          </div>
        )}
      </div>
      <DomainImageModal isOpen={showImageModal} onClose={() => setShowImageModal(false)} domain={domain} />
      <ChangeBSCRecordModal isOpen={showResolverModal} onClose={() => setShowResolverModal(false)} domain={domain} />
      <WrapModal isOpen={showWrapModal} onClose={() => setShowWrapModal(false)} domain={domain} />
      <UnwrapModal isOpen={showUnwrapModal} onClose={() => setShowUnwrapModal(false)} domain={domain} />
      <SetPrimaryModal isOpen={showPrimaryModal} onClose={() => setShowPrimaryModal(false)} domain={domain} />
    </>
  );
}

// ── Tab Definitions ────────────────────────────────────────────────
type TabId = 'overview' | 'identities' | 'payments' | 'reputation' | 'history' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid size={20} /> },
  { id: 'identities', label: 'My Identities', icon: <Fingerprint size={20} /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
  { id: 'reputation', label: 'Reputation', icon: <Award size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

// ════════════════════════════════════════════════════════════════════
// ── Main Dashboard Component ───────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [payMode, setPayMode] = useState<'link' | 'invoice'>('link');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Data hooks
  const { domains, isLoading: domainsLoading } = useAllOwnedNames(address?.toLowerCase() || '');
  const { referralCount, totalEarnings, referralPct, isLoading: referralLoading } = useReferralStats(address);
  const { name: primaryName } = useENSName({ owner: address as `0x${string}` });

  // Computed
  const domainsOwned = domains.length;
  const totalReferrals = referralCount ? Number(referralCount) : 0;
  const earningsInUsdc = totalEarnings ? Number(formatEther(totalEarnings)) : 0;
  const currentPct = referralPct ? Number(referralPct) : 25;

  const displayName = useMemo(() => {
    if (primaryName && typeof primaryName === 'string' && primaryName.endsWith('.id')) return primaryName;
    if (domains.length > 0 && domains[0].name) return domains[0].name;
    if (address) return address.slice(0, 6) + '...' + address.slice(-4);
    return '';
  }, [primaryName, domains, address]);

  const referralDomain = useMemo(() => {
    if (primaryName && typeof primaryName === 'string' && primaryName.endsWith('.id')) return primaryName.replace('.id', '');
    if (domains.length > 0) return domains[0].name?.replace('.id', '') || '';
    return '';
  }, [primaryName, domains]);

  const referralLink = referralDomain ? `https://names.nexdomains.com?ref=${referralDomain}` : '';

  const copyToClipboard = (text: string) => {
    if (!text) return;
    const fallback = (t: string) => {
      const textarea = document.createElement('textarea');
      textarea.value = t;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch (e) { console.warn('copy failed', e); }
      document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true); setToastVisible(true);
        setTimeout(() => { setCopied(false); setToastVisible(false); }, 2000);
      }).catch(() => {
        fallback(text);
        setCopied(true); setToastVisible(true);
        setTimeout(() => { setCopied(false); setToastVisible(false); }, 2000);
      });
    } else {
      fallback(text);
      setCopied(true); setToastVisible(true);
      setTimeout(() => { setCopied(false); setToastVisible(false); }, 2000);
    }
  };

  const formatDate = (timestamp: string | number) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── Not connected ────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="dashboard-container">
        <div className="dash-connect-prompt">
          <div className="dash-connect-icon">🔐</div>
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to access your dashboard and manage your .id domains.</p>
        </div>
      </div>
    );
  }

  // ── Tab content renderers ────────────────────────────────────────
  const renderOverview = () => (
    <div className="dash-fade-in">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Welcome back, {displayName.replace('.id', '')}</h2>
          <p className="dash-subtitle">Here is what&apos;s happening with your decentralized identity today.</p>
        </div>
        <button className="dash-refresh-btn" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-label">Domains Owned</div>
          <div className="dash-stat-val">{domainsLoading ? '...' : domainsOwned}</div>
          <div className="dash-stat-trend" style={{ color: '#1565C0' }}>
            {primaryName ? '1 Primary' : 'No primary set'}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">Total Referrals</div>
          <div className="dash-stat-val">{referralLoading ? '...' : totalReferrals}</div>
          <div className="dash-stat-trend"><TrendingUp size={16} /> {currentPct}% commission</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">Referral Earnings</div>
          <div className="dash-stat-val">{referralLoading ? '...' : `${earningsInUsdc.toFixed(2)} USDC`}</div>
          <div className="dash-stat-trend">Lifetime earnings</div>
        </div>
      </div>

      <div className="refer-section">
        <div className="refer-bg" />
        <div className="refer-content">
          <h3 className="refer-title">Invite Friends, Earn {currentPct}% Forever.</h3>
          <p className="refer-desc">Share your unique link. When someone mints a .id name, you instantly get {currentPct}% of the mint price sent to your wallet.</p>
          <div className="refer-input-group">
            <input type="text" className="refer-input" value={referralLink || 'Register a domain to get your referral link'} readOnly />
            {referralLink && (
              <button className={`refer-btn ${copied ? 'copied' : ''}`} onClick={() => copyToClipboard(referralLink)}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            )}
          </div>
        </div>
      </div>

      <h3 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '24px' }}>Your Domains</h3>
      {domainsLoading ? (
        <p style={{ color: '#888' }}>Loading your domains...</p>
      ) : domains.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <p style={{ marginBottom: '16px' }}>No domains found</p>
          <button className="dash-mint-btn" onClick={() => router.push('/')}>Register a Domain</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="d-table">
            <thead><tr><th>Domain</th><th>Status</th><th>Minted</th><th>Actions</th></tr></thead>
            <tbody>
              {domains.slice(0, 5).map((domain: any, i: number) => {
                const now = Math.floor(Date.now() / 1000);
                const isExpired = domain.expiryDate && Number(domain.expiryDate) < now;
                const isPrimary = primaryName === domain.name;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>
                      {domain.name}
                      {isPrimary && <span className="dash-status-pill primary" style={{ marginLeft: 8 }}>Primary</span>}
                    </td>
                    <td><span className={`dash-status-pill ${isExpired ? 'expired' : 'active'}`}>{isExpired ? 'Expired' : 'Active'}</span></td>
                    <td>{domain.createdAt ? formatDate(domain.createdAt) : '-'}</td>
                    <td><ActionsDropdown domain={domain.name} isPrimary={isPrimary} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {domains.length > 5 && (
        <button
          style={{ marginTop: '16px', color: '#666', fontWeight: 600, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setActiveTab('identities')}
        >
          View all {domains.length} domains →
        </button>
      )}
    </div>
  );

  const renderIdentities = () => (
    <div className="dash-fade-in">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">My Identities</h2>
          <p className="dash-subtitle">Manage your .id domains and configurations.</p>
        </div>
        <button className="dash-mint-btn" onClick={() => router.push('/')}>Mint New ID</button>
      </div>

      {domainsLoading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : domains.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <p style={{ marginBottom: '16px' }}>No domains found. Mint your first .id identity!</p>
          <button className="dash-mint-btn" onClick={() => router.push('/')}>Register a Domain</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {domains.map((domain: any, i: number) => {
            const isPrimary = primaryName === domain.name;
            const now = Math.floor(Date.now() / 1000);
            const isExpired = domain.expiryDate && Number(domain.expiryDate) < now;
            const initial = domain.name ? domain.name[0].toUpperCase() : '?';
            return (
              <div key={i} className="identity-card">
                <div className="identity-card-left">
                  <div className={`identity-card-icon ${isPrimary ? '' : 'secondary'}`}>{initial}</div>
                  <div>
                    <div className="identity-card-name">
                      {domain.name}
                      {isPrimary && <span className="dash-status-pill primary">Primary</span>}
                      {isExpired && <span className="dash-status-pill expired">Expired</span>}
                    </div>
                    <div className="identity-card-sub">Lifetime Ownership</div>
                  </div>
                </div>
                <ActionsDropdown domain={domain.name} isPrimary={isPrimary} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="dash-fade-in">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Payments</h2>
          <p className="dash-subtitle">Create payment links or send invoices.</p>
        </div>
      </div>

      <div className="tabs-pill">
        <button className={`tab-pill-btn ${payMode === 'link' ? 'active' : ''}`} onClick={() => { setPayMode('link'); setShowInvoicePreview(false); }}>Single Link</button>
        <button className={`tab-pill-btn ${payMode === 'invoice' ? 'active' : ''}`} onClick={() => { setPayMode('invoice'); setShowInvoicePreview(false); }}>Create Invoice</button>
      </div>

      {payMode === 'link' ? (
        <div className="pay-form">
          <div className="dash-form-group">
            <label className="dash-form-label">Amount (USDC)</label>
            <input type="number" className="dash-form-input" placeholder="0.00" />
          </div>
          <div className="dash-form-group">
            <label className="dash-form-label">Description (Optional)</label>
            <input type="text" className="dash-form-input" placeholder="What is this for?" />
          </div>
          <button className="dash-btn-primary" onClick={() => setShowInvoicePreview(true)}>Generate Link</button>
        </div>
      ) : (
        <div className="pay-form">
          <div className="dash-form-group">
            <label className="dash-form-label">Client Email / Web3 ID</label>
            <input type="text" className="dash-form-input" placeholder="client@email.com or client.id" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="dash-form-group">
              <label className="dash-form-label">Invoice Number</label>
              <input type="text" className="dash-form-input" value="#INV-001" readOnly />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label">Due Date</label>
              <input type="date" className="dash-form-input" />
            </div>
          </div>
          <div style={{ padding: '16px', background: '#fafafa', borderRadius: '12px', marginBottom: '24px', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
              <span>Item</span><span>Amount</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input type="text" className="dash-form-input" style={{ flex: 2 }} placeholder="Item Description" />
              <input type="number" className="dash-form-input" style={{ flex: 1 }} placeholder="0.00" />
            </div>
            <button style={{ fontSize: '12px', fontWeight: 700, color: '#FFB000', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={12} /> Add Item
            </button>
          </div>
          <button className="dash-btn-primary" onClick={() => setShowInvoicePreview(true)}>Send Invoice</button>
        </div>
      )}

      {showInvoicePreview && (
        <div className="invoice-preview">
          <div className="invoice-preview-header">
            <div className="invoice-preview-icon"><Check size={24} /></div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '18px', color: '#33691E', margin: 0 }}>Generated Successfully</h4>
              <p style={{ fontSize: '14px', color: '#558B2F', margin: 0 }}>Share this link to get paid.</p>
            </div>
          </div>
          <div className="invoice-preview-link">https://pay.nexid.com/inv/{Math.random().toString(36).slice(2, 8)}</div>
          <button style={{ fontSize: '14px', fontWeight: 700, color: '#111', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => copyToClipboard('https://pay.nexid.com/inv/829s9a')}>Copy Link</button>
        </div>
      )}
    </div>
  );

  const renderReputation = () => (
    <div className="dash-fade-in">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Reputation Score</h2>
          <p className="dash-subtitle">Your on-chain trust metric.</p>
        </div>
      </div>

      <div className="rep-grid">
        <div className="bento-card dark" style={{ textAlign: 'center' }}>
          <div className="rep-score-big">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#00C853" strokeWidth="8" strokeLinecap="round" strokeDasharray="283" strokeDashoffset="10" />
            </svg>
            <div style={{ position: 'absolute' }}><div className="rep-val-big">98</div></div>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '20px', color: 'white' }}>Excellent</h3>
          <p style={{ fontSize: '14px', color: '#888', margin: '8px 0 24px' }}>Your identity is highly trusted by dApps.</p>
          <button style={{ width: '100%', background: 'white', color: 'black', fontWeight: 700, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
            <Download size={16} /> Download Proof
          </button>
        </div>

        <div>
          <h3 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '16px' }}>Reputation Factors</h3>
          <div className="rep-factors-list">
            <div className="rep-factor">
              <div className="rep-factor-icon"><Wallet size={20} /></div>
              <div><h4 style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Wallet Age</h4><p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Active &gt; 2 Years</p></div>
            </div>
            <div className="rep-factor">
              <div className="rep-factor-icon"><Twitter size={20} /></div>
              <div><h4 style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Social Verified</h4><p style={{ fontSize: '12px', color: '#888', margin: 0 }}>X Connected</p></div>
            </div>
            <div className="rep-factor">
              <div className="rep-factor-icon"><Activity size={20} /></div>
              <div><h4 style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Tx Volume</h4><p style={{ fontSize: '12px', color: '#888', margin: 0 }}>$50k+ Transacted</p></div>
            </div>
            <div className="rep-factor">
              <div className="rep-factor-icon"><Shield size={20} /></div>
              <div><h4 style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Clean Record</h4><p style={{ fontSize: '12px', color: '#888', margin: 0 }}>0 Flags</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="dash-fade-in">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">History</h2>
          <p className="dash-subtitle">View all your transactions and events.</p>
        </div>
        <button className="dash-export-btn">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {domainsLoading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : domains.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No transaction history yet.</p>
      ) : (
        <div className="table-container">
          <table className="d-table">
            <thead><tr><th>Date</th><th>Description</th><th>Domain</th><th>Status</th></tr></thead>
            <tbody>
              {domains.map((domain: any, i: number) => (
                <tr key={i}>
                  <td>{domain.createdAt ? formatDate(domain.createdAt) : '-'}</td>
                  <td>Minted &apos;{domain.name}&apos;</td>
                  <td style={{ fontWeight: 700 }}>{domain.name}</td>
                  <td><span className="dash-status-pill completed">Completed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="dash-fade-in">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Settings</h2>
          <p className="dash-subtitle">Configure your profile and security.</p>
        </div>
      </div>

      <div className="pay-form">
        <div className="dash-form-group">
          <label className="dash-form-label">Linked Socials</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="settings-social-item disconnected">
              <Twitter size={20} style={{ color: '#999' }} />
              <span className="social-name muted">X not connected</span>
              <button className="settings-social-btn connect">Connect</button>
            </div>
            <div className="settings-social-item disconnected">
              <Github size={20} style={{ color: '#999' }} />
              <span className="social-name muted">GitHub not connected</span>
              <button className="settings-social-btn connect">Connect</button>
            </div>
          </div>
        </div>

        <div className="dash-form-group">
          <label className="dash-form-label">Wallet Address</label>
          <div className="settings-social-item">
            <Wallet size={20} style={{ color: '#111' }} />
            <span className="social-name" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{address}</span>
          </div>
        </div>

        <div className="dash-form-group">
          <label className="dash-form-label">Wallet Connections</label>
          <button className="settings-wallet-btn">
            <Plus size={16} /> Connect Another Wallet
          </button>
        </div>
      </div>
    </div>
  );

  const tabContent: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    identities: renderIdentities,
    payments: renderPayments,
    reputation: renderReputation,
    history: renderHistory,
    settings: renderSettings,
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      <div className="dashboard-container">
        <div className="dash-grid">
          <aside className="dash-sidebar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`dash-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </aside>

          <main className="dash-content">
            {tabContent[activeTab]()}
          </main>
        </div>
      </div>

      <div className={`toast-notification ${toastVisible ? 'toast-active' : ''}`}>
        <CheckCircle size={16} style={{ color: '#00C853' }} /> Link Copied
      </div>
    </>
  );
}
