/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['googleapis', 'google-auth-library'],
  // Required for mapbox-gl worker
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl',
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
