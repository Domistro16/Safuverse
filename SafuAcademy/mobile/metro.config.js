const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable import.meta transform for ESM packages (viem, ethers, etc.)
config.transformer = {
    ...config.transformer,
    unstable_allowRequireContext: true,
};

// Add support for additional extensions
config.resolver = {
    ...config.resolver,
    sourceExts: [...(config.resolver?.sourceExts || []), 'mjs', 'cjs'],
};

module.exports = config;
