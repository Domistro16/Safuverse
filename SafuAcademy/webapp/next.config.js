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
  // Externalize problematic server-side packages (NOT the @reown packages since they're transpiled)
  serverExternalPackages: [
    'pino',
    'thread-stream',
    'pino-pretty',
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
    // Externalize pino to avoid thread-stream issues on client
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino': 'pino/browser',
      };
    }
    return config;
  },
  // Transpile @reown packages (keep these ONLY here, not in serverExternalPackages)
  transpilePackages: ['@reown/appkit', '@reown/appkit-controllers', '@reown/appkit-utils'],
};

module.exports = nextConfig;
