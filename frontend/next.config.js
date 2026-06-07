/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['oouknqnwptunfjlbtkfp.supabase.co'],
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
