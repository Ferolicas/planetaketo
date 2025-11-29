import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/auth/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Planeta Keto - Tu Guía Definitiva de Alimentación Cetogénica',
  description: 'Descubre el mejor contenido sobre dieta keto, recetas deliciosas, productos premium y una comunidad activa. Transforma tu vida con Planeta Keto.',
  keywords: 'keto, dieta cetogénica, recetas keto, productos keto, alimentación saludable',
  authors: [{ name: 'Planeta Keto' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://planetaketo.es',
    siteName: 'Planeta Keto',
    title: 'Planeta Keto - Tu Guía Definitiva de Alimentación Cetogénica',
    description: 'Descubre el mejor contenido sobre dieta keto, recetas deliciosas, productos premium y una comunidad activa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planeta Keto',
    description: 'Tu Guía Definitiva de Alimentación Cetogénica',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
