import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Youtube, Mail, MessageCircle } from 'lucide-react';
import CookiePreferencesLink from '@/components/consent/CookiePreferencesLink';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest-dark text-mint-pale/90">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Image src="/LOGO.png" alt="Planeta Keto" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="font-serif text-xl font-semibold text-white">Planeta Keto</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm text-mint-pale/70">
              El método keto definitivo para perder peso sin pasar hambre, con recetas, calculadoras
              y listas de compra. Acceso de por vida.
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="https://youtube.com/@planetaketo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-cta hover:text-forest-dark transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/planetaketo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-cta hover:text-forest-dark transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaza el clúster keto desde TODO el sitio (guía pilar, recetario,
              blog) y las calculadoras gratuitas del holding en olcas.app —
              enlazado cruzado legítimo entre propiedades propias. */}
          <nav aria-label="Recursos keto">
            <h4 className="font-serif font-semibold text-white mb-4">Recursos keto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/dieta-keto" className="hover:text-cta transition-colors">
                  Guía de la dieta keto
                </Link>
              </li>
              <li>
                <Link href="/recetas" className="hover:text-cta transition-colors">
                  Recetas keto gratis
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-cta transition-colors">
                  Blog keto
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="hover:text-cta transition-colors">
                  Método Keto 70 Días
                </Link>
              </li>
              <li>
                <a href="https://olcas.app/calculadoras/macronutrientes" className="hover:text-cta transition-colors">
                  Calculadora de macros
                </a>
              </li>
              <li>
                <a href="https://olcas.app/calculadoras/calorias-diarias" className="hover:text-cta transition-colors">
                  Calculadora de calorías
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h4 className="font-serif font-semibold text-white mb-4">Soporte</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://wa.me/19176726696"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-cta transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp +1 917-672-6696
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@planetaketo.es"
                  className="inline-flex items-center gap-2 hover:text-cta transition-colors"
                >
                  <Mail className="h-4 w-4" /> info@planetaketo.es
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mint-pale/60">
          <p>© {year} Planeta Keto · Hecho con cariño para tu transformación</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/aviso-legal" className="hover:text-cta transition-colors">Aviso legal</Link>
            <Link href="/terminos" className="hover:text-cta transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-cta transition-colors">Privacidad</Link>
            <Link href="/cookies" className="hover:text-cta transition-colors">Cookies</Link>
            <Link href="/desistimiento" className="hover:text-cta transition-colors">Reembolsos</Link>
            <CookiePreferencesLink className="hover:text-cta transition-colors" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
