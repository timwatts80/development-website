/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/daily-tracking',
  assetPrefix: '/daily-tracking',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
