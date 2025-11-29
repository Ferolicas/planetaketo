import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { MessageCircle, Eye, Calendar } from 'lucide-react';

async function getForumThreads() {
  try {
    const { data: threads, error } = await supabaseAdmin
      .from('ForumThread')
      .select('*')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return threads || [];
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return [];
  }
}

export default async function ForumPage() {
  const threads = await getForumThreads();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Foro Comunidad Keto
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comparte experiencias, haz preguntas y conecta con nuestra comunidad.
          </p>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No hay discusiones disponibles en este momento. ¡Sé el primero en iniciar una conversación!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/foro/${thread.slug}`}
                className="block bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:border-l-4 hover:border-primary-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
                      {thread.title}
                    </h2>
                    <p className="text-gray-600 line-clamp-2 mb-4">
                      {thread.content}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      {thread.author && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{thread.author}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{thread.views} vistas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(thread.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
