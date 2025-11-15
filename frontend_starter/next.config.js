/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
}

module.exports = nextConfig
