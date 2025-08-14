/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Webpack configuration for better error handling
  webpack: (config, { dev }) => {
    if (dev) {
      // Better source maps for debugging
      config.devtool = 'eval-source-map'
    }
    return config
  },
  // Better error handling and reduced warnings
  reactStrictMode: true,
}

module.exports = nextConfig
