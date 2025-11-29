'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface HomeContent {
  logo: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImage: string | null;
  productId: string | null;
  regularPrice: number | null;
  discountPrice: number | null;
  discountPercentage: number | null;
}

export default function HomeManager() {
  const [formData, setFormData] = useState<HomeContent>({
    logo: null,
    heroTitle: null,
    heroSubtitle: null,
    heroImage: null,
    productId: null,
    regularPrice: 39.75,
    discountPrice: 19.75,
    discountPercentage: 50,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHomeContent();
  }, []);

  const fetchHomeContent = async () => {
    const res = await fetch('/api/admin/home');
    const data = await res.json();
    if (data) {
      setFormData({
        logo: data.logo,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroImage: data.heroImage,
        productId: data.productId,
        regularPrice: data.regularPrice || 39.75,
        discountPrice: data.discountPrice || 19.75,
        discountPercentage: data.discountPercentage || 50,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();
      toast.success('Precios actualizados correctamente');
      await fetchHomeContent();
    } catch (error) {
      toast.error('Error al actualizar los precios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Precio Regular (€)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">€</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.regularPrice || ''}
                onChange={(e) => setFormData({ ...formData, regularPrice: parseFloat(e.target.value) })}
                className="w-full pl-10 pr-4 py-4 text-lg text-gray-900 font-semibold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-gray-900"
                placeholder="39.75"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Precio original sin descuento</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Precio con Descuento (€)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">€</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.discountPrice || ''}
                onChange={(e) => setFormData({ ...formData, discountPrice: parseFloat(e.target.value) })}
                className="w-full pl-10 pr-4 py-4 text-lg text-gray-900 font-semibold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-gray-900"
                placeholder="19.75"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Precio que cobrarás en Stripe</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Descuento (%)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.discountPercentage || ''}
                onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                className="w-full pr-10 pl-4 py-4 text-lg text-gray-900 font-semibold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-gray-900"
                placeholder="50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Porcentaje mostrado en la web</p>
          </div>
        </div>

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-800 mb-1">
                Sincronización automática con Stripe
              </h4>
              <p className="text-sm text-emerald-700">
                Los precios se actualizan automáticamente en Stripe cuando guardes los cambios. Los clientes pagarán el precio con descuento.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}
