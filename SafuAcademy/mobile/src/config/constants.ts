// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000; // 30 seconds

// Blockchain Configuration
export const CHAIN_ID = 56; // BSC Mainnet
export const CHAIN_ID_HEX = '0x38';
export const CHAIN_NAME = 'BNB Smart Chain';
export const RPC_URL = 'https://bsc-dataseed.binance.org/';
export const EXPLORER_URL = 'https://bscscan.com';

export const SAFUACADEMY_CONTRACT_ADDRESS = '0xD0cB04cB20Dff62E26b7069B95Fa9fF3D4694d13';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@safuacademy:auth_token',
  USER_DATA: '@safuacademy:user_data',
  WALLET_ADDRESS: '@safuacademy:wallet_address',
  THEME: '@safuacademy:theme',
  WATCH_PROGRESS: '@safuacademy:watch_progress',
  NOTES: '@safuacademy:notes',
} as const;

// App Configuration
export const APP_NAME = 'SafuAcademy';
export const APP_TAGLINE = 'Learn Web3 & Blockchain';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const COURSES_PER_PAGE = 10;

// Video Configuration
export const VIDEO_COMPLETION_THRESHOLD = 0.5; // 50% watched = completed
export const PROGRESS_UPDATE_INTERVAL = 1000; // 1 second

// WalletConnect Configuration
export const WALLET_CONNECT_PROJECT_ID = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

// Feature Flags
export const FEATURES = {
  ENABLE_CHAT: false, // AI Chat feature (not yet implemented)
  ENABLE_OFFLINE: false, // Offline mode (future feature)
  ENABLE_PUSH_NOTIFICATIONS: false, // Push notifications (future feature)
} as const;

// Course Levels
export const COURSE_LEVELS = {
  BEGINNER: { label: 'Beginner', color: '#10B981' },
  INTERMEDIATE: { label: 'Intermediate', color: '#F59E0B' },
  ADVANCED: { label: 'Advanced', color: '#EF4444' },
} as const;

// Course Categories
export const COURSE_CATEGORIES = [
  'DeFi',
  'NFT',
  'Security',
  'Development',
  'Blockchain',
  'Trading',
] as const;
