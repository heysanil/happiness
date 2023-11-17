/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['paris'],
    webpack: (config) => {
        config.module.rules.push({
            test: /\.svg$/i,
            use: ['@svgr/webpack'],
        });
        return config;
    },
}

module.exports = nextConfig
