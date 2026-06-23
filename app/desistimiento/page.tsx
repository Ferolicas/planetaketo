import type { Metadata } from 'next';
import LegalShell from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Desistimiento y reembolsos',
  description: 'Derecho de desistimiento, garantía de satisfacción y cómo solicitar un reembolso en Planeta Keto.',
  alternates: { canonical: '/desistimiento' },
};

export default function DesistimientoPage() {
  return (
    <LegalShell title="Desistimiento y reembolsos" updated="23 de junio de 2026">
      <p>
        Queremos que compres con tranquilidad. Aquí te explicamos, de forma clara, tu derecho de
        desistimiento, nuestra garantía de satisfacción y cómo pedir un reembolso. Esta página es
        accesible en cualquier momento, sin necesidad de iniciar sesión.
      </p>

      <h2>En resumen</h2>
      <ul>
        <li>
          Nuestros productos son <strong>contenido digital de descarga inmediata</strong>. Por ley, el
          desistimiento de 14 días deja de aplicarse cuando la descarga ha comenzado con tu
          consentimiento expreso.
        </li>
        <li>
          Aun así, te damos una <strong>garantía de satisfacción de 7 días</strong>: si no te convence,
          te devolvemos el dinero.
        </li>
      </ul>

      <h2>1. Derecho legal de desistimiento (UE)</h2>
      <p>
        Como consumidor en la Unión Europea tienes, con carácter general, <strong>14 días naturales</strong>{' '}
        para desistir de una compra a distancia sin justificación. Sin embargo, existe una excepción
        legal para el <strong>contenido digital sin soporte material</strong>: cuando la ejecución (la
        descarga) ha comenzado con tu <strong>consentimiento previo y expreso</strong> y tu
        reconocimiento de que, por ello, <strong>pierdes el derecho de desistimiento</strong> (art.
        103.m del Real Decreto Legislativo 1/2007). Por eso, al comprar, te pedimos ese consentimiento
        para poder entregarte el producto al instante.
      </p>
      <p>
        Si aún <strong>no has descargado</strong> el producto, puedes desistir dentro de los 14 días
        usando el formulario de abajo.
      </p>

      <h2>2. Garantía de satisfacción de 7 días</h2>
      <p>
        Con independencia de lo anterior, ofrecemos de forma <strong>voluntaria</strong> una garantía:
        si en los <strong>7 días</strong> siguientes a tu compra consideras que el producto no es lo que
        esperabas, escríbenos y te <strong>devolvemos el importe íntegro</strong>, sin complicaciones.
      </p>

      <h2>3. Cómo solicitar un reembolso o desistir</h2>
      <p>
        Escríbenos a <a href="mailto:info@planetaketo.es">info@planetaketo.es</a> indicando tu nombre,
        el correo con el que compraste, el producto y la fecha de compra. Si lo prefieres, puedes usar
        este modelo:
      </p>
      <blockquote>
        <p>
          «A la atención de Ferney Elpidio Oliveros Casanova (info@planetaketo.es): por la presente le
          comunico que desisto de mi contrato de compra del siguiente producto digital [nombre del
          producto], realizado el [fecha de compra]. Nombre del consumidor: [tu nombre]. Correo de la
          compra: [tu correo].»
        </p>
      </blockquote>
      <p>
        Te confirmaremos la recepción de tu solicitud.
      </p>

      <h2>4. Devolución del importe</h2>
      <p>
        Si procede el reembolso, lo realizaremos por el <strong>mismo medio de pago</strong> que usaste,
        a la mayor brevedad. El tiempo en verse reflejado depende de la pasarela (Stripe, Mercado Pago
        o Hotmart) y de tu banco. En las compras gestionadas por <strong>Hotmart</strong>, el reembolso
        puede tramitarse a través de su propia plataforma.
      </p>

      <h2>5. Compras desde Latinoamérica</h2>
      <p>
        Si compras desde Colombia, la ley de protección al consumidor (Ley 1480) reconoce el derecho de
        retracto en ventas a distancia, con excepciones para los contenidos digitales ya ejecutados,
        similar a la normativa europea. En otros países de Latinoamérica se aplican sus normas
        equivalentes. En todo caso, nuestra <strong>garantía de satisfacción de 7 días</strong> es para
        ti compres desde donde compres.
      </p>
    </LegalShell>
  );
}
