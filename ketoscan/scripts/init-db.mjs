// Inicializa la base de datos: aplica sql/schema.sql y crea el usuario por defecto.
// Uso: node scripts/init-db.mjs   (requiere DATABASE_URL y DEFAULT_USER_ID)
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Cargar .env.local de forma simple (sin dependencias)
async function loadEnv() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = join(__dirname, "..", ".env.local");
  try {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf("=");
      if (idx === -1) continue;
      const key = t.slice(0, idx).trim();
      const val = t.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // sin .env.local: usar variables ya presentes en el entorno
  }
}

async function main() {
  await loadEnv();
  const { DATABASE_URL, DEFAULT_USER_ID } = process.env;
  if (!DATABASE_URL) throw new Error("Falta DATABASE_URL");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const schema = await readFile(join(__dirname, "..", "sql", "schema.sql"), "utf8");

  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    console.log("Aplicando esquema...");
    await client.query(schema);

    if (DEFAULT_USER_ID) {
      await client.query(
        `INSERT INTO users (id, name, diet_type)
         VALUES ($1, $2, 'keto')
         ON CONFLICT (id) DO NOTHING`,
        [DEFAULT_USER_ID, "Mi perfil"]
      );
      console.log(`Usuario por defecto asegurado: ${DEFAULT_USER_ID}`);
    }
    console.log("Base de datos lista ✓");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Error inicializando la BD:", e.message);
  process.exit(1);
});
