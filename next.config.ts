import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No revelar el framework en la cabecera X-Powered-By.
  poweredByHeader: false,
  // Permite construir a un directorio temporal (atomic build-swap del deploy).
  // Sin la variable, el directorio sigue siendo el estándar `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
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
    // En el VPS (atomic build-swap con distDir alterno) se salta el type-check con
    // SKIP_TYPECHECK=1: el código se valida en local antes del push, y el validador
    // de Next choca con el `.next` symlinkeado. En local el type-check sigue activo.
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === '1',
  },
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
};

export default nextConfig;
