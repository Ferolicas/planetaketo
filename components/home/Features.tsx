import { BookOpen, Users, ShoppingBag, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Recetas Exclusivas',
    description: 'Accede a cientos de recetas keto deliciosas y fáciles de preparar, todas probadas y aprobadas por nuestra comunidad.',
  },
  {
    icon: ShoppingBag,
    title: 'Productos Premium',
    description: 'Encuentra los mejores productos keto seleccionados cuidadosamente para ayudarte en tu viaje hacia una vida más saludable.',
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Únete a miles de personas que comparten tu mismo objetivo. Comparte experiencias, tips y motivación.',
  },
  {
    icon: MessageCircle,
    title: 'Soporte Continuo',
    description: 'Obtén respuestas a todas tus preguntas en nuestro foro y a través de nuestro soporte por WhatsApp.',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que Necesitas en un Solo Lugar
          </h2>
          <p className="text-xl text-gray-600">
            Planeta Keto te ofrece todas las herramientas y el apoyo que necesitas para tener éxito en tu estilo de vida cetogénico.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 text-primary-600 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
