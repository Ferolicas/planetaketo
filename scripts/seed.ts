import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@planetaketo.es' },
    update: {},
    create: {
      email: 'admin@planetaketo.es',
      name: 'Administrador',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Admin user created');
  console.log('📧 Email: admin@planetaketo.es');
  console.log('🔑 Password: admin123');

  // Create home content
  const homeContent = await prisma.homeContent.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      heroTitle: 'Transforma Tu Vida con la Dieta Cetogénica',
      heroSubtitle: 'Descubre el poder de la alimentación keto con nuestras recetas, guías y comunidad exclusiva',
      sections: {
        benefits: [
          'Pierde peso de forma saludable',
          'Aumenta tu energía',
          'Mejora tu claridad mental',
          'Controla tus niveles de azúcar',
        ],
      },
    },
  });
  console.log('✅ Home content created');

  // Create sample product
  const product = await prisma.product.upsert({
    where: { id: 'sample-product' },
    update: {},
    create: {
      id: 'sample-product',
      name: 'Guía Completa Dieta Keto',
      description: 'Tu guía definitiva para comenzar y mantener un estilo de vida cetogénico. Incluye 100+ recetas, plan de comidas, lista de compras y mucho más.',
      price: 29.99,
      isActive: true,
    },
  });
  console.log('✅ Sample product created');

  // Update home content with product
  await prisma.homeContent.update({
    where: { id: 'default' },
    data: { productId: product.id },
  });

  // Create sample recipes
  const recipes = [
    {
      title: 'Aguacate Relleno de Atún',
      slug: 'aguacate-relleno-atun',
      description: 'Deliciosa receta keto perfecta para el almuerzo. Rica en grasas saludables y proteína.',
      duration: '15 minutos',
      difficulty: 'Fácil',
      ingredients: [
        '2 aguacates maduros',
        '1 lata de atún en agua',
        '2 cucharadas de mayonesa',
        'Jugo de medio limón',
        'Sal y pimienta al gusto',
        'Perejil fresco picado',
      ],
      instructions: [
        'Corta los aguacates por la mitad y retira el hueso',
        'Escurre el atún y mézclalo con la mayonesa y el jugo de limón',
        'Sazona con sal y pimienta',
        'Rellena las mitades de aguacate con la mezcla de atún',
        'Decora con perejil fresco',
        'Sirve inmediatamente',
      ],
    },
    {
      title: 'Pollo al Horno con Brócoli',
      slug: 'pollo-horno-brocoli',
      description: 'Comida completa keto en una sola bandeja. Nutritiva y deliciosa.',
      duration: '45 minutos',
      difficulty: 'Media',
      ingredients: [
        '4 pechugas de pollo',
        '2 tazas de brócoli',
        '3 cucharadas de aceite de oliva',
        '2 dientes de ajo picados',
        'Especias al gusto (orégano, paprika, comino)',
        'Sal y pimienta',
      ],
      instructions: [
        'Precalienta el horno a 200°C',
        'Sazona el pollo con sal, pimienta y especias',
        'Coloca el pollo y el brócoli en una bandeja',
        'Rocía con aceite de oliva y ajo',
        'Hornea por 35-40 minutos',
        'Sirve caliente',
      ],
    },
    {
      title: 'Huevos Revueltos con Queso y Aguacate',
      slug: 'huevos-revueltos-queso-aguacate',
      description: 'Desayuno keto rápido y nutritivo para empezar el día con energía.',
      duration: '10 minutos',
      difficulty: 'Fácil',
      ingredients: [
        '3 huevos',
        '1/4 taza de queso rallado',
        '1/2 aguacate en cubos',
        '1 cucharada de mantequilla',
        'Sal y pimienta al gusto',
        'Cebollino picado',
      ],
      instructions: [
        'Bate los huevos en un bowl',
        'Derrite la mantequilla en una sartén a fuego medio',
        'Vierte los huevos y revuelve suavemente',
        'Cuando estén casi listos, agrega el queso',
        'Sirve con aguacate en cubos',
        'Decora con cebollino',
      ],
    },
  ];

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      update: {},
      create: recipe,
    });
  }
  console.log('✅ Sample recipes created');

  // Create sample blog posts
  const blogPosts = [
    {
      title: '10 Beneficios de la Dieta Cetogénica',
      slug: '10-beneficios-dieta-cetogenica',
      excerpt: 'Descubre cómo la dieta keto puede transformar tu salud y bienestar.',
      content: 'La dieta cetogénica ha ganado popularidad por sus múltiples beneficios...',
      author: 'Dr. Keto',
    },
    {
      title: 'Errores Comunes al Comenzar Keto',
      slug: 'errores-comunes-comenzar-keto',
      excerpt: 'Evita estos errores para tener éxito desde el primer día.',
      content: 'Cuando comienzas la dieta cetogénica, es fácil cometer algunos errores...',
      author: 'Nutricionista Planeta Keto',
    },
    {
      title: 'Lista de Compras Keto Esencial',
      slug: 'lista-compras-keto-esencial',
      excerpt: 'Todo lo que necesitas para llenar tu despensa keto.',
      content: 'Hacer las compras cuando sigues una dieta keto puede ser confuso al principio...',
      author: 'Chef Keto',
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
  console.log('✅ Sample blog posts created');

  // Create sample forum threads
  const forumThreads = [
    {
      title: '¿Cómo empezar con la dieta keto?',
      slug: 'como-empezar-dieta-keto',
      content: 'Hola a todos, soy nuevo en la comunidad y me gustaría saber por dónde empezar con la dieta cetogénica. ¿Algún consejo?',
      author: 'Usuario Nuevo',
    },
    {
      title: 'Mis resultados después de 3 meses',
      slug: 'resultados-3-meses',
      content: '¡Hola comunidad! Quiero compartir mis increíbles resultados después de 3 meses siguiendo la dieta keto...',
      author: 'María Keto',
    },
    {
      title: 'Recetas favoritas para el desayuno',
      slug: 'recetas-favoritas-desayuno',
      content: '¿Cuáles son sus recetas keto favoritas para el desayuno? Estoy buscando variedad.',
      author: 'Carlos Fitness',
    },
  ];

  for (const thread of forumThreads) {
    await prisma.forumThread.upsert({
      where: { slug: thread.slug },
      update: {},
      create: thread,
    });
  }
  console.log('✅ Sample forum threads created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
