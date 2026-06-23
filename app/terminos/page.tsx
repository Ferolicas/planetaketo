import type { Metadata } from 'next';
import LegalShell from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de contratación de los productos digitales de Planeta Keto.',
  alternates: { canonical: '/terminos' },
};

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y condiciones" updated="23 de junio de 2026">
      <p>
        Estas condiciones regulan la compra de los productos digitales de Planeta Keto. Al realizar un
        pedido confirmas que has leído y aceptas estos términos. Te recomendamos guardarlos o
        imprimirlos.
      </p>

      <h2>1. Titular</h2>
      <p>
        El titular y vendedor es <strong>Ferney Elpidio Oliveros Casanova</strong> (NIF 60739837B),
        con domicilio en Ciudad Real (España) y correo de contacto{' '}
        <a href="mailto:info@planetaketo.es">info@planetaketo.es</a>. Más información en el{' '}
        <a href="/aviso-legal">aviso legal</a>.
      </p>

      <h2>2. Productos</h2>
      <p>
        Planeta Keto vende <strong>contenidos digitales descargables</strong> (libros y recetarios en
        formato PDF sobre alimentación cetogénica, baja en carbohidratos y baja en calorías, métodos,
        guías y recursos). Son productos de naturaleza digital, sin soporte físico, con acceso de por
        vida al archivo adquirido.
      </p>

      <h2>3. Precio e impuestos</h2>
      <p>
        Los precios se muestran en la web e incluyen los impuestos aplicables. Según tu país, el
        precio y la moneda se ajustan automáticamente (por ejemplo, euros con Stripe, pesos
        colombianos con Mercado Pago). Las posibles ofertas tienen carácter temporal.
      </p>

      <h2>4. Pago</h2>
      <p>
        El pago se procesa de forma segura a través de pasarelas externas según tu país:{' '}
        <strong>Stripe</strong> (resto del mundo), <strong>Mercado Pago</strong> (Colombia) y{' '}
        <strong>Hotmart</strong> (resto de Latinoamérica). En las compras a través de Hotmart, esta
        plataforma puede actuar como vendedor/intermediario y aplicar además sus propias condiciones.
        No almacenamos los datos completos de tu tarjeta.
      </p>

      <h2>5. Entrega</h2>
      <p>
        Tras confirmarse el pago, recibirás por correo electrónico un <strong>enlace de descarga</strong>{' '}
        del producto, normalmente de forma inmediata y, en todo caso, en un plazo breve. Revisa la
        carpeta de spam. Si no recibes tu enlace, escríbenos a{' '}
        <a href="mailto:info@planetaketo.es">info@planetaketo.es</a> y lo solucionamos.
      </p>

      <h2>6. Licencia de uso</h2>
      <p>
        Al comprar obtienes una licencia <strong>personal, individual e intransferible</strong> para
        uso privado. Queda prohibido revender, compartir, copiar, redistribuir o comunicar
        públicamente el contenido, total o parcialmente, sin autorización escrita.
      </p>

      <h2>7. Desistimiento y reembolsos</h2>
      <p>
        Por tratarse de <strong>contenido digital de descarga inmediata</strong>, el derecho legal de
        desistimiento de 14 días <strong>no es aplicable</strong> una vez que la descarga ha comenzado,
        si has dado tu consentimiento expreso a esa entrega inmediata y has reconocido la pérdida de
        dicho derecho al comprar (art. 103.m del Real Decreto Legislativo 1/2007 y equivalentes en
        Latinoamérica).
      </p>
      <p>
        Al margen de lo anterior, ofrecemos de forma voluntaria una{' '}
        <strong>garantía de satisfacción de 7 días</strong>: si el producto no es lo que esperabas,
        escríbenos en ese plazo y te devolvemos el importe. Tienes todos los detalles y el formulario
        en la página de <a href="/desistimiento">desistimiento y reembolsos</a>.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        Todos los contenidos (textos, recetas, imágenes, marca «Planeta Keto», libros y materiales
        descargables) son titularidad del responsable o de sus licenciantes y están protegidos por la
        normativa de propiedad intelectual e industrial. Su uso no autorizado puede dar lugar a
        responsabilidades legales.
      </p>

      <h2>9. Aviso médico y nutricional</h2>
      <p>
        El contenido de Planeta Keto tiene <strong>fines exclusivamente informativos y educativos</strong>{' '}
        sobre estilo de vida y alimentación, y <strong>no constituye consejo médico, diagnóstico ni
        tratamiento</strong> ni sustituye la consulta con un profesional sanitario. Antes de iniciar
        cualquier cambio en tu alimentación, ejercicio o suplementación —y especialmente si tienes una
        enfermedad, tomas medicación, estás embarazada o en lactancia— <strong>consulta con tu médico o
        un profesional de la salud</strong>. Los resultados varían de una persona a otra y no se
        garantizan. El titular no se responsabiliza de las decisiones que tomes a partir de esta
        información.
      </p>

      <h2>10. Responsabilidad</h2>
      <p>
        Procuramos que la web y los contenidos estén disponibles y libres de errores, pero no podemos
        garantizar la ausencia total de interrupciones o fallos técnicos. En la máxima medida permitida
        por la ley, el titular no responde de daños indirectos derivados del uso del sitio o de los
        productos. Nada en estas condiciones excluye la responsabilidad que no pueda excluirse
        legalmente ni los derechos que la ley reconoce a los consumidores.
      </p>

      <h2>11. Atención al cliente y reclamaciones</h2>
      <p>
        Para cualquier consulta o reclamación, escríbenos a{' '}
        <a href="mailto:info@planetaketo.es">info@planetaketo.es</a>. Si eres consumidor en la UE,
        también dispones de la plataforma de resolución de litigios en línea de la Comisión Europea
        (ODR).
      </p>

      <h2>12. Modificaciones</h2>
      <p>
        Podemos actualizar estas condiciones para adaptarlas a cambios legales o del servicio. La
        versión aplicable a tu compra es la vigente en el momento de realizarla.
      </p>

      <h2>13. Ley aplicable y jurisdicción</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Si contratas como consumidor,
        conservarás además la protección que te otorguen las normas imperativas de tu país de
        residencia. Para las controversias se estará a los tribunales que resulten competentes conforme
        a derecho.
      </p>
    </LegalShell>
  );
}
