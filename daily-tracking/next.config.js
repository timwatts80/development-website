/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

// In development, serve at root (no basePath) to avoid 404 at '/'.
// In production/export, use '/daily-tracking' for hosting under subpath.
const nextConfig = {
  output: 'export',
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
