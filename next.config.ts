/** @type {import('next').NextConfig} */
module.exports = {
  devIndicators: {
    autoPrerender: false,
  },
  // Allow all origins during development
  experimental: {
    allowedDevOrigins: ['*'],
  },
}
