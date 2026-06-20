import { Youtube } from 'lucide-react';
import { site } from '@/lib/site';

/** Banner de suscripción al canal de YouTube (CTA con sub_confirmation). */
export default function ChannelBanner() {
  return (
    <aside className="my-8 flex flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-forest/5 sm:flex-row sm:justify-between sm:text-left">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
          <Youtube className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-serif text-lg font-bold text-forest-dark">Nuevas recetas keto cada semana</h3>
          <p className="text-sm text-gray-500">Suscríbete al canal y no te pierdas ninguna.</p>
        </div>
      </div>
      <a
        href={site.youtube.subscribeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-bold text-white transition-colors hover:bg-red-700"
      >
        <Youtube className="h-5 w-5" /> Suscribirme
      </a>
    </aside>
  );
}
