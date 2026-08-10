import Link from 'next/link';
import { BookOpen } from 'lucide-react';

/**
 * Tira fina que enlaza la guía pilar desde TODAS las recetas y artículos del
 * blog (se monta en sus layouts). Es el enlazado interno que concentra la
 * autoridad del clúster —64 recetas + 31 artículos— sobre /dieta-keto, la
 * página que compite por «dieta keto», y orienta al recién llegado.
 */
export default function GuideStrip() {
  return (
    <div className="border-b border-forest/10 bg-mint-pale/50">
      <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <BookOpen className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
        <p className="text-forest-dark">
          ¿Nuevo en keto?{' '}
          <Link href="/dieta-keto" className="font-semibold underline underline-offset-2 hover:text-forest">
            Lee la guía completa de la dieta keto
          </Link>
        </p>
      </div>
    </div>
  );
}
