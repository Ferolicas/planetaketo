import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  content: {
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    heroImage?: string | null;
  } | null;
}

export default function Hero({ content }: HeroProps) {
  const title = content?.heroTitle || 'Transforma Tu Vida con la Dieta Cetogénica';
  const subtitle = content?.heroSubtitle || 'Descubre el poder de la alimentación keto con nuestras recetas, guías y comunidad exclusiva';

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 overflow-hidden">
      <div className="absolute inset-0 bg-grid-gray-100/50 bg-[size:32px_32px]" />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 animate-slide-up">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
            <Link
              href="/tienda"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Ver Productos
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/recetas"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-700 bg-white rounded-full hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-primary-200"
            >
              Explorar Recetas
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent" />
    </section>
  );
}
