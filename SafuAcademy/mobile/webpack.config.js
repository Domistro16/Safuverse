const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    // Provide React globally for packages that use JSX without importing React
    config.plugins = [
        ...(config.plugins || []),
        new webpack.ProvidePlugin({
            React: 'react',
        }),
    ];

    // Add fallbacks for node modules not available in browser
    config.resolve = {
        ...config.resolve,
        fallback: {
            ...config.resolve?.fallback,
            crypto: false,
            stream: false,
            buffer: false,
        },
        alias: {
            ...config.resolve?.alias,
            // Replace WalletConnect native module with web stub
            '@walletconnect/modal-react-native': path.resolve(
                __dirname,
                'src/stubs/walletconnect-web.js'
            ),
            '@walletconnect/react-native-compat': path.resolve(
                __dirname,
                'src/stubs/walletconnect-web.js'
            ),
        },
    };

    // Enable import.meta for ESM packages
    config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
            fullySpecified: false,
        },
    });

    // Find the babel-loader rule and extend it to include @walletconnect packages
    config.module.rules = config.module.rules.map(rule => {
        // Handle babel-loader rules
        if (rule.oneOf) {
            rule.oneOf = rule.oneOf.map(oneOfRule => {
                if (
                    oneOfRule.use &&
                    oneOfRule.use.loader &&
                    oneOfRule.use.loader.includes('babel-loader')
                ) {
                    // Extend to include @walletconnect packages
                    const originalExclude = oneOfRule.exclude;
                    oneOfRule.exclude = (modulePath) => {
                        // Don't exclude @walletconnect packages (except native compat)
                        if (
                            modulePath.includes('@walletconnect') &&
                            !modulePath.includes('react-native-compat')
                        ) {
                            return false;
                        }
                        if (typeof originalExclude === 'function') {
                            return originalExclude(modulePath);
                        }
                        if (originalExclude instanceof RegExp) {
                            return originalExclude.test(modulePath);
                        }
                        return false;
                    };
                }
                return oneOfRule;
            });
        }

        // Disable source-map-loader for problematic packages
        if (rule.loader && rule.loader.includes('source-map-loader')) {
            return {
                ...rule,
                exclude: /node_modules\/@walletconnect/,
            };
        }
        return rule;
    });

    return config;
};
