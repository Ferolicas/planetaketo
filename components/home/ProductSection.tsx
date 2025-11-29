import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}

export default function ProductSection({ product }: { product: Product }) {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <ShoppingCart className="h-32 w-32 text-primary-600 opacity-50" />
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              Producto Destacado
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              {product.name}
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              {product.description || 'Descubre nuestro producto premium diseñado especialmente para tu estilo de vida keto.'}
            </p>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold text-primary-600">
                {formatPrice(product.price)}
              </span>
            </div>
            <div className="pt-6">
              <Link
                href={`/tienda/${product.id}`}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Comprar Ahora
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
