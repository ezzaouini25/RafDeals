import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Replace with your actual Blob store host from Vercel Dashboard → Storage → your Blob store
const BLOB_HOST = process.env.BLOB_STORE_HOST || 'YOUR-STORE-ID.public.blob.vercel-storage.com';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: BLOB_HOST, port: '', pathname: '/**' }, // ✅ Blob store
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `https://${BLOB_HOST}/uploads/:path*`,
      },
    ];
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Module not found in bundle: \.\/flags\/Canada\.tsx/,
      /Module not found in bundle: \.\/flags\/United States\.tsx/,
    ];

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);