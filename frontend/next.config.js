/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Temporarily disable StrictMode to prevent double-render issues
  // TODO: Re-enable after Polotno integration is stable
  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '100.123.51.5',
        port: '9000',
        pathname: '/**',
      },
    ],
  },

  webpack: (config) => {
    // Fix Konva canvas library resolution for Polotno
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      konva: path.resolve(__dirname, 'node_modules/konva'),
    };
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
