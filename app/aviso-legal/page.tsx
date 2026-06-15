import type { Metadata } from 'next';
import LegalShell from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: 'Aviso legal y condiciones de uso de Planeta Keto.',
};

export default function AvisoLegalPage() {
  return (
    <LegalShell title="Aviso legal" updated="15 de junio de 2026">
      <p>
        En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de
        Comercio Electrónico (LSSI-CE), se facilita la siguiente información del titular de este
        sitio web.
      </p>

      <h2>1. Titular del sitio web</h2>
      <ul>
        <li><strong>Titular:</strong> [Completar: nombre o razón social]</li>
        <li><strong>NIF/CIF:</strong> [Completar]</li>
        <li><strong>Domicilio:</strong> [Completar]</li>
        <li><strong>Correo:</strong> <a href="mailto:info@planetaketo.es">info@planetaketo.es</a></li>
        <li><strong>Sitio web:</strong> https://planetaketo.es</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        Planeta Keto es un sitio dedicado a la venta de contenidos digitales sobre alimentación
        cetogénica (el «Método Keto»), así como recursos y recetas relacionadas. El acceso y uso del
        sitio implica la aceptación de las presentes condiciones.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El usuario se compromete a hacer un uso lícito del sitio y a no emplearlo para fines
        ilícitos o lesivos. Los productos digitales adquiridos son de uso personal e intransferible;
        queda prohibida su reproducción, distribución o comunicación pública sin autorización.
      </p>

      <h2>4. Propiedad intelectual</h2>
      <p>
        Todos los contenidos (textos, recetas, imágenes, marca, libro y materiales descargables) son
        titularidad del responsable o de sus licenciantes y están protegidos por la normativa de
        propiedad intelectual e industrial.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        El contenido tiene carácter informativo y no sustituye el consejo médico profesional. Antes
        de iniciar cualquier cambio de alimentación, consulta con un profesional de la salud. El
        titular no se responsabiliza de las decisiones tomadas a partir de la información del sitio.
      </p>

      <h2>6. Pagos</h2>
      <p>
        Los pagos se procesan a través de pasarelas externas según el país del comprador (Stripe,
        Mercado Pago y Hotmart). El titular no almacena datos completos de tarjetas de pago.
      </p>

      <h2>7. Legislación aplicable</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para cualquier controversia, las
        partes se someten a los juzgados y tribunales que correspondan conforme a derecho.
      </p>
    </LegalShell>
  );
}
