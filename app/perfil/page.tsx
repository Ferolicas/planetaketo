'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut, Home } from 'lucide-react';

// La sección social (posts/seguidos) se retiró: sus endpoints están deshabilitados
// (410) y no existen las tablas. El perfil muestra solo la información de cuenta.
export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Cabecera de cuenta */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <User className="h-12 w-12 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-1 truncate">
                {user.name || 'Usuario'}
              </h1>
              <p className="text-gray-600 truncate">{user.email}</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
            <button
              onClick={() => logout()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
