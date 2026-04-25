'use client';

import Link from 'next/link';
import { Settings, LogOut, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b shadow-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative h-12 w-12 flex-shrink-0">
                <Image
                  src="/LOGO.png"
                  alt="Planeta Keto Logo"
                  fill
                  className="object-contain transition-transform group-hover:scale-110"
                  priority
                />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight group-hover:text-emerald-100 transition-colors">
                Planeta Keto
              </span>
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="text-sm font-medium hidden sm:inline">Admin</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-md"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-emerald-700 bg-white rounded-full hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
