import catalog from '../data/catalog.json' with { type: 'json' }
import hotmart from '../data/hotmart-products.json' with { type: 'json' }

const items = [...catalog.products, ...catalog.bundles]
const entries = Object.entries(hotmart.products)
const errors = []

if (entries.length !== items.length) {
  errors.push(`Hotmart tiene ${entries.length} entradas; catálogo tiene ${items.length}`)
}

for (const item of items) {
  const remote = hotmart.products[item.slug]
  if (!remote) {
    errors.push(`Falta Hotmart: ${item.slug}`)
    continue
  }
  if (remote.price !== item.price || remote.currency !== 'EUR') {
    errors.push(`Precio/moneda distintos: ${item.slug}`)
  }
  try {
    const checkout = new URL(remote.checkoutUrl)
    if (checkout.protocol !== 'https:' || checkout.hostname !== 'pay.hotmart.com') {
      errors.push(`Checkout inválido: ${item.slug}`)
    }
  } catch {
    errors.push(`Checkout inválido: ${item.slug}`)
  }
}

for (const [field, values] of [
  ['productId', entries.map(([, value]) => value.productId)],
  ['offerId', entries.map(([, value]) => value.offerId)],
  ['checkoutUrl', entries.map(([, value]) => value.checkoutUrl)],
]) {
  if (new Set(values).size !== values.length) errors.push(`${field} duplicado`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Catálogo de pagos OK: ${catalog.products.length} productos + ${catalog.bundles.length} packs`)
