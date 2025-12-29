import type {NextConfig} from 'next';

// Some environments inject a broken Node localStorage stub; remove it so Next treats it as absent.
if (typeof globalThis !== 'undefined') {
  const ls = (globalThis as any).localStorage;
  if (ls && typeof ls.getItem !== 'function') {
    try {
      delete (globalThis as any).localStorage;
    } catch {
      (globalThis as any).localStorage = undefined;
    }
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
