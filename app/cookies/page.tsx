import type { Metadata } from 'next';
import LegalShell from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Información sobre las cookies que utiliza Planeta Keto.',
};

export default function CookiesPage() {
  return (
    <LegalShell title="Política de cookies" updated="15 de junio de 2026">
      <p>
        Una cookie es un pequeño archivo que se almacena en tu dispositivo al visitar una web. En
        Planeta Keto usamos las mínimas necesarias para que el sitio funcione y para entender de
        forma agregada cómo se usa.
      </p>

      <h2>1. Cookies que utilizamos</h2>
      <ul>
        <li>
          <strong>Técnicas y de sesión (necesarias):</strong> permiten el funcionamiento del sitio y
          recordar tu sesión. No requieren consentimiento.
        </li>
        <li>
          <strong>Analítica propia:</strong> medimos visitas y clics de forma agregada y anónima para
          mejorar la web. No se usan para publicidad ni se ceden a terceros con fines comerciales.
        </li>
        <li>
          <strong>Terceros durante el pago:</strong> al pagar, la pasarela correspondiente (Stripe,
          Mercado Pago o Hotmart) puede instalar sus propias cookies para procesar la transacción y
          prevenir el fraude, según sus respectivas políticas.
        </li>
      </ul>
      <p>
        Las tipografías se sirven desde nuestro propio servidor, por lo que no se realizan
        peticiones a terceros para cargarlas.
      </p>

      <h2>2. Gestión de cookies</h2>
      <p>
        Puedes configurar o eliminar las cookies desde los ajustes de tu navegador. Ten en cuenta
        que bloquear las cookies técnicas puede afectar al funcionamiento del sitio. Consulta la
        ayuda de tu navegador (Chrome, Firefox, Safari o Edge) para más detalles.
      </p>

      <h2>3. Más información</h2>
      <p>
        Para cualquier duda sobre esta política, escríbenos a{' '}
        <a href="mailto:info@planetaketo.es">info@planetaketo.es</a>. Consulta también nuestra{' '}
        <a href="/privacidad">política de privacidad</a>.
      </p>
    </LegalShell>
  );
}
