'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  createdAt: Date;
}

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [formData, setFormData] = useState({ title: '', excerpt: '', content: '', image: '', author: 'Planeta Keto' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/admin/blog');
    const data = await res.json();
    setPosts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success('Post creado');
      setFormData({ title: '', excerpt: '', content: '', image: '', author: 'Planeta Keto' });
      fetchPosts();
    } catch (error) {
      toast.error('Error al crear post');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este post?')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    toast.success('Post eliminado');
    fetchPosts();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Nuevo Post</h3>
        <div className="space-y-4">
          <input type="text" placeholder="Título" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
          <textarea placeholder="Extracto" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
          <textarea placeholder="Contenido" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={6} className="w-full px-3 py-2 border rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="URL Imagen" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="text" placeholder="Autor" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="px-3 py-2 border rounded-lg" />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Publicar</button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{post.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{post.author}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
