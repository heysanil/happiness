/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['paris'],
    env: {
        NEXT_PUBLIC_STRIPE_ACCOUNT_ID: process.env.STRIPE_ACCOUNT_ID || '',
    },
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },
    webpack: (config) => {
        config.module.rules.push({
            test: /\.svg$/i,
            use: ['@svgr/webpack'],
        });
        return config;
    },
};

module.exports = nextConfig;
