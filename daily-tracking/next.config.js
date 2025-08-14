/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Better error handling and reduced warnings
  reactStrictMode: true,
}

module.exports = nextConfig
