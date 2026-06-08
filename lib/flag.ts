// Convierte un código de país ISO-3166 alfa-2 (p.ej. "ES", "US") en su bandera emoji.
// Si no es un código válido (nulo, nombre completo, "Unknown"...), devuelve un globo.
export function countryToFlag(country?: string | null): string {
  if (!country) return '🌐';
  const cc = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '🌐';
  const base = 0x1f1e6; // 🇦 (REGIONAL INDICATOR SYMBOL LETTER A)
  return String.fromCodePoint(
    base + cc.charCodeAt(0) - 65,
    base + cc.charCodeAt(1) - 65
  );
}
