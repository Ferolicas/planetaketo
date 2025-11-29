'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { User, MessageCircle, Users, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  content: string;
  image: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  comments: any[];
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [canPostToday, setCanPostToday] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchFollowing();
      checkCanPost();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/social/posts?userId=${user?.id}`);
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts');
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await fetch('/api/social/follow?type=following');
      const data = await res.json();
      setFollowing(data);
    } catch (error) {
      console.error('Error fetching following');
    }
  };

  const checkCanPost = async () => {
    try {
      const res = await fetch(`/api/social/posts?userId=${user?.id}`);
      const data = await res.json();
      const today = new Date().toDateString();
      const postedToday = data.some((post: Post) =>
        new Date(post.createdAt).toDateString() === today
      );
      setCanPostToday(!postedToday);
    } catch (error) {
      console.error('Error checking post status');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Error al crear post');
        return;
      }

      toast.success('Post creado');
      setNewPost('');
      setCanPostToday(false);
      fetchPosts();
    } catch (error) {
      toast.error('Error al crear post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Eliminar este post?')) return;

    try {
      await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' });
      toast.success('Post eliminado');
      fetchPosts();
      setCanPostToday(true);
    } catch (error) {
      toast.error('Error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: 'posts', label: 'Mis Posts', icon: MessageCircle },
    { id: 'following', label: 'Siguiendo', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-12 w-12 text-primary-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user.name || 'Usuario'}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="text-2xl font-bold text-primary-600">{posts.length}</span>
                  <span className="text-gray-600 ml-2">Posts</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-primary-600">{following.length}</span>
                  <span className="text-gray-600 ml-2">Siguiendo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {/* Create Post Form */}
                {canPostToday ? (
                  <form onSubmit={handleCreatePost} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">¿Qué estás pensando?</h3>
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Comparte tu experiencia keto..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Publicar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                    Ya publicaste tu post de hoy. ¡Vuelve mañana para compartir más!
                  </div>
                )}

                {/* Posts List */}
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Aún no has publicado nada. ¡Comparte tu primera experiencia!
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} className="bg-white border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{post.user.name || 'Usuario'}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(post.createdAt).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Post"
                            className="mt-4 rounded-lg max-h-96 w-full object-cover"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'following' && (
              <div className="space-y-4">
                {following.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No sigues a nadie todavía. ¡Conecta con la comunidad!
                  </div>
                ) : (
                  following.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{user.name || 'Usuario'}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                        Ver Perfil
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
