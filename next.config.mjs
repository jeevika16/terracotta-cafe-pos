/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    // If an external backend URL is explicitly configured, forward /api calls to it.
    // Otherwise, Next.js natively handles the API routes serverlessly (ideal for Vercel deployment & unified dev).
    console.log({backendUrl: process.env.BACKEND_URL});
    if (process.env.BACKEND_URL) {
      const backendUrl = process.env.BACKEND_URL;

      return [
        {
          source: '/api/tables/:path*',
          destination: `${backendUrl}/api/tables/:path*`,
        },
        {
          source: '/api/tables',
          destination: `${backendUrl}/api/tables`,
        },
        {
          source: '/api/menu/:path*',
          destination: `${backendUrl}/api/menu/:path*`,
        },
        {
          source: '/api/menu',
          destination: `${backendUrl}/api/menu`,
        },
        {
          source: '/api/orders/:path*',
          destination: `${backendUrl}/api/orders/:path*`,
        },
        {
          source: '/api/orders',
          destination: `${backendUrl}/api/orders`,
        },
        {
          source: '/api/users/:path*',
          destination: `${backendUrl}/api/users/:path*`,
        },
        {
          source: '/api/users',
          destination: `${backendUrl}/api/users`,
        },
        {
          source: '/api/analytics/:path*',
          destination: `${backendUrl}/api/analytics/:path*`,
        },
        {
          source: '/api/analytics',
          destination: `${backendUrl}/api/analytics`,
        },
        {
          source: '/api/notifications/:path*',
          destination: `${backendUrl}/api/notifications/:path*`,
        },
        {
          source: '/api/notifications',
          destination: `${backendUrl}/api/notifications`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
