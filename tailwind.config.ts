import type { Config } from 'tailwindcss';

// ============================================================
// Sistema visual "Fresh Wellness" — Planeta Keto
// Verde bosque (marca) + menta (acento/firma) + ámbar (CTA) sobre crema.
// Tipografía: Lora (títulos, serif) + Raleway (cuerpo, sans).
// ============================================================
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        cream: '#FAF7F0',
        // Verde bosque de marca
        forest: {
          DEFAULT: '#166534',
          dark: '#14532D',
          deep: '#052e16',
        },
        // Menta fresca: acento y elemento firma
        mint: {
          DEFAULT: '#34D399',
          soft: '#6EE7B7',
          pale: '#D1FAE5',
        },
        // Ámbar cálido: color de acción (CTA)
        cta: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          soft: '#FCD34D',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(20, 83, 45, 0.12)',
        card: '0 12px 40px -12px rgba(20, 83, 45, 0.18)',
        cta: '0 10px 30px -8px rgba(245, 158, 11, 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out both',
        'float-slow': 'floatSlow 9s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatSlow: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(16px,-24px) scale(1.06)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};

export default config;
