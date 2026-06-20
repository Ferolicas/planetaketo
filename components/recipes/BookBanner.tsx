import Image from 'next/image';
import CheckoutButton from '@/components/checkout/CheckoutButton';

/** Banner del ebook con CTA de compra directa (abre el modal de pago). */
export default function BookBanner() {
  return (
    <aside className="my-8 overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-dark text-cream shadow-card">
      <div className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:gap-7 sm:p-8 sm:text-left">
        <Image
          src="/libro.png"
          alt="Método Keto 70 Días — Planeta Keto"
          width={160}
          height={200}
          className="w-28 shrink-0 rounded-xl shadow-lg sm:w-32"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-mint-soft">El Método Keto Definitivo</p>
          <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
            ¿Lista para transformar tu cuerpo en 70 días?
          </h3>
          <p className="mt-2 text-sm text-mint-pale/80">
            Menús día a día, calculadoras y listas de compra. Sin pasar hambre, sin harinas.
          </p>
          <CheckoutButton className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-cta px-7 py-3 font-bold text-forest-dark shadow-cta transition-colors hover:bg-cta-dark hover:text-white">
            Conseguir el método
          </CheckoutButton>
        </div>
      </div>
    </aside>
  );
}
