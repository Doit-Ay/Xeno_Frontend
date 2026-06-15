/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any domain (for generated content)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
