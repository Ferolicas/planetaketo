import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-cream min-h-[60vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-forest hover:text-forest-dark mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-forest-dark mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualización: {updated}</p>
        <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-forest-dark prose-h2:text-2xl prose-h2:mt-10 prose-a:text-forest prose-a:no-underline hover:prose-a:underline prose-strong:text-forest-dark">
          {children}
        </article>
      </div>
    </div>
  );
}
