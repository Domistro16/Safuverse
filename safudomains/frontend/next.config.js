/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Handle Web3 packages that need transpilation
    transpilePackages: [
        '@rainbow-me/rainbowkit',
        '@web3auth/modal',
        '@web3auth/base',
        '@web3auth/ethereum-provider',
        '@web3auth/auth-adapter',
        '@wagmi/connectors',
        '@metamask/sdk',
    ],

    // Empty turbopack config to use Turbopack (Next.js 16 default)
    turbopack: {},

    // Server external packages to avoid bundling native modules
    serverExternalPackages: ['canvas', 'pino-pretty'],
};

module.exports = nextConfig;
