import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b shadow-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src="/LOGO.png"
                alt="Planeta Keto Logo"
                fill
                className="object-contain transition-transform group-hover:scale-110"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight group-hover:text-emerald-100 transition-colors">
              Planeta Keto
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
