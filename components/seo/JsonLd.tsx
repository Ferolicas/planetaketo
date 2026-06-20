import type { ReactElement } from 'react';

/**
 * Inserta un bloque de datos estructurados (JSON-LD) en el documento.
 * Server component: se renderiza en el HTML inicial, visible para Googlebot.
 */
export default function JsonLd({ data }: { data: object }): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
