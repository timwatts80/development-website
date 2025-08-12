/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

// Since we're using API routes and database, we can't use static export
// Use regular Next.js build for both development and production
const nextConfig = {
  trailingSlash: true,
  // Only use basePath and assetPrefix for static hosting scenarios
  // For now, disable them since we're using server functionality
  ...(false ? {
    basePath: '/daily-tracking',
    assetPrefix: '/daily-tracking',
  } : {}),
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
