'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  duration: string | null;
  isPublished: boolean;
}

export default function RecipeManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    videoUrl: '',
    duration: '',
    difficulty: 'Fácil',
    ingredients: [''],
    instructions: [''],
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const res = await fetch('/api/admin/recipes');
    const data = await res.json();
    setRecipes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success('Receta creada');
      setFormData({ title: '', description: '', image: '', videoUrl: '', duration: '', difficulty: 'Fácil', ingredients: [''], instructions: [''] });
      fetchRecipes();
    } catch (error) {
      toast.error('Error al crear receta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta receta?')) return;
    try {
      await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE' });
      toast.success('Receta eliminada');
      fetchRecipes();
    } catch (error) {
      toast.error('Error');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Nueva Receta</h3>
        <div className="space-y-4">
          <input type="text" placeholder="Título" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" />
          <textarea placeholder="Descripción" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            <input type="text" placeholder="URL Imagen" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="text" placeholder="URL YouTube" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="text" placeholder="Duración" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="px-3 py-2 border rounded-lg" />
          </div>
          <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="px-3 py-2 border rounded-lg">
            <option>Fácil</option>
            <option>Media</option>
            <option>Difícil</option>
          </select>
          <div>
            <label className="block text-sm font-medium mb-2">Ingredientes (uno por línea)</label>
            <textarea
              value={formData.ingredients.join('\n')}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value.split('\n') })}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instrucciones (uno por línea)</label>
            <textarea
              value={formData.instructions.join('\n')}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value.split('\n') })}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Crear Receta</button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dificultad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recipes.map((recipe) => (
              <tr key={recipe.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{recipe.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{recipe.difficulty}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{recipe.duration}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(recipe.id)} className="text-red-600 hover:text-red-900">
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
