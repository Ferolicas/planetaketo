-- Crear usuario admin
-- Email: admin@planetaketo.es
-- Contraseña: admin123

INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@planetaketo.es',
  'Administrador',
  '$2a$10$s9un9QzUtkkg9h2fbnPJ5.a2E0YGP3KxMSnLBe6.DqoBBVdrJvTgy',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Crear contenido inicial de home
INSERT INTO "HomeContent" (id, "heroTitle", "heroSubtitle", sections, "updatedAt")
VALUES (
  'home-main',
  'Bienvenido a Planeta Keto',
  'Tu guía completa para la dieta cetogénica',
  '{"benefits": ["Pierde peso de forma saludable", "Aumenta tu energía", "Mejora tu claridad mental"]}',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Nota: Para la contraseña hasheada, ejecuta este comando en Node.js:
-- const bcrypt = require('bcryptjs');
-- console.log(await bcrypt.hash('admin123', 10));
