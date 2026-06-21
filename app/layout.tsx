import type { Metadata } from 'next';
import { Lora, Raleway } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/seo';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ConsentProvider } from '@/components/consent/ConsentProvider';
import CookieConsent from '@/components/consent/CookieConsent';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://planetaketo.es'),
  title: {
    default: 'Planeta Keto — Pierde peso con el Método Keto Definitivo',
    template: '%s | Planeta Keto',
  },
  description:
    'El método keto de 70 días con recetas, calculadoras y listas de compra. Pierde peso sin pasar hambre y sin ejercicio obligatorio. Acceso de por vida.',
  keywords: 'keto, dieta cetogénica, recetas keto, perder peso, método keto, plan keto 70 días',
  authors: [{ name: 'Planeta Keto' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://planetaketo.es',
    siteName: 'Planeta Keto',
    title: 'Planeta Keto — Pierde peso con el Método Keto Definitivo',
    description:
      'El método keto de 70 días con recetas, calculadoras y listas de compra. Pierde peso sin pasar hambre.',
    images: [{ url: '/libro.png', width: 1200, height: 630, alt: 'Método Keto 70 Días — Planeta Keto' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planeta Keto — Método Keto Definitivo',
    description: 'Pierde peso con el método keto de 70 días. Recetas, calculadoras y listas de compra.',
    images: ['/libro.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lora.variable} ${raleway.variable}`}>
      <body className="bg-cream text-gray-800 antialiased">
        {/* Activa el modo JS ANTES del primer pintado: permite el reveal sin
            dejar la web en blanco para no-JS / SEO / hidratación lenta. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {/* Datos estructurados de marca (en todas las páginas). */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <ConsentProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
          {/* Analítica propia: solo se activa tras consentimiento (lo controla el tracker). */}
          <Analytics />
          <CookieConsent />
        </ConsentProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { background: '#14532D', color: '#fff', fontFamily: 'var(--font-raleway)' },
            success: { iconTheme: { primary: '#34D399', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
