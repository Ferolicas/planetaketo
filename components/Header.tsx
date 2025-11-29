'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Settings, LogOut, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Recetas', href: '/recetas' },
    { name: 'Tienda', href: '/tienda' },
    { name: 'Blog', href: '/blog' },
    { name: 'Foro', href: '/foro' },
  ];

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-semibold text-white/90 hover:text-white hover:scale-105 transition-all duration-200"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="hidden md:flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="text-sm font-medium">Admin</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-md"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-emerald-700 bg-white rounded-full hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <LogIn className="h-4 w-4" />
                Iniciar Sesión
              </Link>
            )}

            <button
              className="md:hidden text-white hover:text-emerald-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-white/20">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block mx-4 px-4 py-2 text-sm font-medium text-emerald-700 bg-white hover:bg-emerald-50 rounded-md transition-colors text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
