import type { Metadata } from 'next';
import LegalShell from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo Planeta Keto trata tus datos personales conforme al RGPD.',
};

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de privacidad" updated="22 de junio de 2026">
      <p>
        Esta política explica cómo se tratan tus datos personales conforme al Reglamento (UE)
        2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Responsable:</strong> [Completar: nombre o razón social]</li>
        <li><strong>NIF/CIF:</strong> [Completar]</li>
        <li><strong>Contacto:</strong> <a href="mailto:info@planetaketo.es">info@planetaketo.es</a></li>
      </ul>

      <h2>2. Datos que tratamos</h2>
      <ul>
        <li><strong>Identificación y contacto:</strong> nombre y correo electrónico.</li>
        <li><strong>Datos de compra:</strong> producto, importe y país (los datos de la tarjeta los gestiona la pasarela de pago, no nosotros).</li>
        <li><strong>Datos técnicos:</strong> tu dirección IP se utiliza de forma <strong>transitoria</strong> para deducir el país y mostrarte el precio y la pasarela en tu moneda local; <strong>no se almacena</strong>.</li>
        <li>
          <strong>Analítica propia (solo con tu consentimiento):</strong> medición de audiencia 100%
          propia, sin terceros y <strong>sin almacenar tu IP</strong>. Tratamos un identificador
          aleatorio de visita (cookie <code>pk_sid</code>), el código de país, el tiempo activo en la
          página, las secciones vistas, los botones pulsados y la fuente de la visita (p. ej. una red
          social). No hacemos perfilado ni cruce de datos entre webs.
        </li>
      </ul>

      <h2>3. Finalidades y base legal</h2>
      <ul>
        <li><strong>Entregar el producto y dar soporte</strong> (ejecución del contrato).</li>
        <li><strong>Enviarte el enlace de descarga y comunicaciones del producto</strong> (ejecución del contrato).</li>
        <li><strong>Newsletter y consejos</strong>, si te suscribes (consentimiento, revocable en cualquier momento).</li>
        <li><strong>Analítica propia de audiencia</strong> para mejorar la web (consentimiento, art. 6.1.a RGPD y art. 22.2 LSSI-CE; revocable en cualquier momento desde «Preferencias de cookies»).</li>
        <li><strong>Cumplir obligaciones legales</strong> (fiscales y contables).</li>
      </ul>

      <h2>4. Destinatarios y encargados de tratamiento</h2>
      <p>Compartimos datos con proveedores que actúan como encargados o responsables, solo para prestar el servicio:</p>
      <ul>
        <li><strong>Stripe</strong> — procesamiento de pagos (resto del mundo).</li>
        <li><strong>Mercado Pago</strong> — procesamiento de pagos (Colombia).</li>
        <li><strong>Hotmart</strong> — procesamiento de pagos (resto de Latinoamérica).</li>
        <li><strong>Resend</strong> — envío de correos transaccionales.</li>
        <li><strong>Sanity</strong> — alojamiento del archivo del libro.</li>
        <li><strong>Proveedor de hosting (VPS)</strong> — infraestructura del sitio.</li>
      </ul>
      <p>
        Algunos proveedores pueden estar ubicados fuera del EEE; en tal caso, las transferencias se
        amparan en garantías adecuadas (cláusulas contractuales tipo de la UE).
      </p>

      <h2>5. Conservación</h2>
      <p>
        Conservamos tus datos mientras exista la relación y, después, durante los plazos legales
        aplicables (por ejemplo, obligaciones fiscales). La suscripción a la newsletter se conserva
        hasta que te des de baja. Los <strong>datos de analítica propia</strong> se conservan un máximo
        de <strong>14 meses</strong> y se eliminan automáticamente después (minimización de datos).
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y
        portabilidad escribiendo a <a href="mailto:info@planetaketo.es">info@planetaketo.es</a>.
        También puedes reclamar ante la Agencia Española de Protección de Datos (
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
      </p>
    </LegalShell>
  );
}
