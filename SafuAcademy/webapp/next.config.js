/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
    ],
  },
  // Externalize problematic server-side packages
  serverExternalPackages: [
    'pino',
    'thread-stream',
    '@reown/appkit',
    '@reown/appkit-controllers',
    '@reown/appkit-utils',
    '@walletconnect/universal-provider',
  ],
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Resolve pino transport issues
      'pino': 'pino/browser',
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Ignore test files in node_modules
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.test\.(js|ts)$/,
      use: 'ignore-loader',
    });
    // Externalize pino to avoid thread-stream issues
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino': 'pino/browser',
      };
    }
    return config;
  },
  // Transpile @reown packages
  transpilePackages: ['@reown/appkit', '@reown/appkit-controllers', '@reown/appkit-utils'],
};

module.exports = nextConfig;
