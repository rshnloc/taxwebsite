/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'api.helpshack.in'],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    // Only set up rewrites if a real backend URL is configured
    // This prevents 508 loops on Vercel when no backend is set
    if (backendUrl && backendUrl !== '') {
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    // In local development, proxy to localhost
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ];
    }
    // No rewrites in production without backend URL
    return [];
  },
};

module.exports = nextConfig;
