import LiteYouTube from '@/components/recipes/LiteYouTube';
import { site } from '@/lib/site';

/** Galería de 2 ítems del canal: vídeo destacado + playlist (lite-embed). */
export default function YouTubeGallery() {
  return (
    <section className="my-10">
      <h2 className="mb-4 font-serif text-2xl font-bold text-forest-dark">Más en nuestro canal</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <LiteYouTube id={site.youtube.longVideoId} title="Vídeo destacado de Planeta Keto" />
          <p className="mt-2 text-sm font-medium text-gray-600">Nuestro vídeo más completo</p>
        </div>
        <div>
          <LiteYouTube id="pnPt9DUhz2w" title="Recetas keto para principiantes" />
          <a
            href={site.youtube.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-forest hover:text-cta"
          >
            Ver la playlist completa →
          </a>
        </div>
      </div>
    </section>
  );
}
