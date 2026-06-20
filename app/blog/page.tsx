import type { Metadata } from 'next';
import { getPublishedPosts, type BlogPost } from '@/lib/blog';
import { site } from '@/lib/site';
import BlogCard from '@/components/blog/BlogCard';
import BookBanner from '@/components/recipes/BookBanner';
import ChannelBanner from '@/components/recipes/ChannelBanner';
import JsonLd from '@/components/seo/JsonLd';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog Keto — ciencia, nutrición y salud',
  description:
    'Artículos keto basados en estudios y fuentes médicas reales. Resuelve tus dudas sobre la dieta cetogénica con información rigurosa y fácil de entender.',
  alternates: { canonical: '/blog' },
};

async function safePosts(): Promise<BlogPost[]> {
  try {
    return await getPublishedPosts();
  } catch {
    return [];
  }
}

export default async function BlogHub() {
  const posts = await safePosts();

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${site.url}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <div className="bg-cream">
      {posts.length > 0 && <JsonLd data={itemList} />}
      <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-3xl font-bold text-forest-dark sm:text-4xl lg:text-5xl">Blog Keto</h1>
          <p className="mt-4 text-lg text-gray-600">
            Ciencia, nutrición y salud cetogénica explicadas claro — con fuentes médicas reales.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mt-16 text-center text-gray-500">
            Pronto publicaremos nuestros primeros artículos. ¡Vuelve muy pronto!
          </p>
        ) : (
          <>
            <BookBanner />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
            <ChannelBanner />
          </>
        )}
      </div>
    </div>
  );
}
