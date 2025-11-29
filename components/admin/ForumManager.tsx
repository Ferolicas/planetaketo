'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

interface ForumThread {
  id: string;
  title: string;
  author: string | null;
  views: number;
  createdAt: Date;
}

export default function ForumManager() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [formData, setFormData] = useState({ title: '', content: '', author: 'Admin' });

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    const res = await fetch('/api/admin/forum');
    const data = await res.json();
    setThreads(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      toast.success('Thread creado');
      setFormData({ title: '', content: '', author: 'Admin' });
      fetchThreads();
    } catch (error) {
      toast.error('Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    await fetch(`/api/admin/forum/${id}`, { method: 'DELETE' });
    toast.success('Eliminado');
    fetchThreads();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Nuevo Thread</h3>
        <div className="space-y-4">
          <input type="text" placeholder="Título" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
          <textarea placeholder="Contenido" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={4} className="w-full px-3 py-2 border rounded-lg" />
          <input type="text" placeholder="Autor" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Crear Thread</button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vistas</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {threads.map((thread) => (
              <tr key={thread.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{thread.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{thread.author}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{thread.views}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(thread.id)} className="text-red-600 hover:text-red-900">
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
