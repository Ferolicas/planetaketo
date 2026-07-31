#!/usr/bin/env node
/** Sube los seis ZIP de entrega a Sanity y crea documentos deliveryBundle. */
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const bundleDir = process.argv[2];
if (!bundleDir) throw new Error('Uso: node scripts/upload-bundle-assets.mjs <directorio-zips>');

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;
if (!projectId || !token) throw new Error('Faltan SANITY_PROJECT_ID o SANITY_API_TOKEN');

const catalog = JSON.parse(await fs.readFile(path.join(root, 'data/catalog.json'), 'utf8'));
const api = `https://${projectId}.api.sanity.io/v2021-10-21`;

async function sanityJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // El mensaje de texto se incluye en el error, nunca el token.
  }
  if (!response.ok) {
    throw new Error(`Sanity ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

for (const [index, bundle] of catalog.bundles.entries()) {
  const filename = `${bundle.slug}.zip`;
  const archivePath = path.resolve(bundleDir, filename);
  const bytes = await fs.readFile(archivePath);
  if (bytes.byteLength === 0) throw new Error(`ZIP vacío: ${archivePath}`);

  // La operación es reejecutable: si el documento ya apunta a un ZIP del mismo
  // nombre y tamaño no se vuelve a subir otro asset huérfano.
  const queryUrl = new URL(`${api}/data/query/${dataset}`);
  queryUrl.searchParams.set(
    'query',
    '*[_type == "deliveryBundle" && slug.current == $slug][0]{"fileName": archive.asset->originalFilename, "mimeType": archive.asset->mimeType, "size": archive.asset->size}'
  );
  queryUrl.searchParams.set('$slug', JSON.stringify(bundle.slug));
  const existing = await sanityJson(queryUrl.toString());
  if (
    existing?.result?.fileName === filename &&
    existing?.result?.mimeType === 'application/zip' &&
    Number(existing?.result?.size) === bytes.byteLength
  ) {
    console.log(`BUNDLE_ASSET_SKIP ${index + 1}/${catalog.bundles.length} ${bundle.slug}`);
    continue;
  }

  const uploadUrl = `${api}/assets/files/${dataset}?filename=${encodeURIComponent(filename)}`;
  const uploaded = await sanityJson(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/zip' },
    body: bytes,
  });
  const assetId = uploaded?.document?._id;
  if (!assetId) throw new Error(`Sanity no devolvió asset para ${bundle.slug}`);

  const document = {
    _id: `deliveryBundle.${bundle.slug}`,
    _type: 'deliveryBundle',
    title: bundle.title,
    slug: { _type: 'slug', current: bundle.slug },
    archive: {
      _type: 'file',
      asset: { _type: 'reference', _ref: assetId },
    },
  };
  await sanityJson(`${api}/data/mutate/${dataset}?returnIds=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations: [{ createOrReplace: document }] }),
  });
  console.log(`BUNDLE_ASSET ${index + 1}/${catalog.bundles.length} ${bundle.slug}`);
}

console.log(`BUNDLE_ASSET_OK total=${catalog.bundles.length}`);
