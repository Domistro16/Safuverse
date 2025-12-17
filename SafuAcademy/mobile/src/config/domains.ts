// SafuDomains Contract Addresses (BSC Mainnet)
export const DOMAIN_CONTRACTS = {
  CONTROLLER: '0x48511b6c15fe1F89bAf6b30dBFA35bF0eAaEB751',
  REGISTRY: '0x6aEFc7ac590096c08187a9052030dA59dEd7E996',
  REVERSE_REGISTRAR: '0xc070aAcE207ad5eb2A460D059785ffC9D4D2C536',
  BASE_REGISTRAR: '0xc85f95FCe09b582D546606f591CEEC88D88714f5',
  NAME_WRAPPER: '0x86a930d1931C11e3Ec46b3A050E27F29bF94B612',
  PUBLIC_RESOLVER: '0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357',
  REFERRAL: '0x182690bD985ef02Ae44A6F8a2e71666bDe1196E2',
  CHAINLINK_ORACLE: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
} as const;

// Token Addresses
export const PAYMENT_TOKENS = {
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  USD1: '0x', // Add USD1 token address
} as const;

// Domain Configuration
export const DOMAIN_CONFIG = {
  TLD: 'safu',
  MIN_REGISTRATION_DURATION: 28 * 24 * 60 * 60, // 28 days in seconds
  GRACE_PERIOD: 30 * 24 * 60 * 60, // 30 days in seconds
  COMMIT_WAIT_TIME: 60, // 60 seconds
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 64,
} as const;

// Referral Tiers
export const REFERRAL_TIERS = {
  DEFAULT: {
    minReferrals: 0,
    percentage: 25,
    label: 'Default',
  },
  SILVER: {
    minReferrals: 5,
    percentage: 30,
    label: 'Silver',
  },
  GOLD: {
    minReferrals: 15,
    percentage: 30,
    label: 'Gold',
  },
} as const;

// Text Record Keys
export const TEXT_RECORD_KEYS = {
  // Social Media
  TWITTER: 'com.twitter',
  GITHUB: 'com.github',
  DISCORD: 'com.discord',
  TELEGRAM: 'org.telegram',
  REDDIT: 'com.reddit',
  YOUTUBE: 'com.youtube',
  TIKTOK: 'com.tiktok',
  SNAPCHAT: 'com.snapchat',

  // Contact
  EMAIL: 'email',
  PHONE: 'phone',
  URL: 'url',

  // Identity
  AVATAR: 'avatar',
  DESCRIPTION: 'description',
  NOTICE: 'notice',
  KEYWORDS: 'keywords',

  // Crypto
  BTC: 'BTC',
  ETH: 'ETH',
  BNB: 'BNB',
} as const;

// Domain Search History
export const MAX_RECENT_SEARCHES = 10;

// NFT Metadata
export const DOMAIN_IMAGE_BASE_URL = 'https://names.safuverse.com/api/domain-image';
