/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['localhost', 'api.helpshack.in', 'taxwebsite.onrender.com'],
  },
  // NOTE: No rewrites needed.
  // api.js already calls the backend directly using NEXT_PUBLIC_API_URL.
  // Adding rewrites here causes 508 loops and white pages on Vercel.
};

module.exports = nextConfig;
