import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

async function getProducts() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('Product')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tienda Keto
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Productos premium seleccionados especialmente para tu estilo de vida cetogénico.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No hay productos disponibles en este momento. ¡Vuelve pronto!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative h-80 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <ShoppingCart className="h-24 w-24 text-primary-600 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h2>
                  {product.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-primary-600">
                      {formatPrice(product.price)}
                    </span>
                    <Link
                      href={`/tienda/${product.id}`}
                      className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
