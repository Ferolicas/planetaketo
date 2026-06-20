'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * Facade de YouTube (carga diferida): muestra la miniatura y solo inyecta el
 * iframe al hacer clic. Protege Core Web Vitals (no carga el player pesado de
 * entrada). Mobile-first.
 */
export default function LiteYouTube({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-forest-deep shadow-card">
      {open ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Reproducir: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 grid place-items-center bg-forest-dark/25 transition-colors group-hover:bg-forest-dark/10">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-cta text-forest-dark shadow-cta sm:h-16 sm:w-16">
              <Play className="h-6 w-6 translate-x-0.5 fill-current sm:h-7 sm:w-7" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
