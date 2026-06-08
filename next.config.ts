import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  compiler: {
    // Mantener console.error/warn en producción para poder depurar (webhooks, etc.).
    // Antes era `true`, que eliminaba TODOS los console.* del build y ocultaba los errores.
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
};

export default nextConfig;
