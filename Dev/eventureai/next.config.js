/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Required for @cloudflare/next-on-pages
  experimental: {
    // Enable if using middleware
    // middlewarePrefetch: 'flexible',
  },
};

module.exports = nextConfig;
