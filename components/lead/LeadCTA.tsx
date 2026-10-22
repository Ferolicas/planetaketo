'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import LeadModal from '@/components/lead/LeadModal';

/** Botón que abre el formulario del libro gratuito (Planificador de 7 días). */
export default function LeadCTA({ label = 'Descargar el planificador gratis' }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 font-semibold text-white transition hover:bg-forest-dark"
      >
        <Download className="h-5 w-5" />
        {label}
      </button>
      <LeadModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
