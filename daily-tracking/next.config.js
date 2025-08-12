/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

// In development, don't use export mode to enable API routes
// In production/export, use static export for hosting
const nextConfig = {
  // Only use export mode in production builds, not in development
  ...(isDev ? {} : { output: 'export' }),
  trailingSlash: true,
  ...(isDev
    ? {}
    : {
        basePath: '/daily-tracking',
        assetPrefix: '/daily-tracking',
      }),
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
