import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
  ],
},
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    
    // ✅ Suppress the @rdnr/react-country-flags internal build warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Module not found in bundle: \.\/flags\/Canada\.tsx/,
      /Module not found in bundle: \.\/flags\/United States\.tsx/,
    ];

    return config;
  },
  
};

export default withBundleAnalyzer(nextConfig);