import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'María González',
    role: 'Transformación de 6 meses',
    content: 'Gracias a Planeta Keto he perdido 15kg y me siento increíble. Las recetas son deliciosas y la comunidad es muy motivadora.',
    rating: 5,
  },
  {
    name: 'Carlos Martínez',
    role: 'Usuario desde hace 1 año',
    content: 'El mejor recurso para la dieta keto que he encontrado. El libro y las recetas han cambiado completamente mi forma de comer.',
    rating: 5,
  },
  {
    name: 'Ana Rodríguez',
    role: 'Miembro de la comunidad',
    content: 'No solo he mejorado mi salud, también he hecho grandes amigos en el foro. El soporte es excepcional.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Historias de Éxito
          </h2>
          <p className="text-xl text-gray-600">
            Miles de personas ya han transformado sus vidas con Planeta Keto.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                &quot;{testimonial.content}&quot;
              </p>
              <div>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
