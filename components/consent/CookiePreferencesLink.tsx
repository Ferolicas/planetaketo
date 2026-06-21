'use client';

import { useConsent } from './ConsentProvider';

// Enlace permanente del pie de página para CAMBIAR o RETIRAR el consentimiento
// con la misma facilidad con que se dio (exigencia AEPD). Abre la 2ª capa del CMP.
export default function CookiePreferencesLink({ className }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      Preferencias de cookies
    </button>
  );
}
