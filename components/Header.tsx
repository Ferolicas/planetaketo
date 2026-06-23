'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-shadow ${
        scrolled ? 'border-forest/10 shadow-soft bg-cream/90' : 'border-transparent bg-cream/70'
      } backdrop-blur-md`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/LOGO.png"
              alt="Planeta Keto"
              width={40}
              height={40}
              className="h-10 w-10 object-contain transition-transform group-hover:rotate-6"
              priority
            />
            <span className="font-serif text-xl font-semibold text-forest-dark tracking-tight">
              Planeta Keto
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
