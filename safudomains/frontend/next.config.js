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

    webpack: (config, { isServer }) => {
        // Add aliases for modules that don't exist in browser
        config.resolve.alias = {
            ...config.resolve.alias,
            '@react-native-async-storage/async-storage': false,
            'pino-pretty': false,
        };

        // Fallback for node-specific modules
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                path: false,
                os: false,
            };
        }

        // Ignore problematic test modules
        config.module = config.module || {};
        config.module.noParse = config.module.noParse || [];
        config.module.noParse.push(/thread-stream\/test/);

        // Add externals to avoid bundling server-only modules
        config.externals = config.externals || [];
        if (!isServer) {
            config.externals.push({
                'pino-pretty': 'pino-pretty',
            });
        }

        return config;
    },
};

module.exports = nextConfig;


