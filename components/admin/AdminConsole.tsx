'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { BarChart3 } from 'lucide-react';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import AdminPanel from '@/components/admin/AdminPanel';
import HomeManager from '@/components/admin/HomeManager';
import RecipesManager from '@/components/admin/RecipesManager';
import BlogManager from '@/components/admin/BlogManager';

// Consola de administración (usada por /ferney y /admin). Protegida: solo el
// administrador la ve. La analítica va arriba; debajo, la gestión del sitio.
export default function AdminConsole() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">Panel de Planeta Keto</h1>
            <p className="text-lg text-gray-600">Analítica propia, métricas y gestión del sitio</p>
          </div>

          {/* Analítica web propia (RGPD): visitas, embudo y sesiones */}
          <section className="mb-12">
            <AnalyticsDashboard />
          </section>

          {/* Compradores, descargas y alta de usuarios */}
          <AdminPanel />

          {/* Gestión del contenido */}
          <HomeManager />
          <RecipesManager />
          <BlogManager />
        </div>
      </div>
    </div>
  );
}
