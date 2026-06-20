import Link from 'next/link';
import type { BlogPost } from '@/lib/blog';
import { blogCategoryMeta } from '@/lib/blog';

/** Tarjeta de artículo para el hub y relacionados. Mobile-first. */
export default function BlogCard({ post }: { post: BlogPost }) {
  const cat = blogCategoryMeta(post.category);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-forest/5 transition-shadow hover:shadow-card"
    >
      {post.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.heroImage} alt={post.title} className="aspect-[16/9] w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-forest to-forest-dark text-5xl">
          {cat.emoji}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold text-forest">
          {cat.emoji} {cat.label}
        </span>
        <h3 className="mt-1.5 font-serif text-lg font-bold leading-snug text-forest-dark line-clamp-2 group-hover:text-forest">
          {post.title}
        </h3>
        {post.summary && <p className="mt-1.5 flex-1 text-sm text-gray-500 line-clamp-3">{post.summary}</p>}
        {date && <span className="mt-3 text-xs text-gray-400">{date}</span>}
      </div>
    </Link>
  );
}
