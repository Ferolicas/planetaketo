import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, BookOpen } from 'lucide-react';
import { getPostBySlug, getRelatedPosts, articleJsonLd, blogCategoryMeta } from '@/lib/blog';
import JsonLd from '@/components/seo/JsonLd';
import BookBanner from '@/components/recipes/BookBanner';
import ChannelBanner from '@/components/recipes/ChannelBanner';
import YouTubeGallery from '@/components/recipes/YouTubeGallery';
import BlogCard from '@/components/blog/BlogCard';
import AdSlot from '@/components/ads/AdSlot';

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await getPostBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return { title: 'Artículo no encontrado' };
  return {
    title: p.title,
    description: p.summary ?? undefined,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      title: p.title,
      description: p.summary ?? '',
      type: 'article',
      images: p.heroImage ? [{ url: p.heroImage }] : undefined,
    },
  };
}

export default async function BlogArticle({ params }: Params) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();

  const cat = blogCategoryMeta(p.category);
  const related = await getRelatedPosts(p.slug, 3).catch(() => []);
  const date = p.publishedAt
    ? new Date(p.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="bg-cream">
      <JsonLd data={articleJsonLd(p)} />
      <article className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-forest">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/blog" className="hover:text-forest">Blog</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-forest-dark">{cat.label}</span>
        </nav>

        <header className="mt-4">
          <span className="inline-flex rounded-full bg-mint-pale px-3 py-1 text-xs font-semibold text-forest-dark">
            {cat.emoji} {cat.label}
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-forest-dark sm:text-4xl">{p.title}</h1>
          {date && <p className="mt-2 text-sm text-gray-400">{date} · Planeta Keto</p>}
          {p.summary && <p className="mt-3 text-lg text-gray-600">{p.summary}</p>}
        </header>

        {p.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.heroImage} alt={p.title} className="mt-6 w-full rounded-3xl shadow-card" />
        )}

        <AdSlot />

        <div className="prose prose-lg mt-6 max-w-none prose-headings:font-serif prose-headings:text-forest-dark prose-a:text-forest prose-strong:text-forest-dark">
          <ReactMarkdown>{p.content}</ReactMarkdown>
        </div>

        {p.sourceUrl && (
          <aside className="mt-8 flex items-start gap-3 rounded-2xl bg-mint-pale/40 p-5">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
            <p className="text-sm text-gray-700">
              <strong className="text-forest-dark">Fuente:</strong>{' '}
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-forest underline hover:text-cta"
              >
                {p.sourceName || p.sourceUrl}
              </a>
            </p>
          </aside>
        )}

        <AdSlot />

        <BookBanner />
        <ChannelBanner />
        <YouTubeGallery />

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 font-serif text-2xl font-bold text-forest-dark">Sigue leyendo</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => (
                <BlogCard key={rp.slug} post={rp} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
