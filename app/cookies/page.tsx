import type { Metadata } from 'next';
import LegalShell from '@/components/legal/LegalShell';
import CookiePreferencesLink from '@/components/consent/CookiePreferencesLink';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Información sobre las cookies que utiliza Planeta Keto.',
};

export default function CookiesPage() {
  return (
    <LegalShell title="Política de cookies" updated="22 de junio de 2026">
      <p>
        Una cookie es un pequeño archivo que se almacena en tu dispositivo al visitar una web. En
        Planeta Keto usamos las <strong>mínimas necesarias</strong> para que el sitio funcione y, solo
        con tu permiso, una <strong>analítica 100% propia</strong> para entender cómo se usa la web y
        mejorarla. No usamos Google Analytics ni ninguna herramienta de terceros para medir tráfico, y{' '}
        <strong>no almacenamos tu dirección IP</strong>.
      </p>

      <h2>1. Responsable</h2>
      <ul>
        <li><strong>Responsable:</strong> Planeta Keto — [Completar: nombre o razón social y NIF/CIF]</li>
        <li><strong>Contacto:</strong> <a href="mailto:info@planetaketo.es">info@planetaketo.es</a></li>
      </ul>

      <h2>2. Cookies que utilizamos</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Finalidad</th>
            <th>Duración</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>pk_consent</code></td>
            <td>Recuerda tu decisión sobre las cookies.</td>
            <td>12 meses</td>
            <td>Propia · técnica (necesaria)</td>
          </tr>
          <tr>
            <td><code>session</code></td>
            <td>Mantiene la sesión del panel de administración (solo administradores).</td>
            <td>30 días</td>
            <td>Propia · técnica (necesaria)</td>
          </tr>
          <tr>
            <td><code>pk_sid</code></td>
            <td>
              Identifica tu visita para medir audiencia de forma anónima y propia (sin IP y sin
              terceros): número de visitas, tiempo activo y secciones vistas.
            </td>
            <td>30 min (se renueva con la actividad)</td>
            <td>Propia · analítica</td>
          </tr>
        </tbody>
      </table>
      <p>
        Las cookies <strong>técnicas</strong> son necesarias y no requieren consentimiento. La cookie{' '}
        <strong>analítica</strong> (<code>pk_sid</code>) solo se instala si la aceptas; su base jurídica
        es tu <strong>consentimiento</strong> (art. 6.1.a RGPD y art. 22.2 LSSI-CE). Mientras no aceptes,
        la analítica no se activa.
      </p>

      <h2>3. Cookies de las pasarelas de pago</h2>
      <p>
        Únicamente <strong>cuando inicias un pago</strong>, la pasarela correspondiente (Stripe, Mercado
        Pago o Hotmart) puede instalar sus propias cookies para procesar la transacción y prevenir el
        fraude, según sus respectivas políticas. Son necesarias para completar la compra.
      </p>

      <h2>4. Cómo cambiar o retirar tu consentimiento</h2>
      <p>
        Puedes cambiar o retirar tu decisión en cualquier momento, con la misma facilidad con la que la
        diste, desde aquí:{' '}
        <CookiePreferencesLink className="font-medium text-forest underline hover:text-forest-dark" />.
        También puedes eliminar las cookies desde los ajustes de tu navegador (Chrome, Firefox, Safari o
        Edge). Si retiras la analítica, dejamos de medir tu visita y se elimina la cookie{' '}
        <code>pk_sid</code>.
      </p>

      <h2>5. Más información</h2>
      <p>
        Para cualquier duda sobre esta política, escríbenos a{' '}
        <a href="mailto:info@planetaketo.es">info@planetaketo.es</a>. Consulta también nuestra{' '}
        <a href="/privacidad">política de privacidad</a>.
      </p>
    </LegalShell>
  );
}
