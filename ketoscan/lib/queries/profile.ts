import { queryOne } from "@/lib/db";
import type { User } from "@/types";

// ============================================================
// Queries del perfil de usuario (users)
// ============================================================

export async function getProfile(userId: string): Promise<User | null> {
  return queryOne<User>(`SELECT * FROM users WHERE id = $1`, [userId]);
}

export interface ProfileInput {
  name?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  age?: number | null;
  gender?: string | null;
  activity_level?: string | null;
  target_weight_kg?: number | null;
  target_weeks?: number | null;
  diet_type?: string | null;
  max_carbs_g?: number | null;
}

export async function upsertProfile(
  userId: string,
  data: ProfileInput
): Promise<User> {
  const user = await queryOne<User>(
    `UPDATE users SET
        name = COALESCE($2, name),
        height_cm = $3,
        weight_kg = $4,
        age = $5,
        gender = $6,
        activity_level = $7,
        target_weight_kg = $8,
        target_weeks = $9,
        diet_type = COALESCE($10, diet_type),
        max_carbs_g = $11
     WHERE id = $1
     RETURNING *`,
    [
      userId,
      data.name ?? null,
      data.height_cm ?? null,
      data.weight_kg ?? null,
      data.age ?? null,
      data.gender ?? null,
      data.activity_level ?? null,
      data.target_weight_kg ?? null,
      data.target_weeks ?? null,
      data.diet_type ?? null,
      data.max_carbs_g ?? null,
    ]
  );

  if (!user) {
    // El usuario por defecto deberia existir; si no, lo creamos.
    const created = await queryOne<User>(
      `INSERT INTO users (
          id, name, height_cm, weight_kg, age, gender, activity_level,
          target_weight_kg, target_weeks, diet_type, max_carbs_g
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,'keto'),$11)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [
        userId,
        data.name ?? "Mi perfil",
        data.height_cm ?? null,
        data.weight_kg ?? null,
        data.age ?? null,
        data.gender ?? null,
        data.activity_level ?? null,
        data.target_weight_kg ?? null,
        data.target_weeks ?? null,
        data.diet_type ?? null,
        data.max_carbs_g ?? null,
      ]
    );
    if (!created) throw new Error("No se pudo guardar el perfil");
    return created;
  }

  return user;
}

// Helper de uso interno para que otras queries/calculos lean el perfil
export async function ensureProfileRow(userId: string): Promise<User> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const created = await queryOne<User>(
    `INSERT INTO users (id, name, diet_type) VALUES ($1, $2, 'keto')
     ON CONFLICT (id) DO NOTHING RETURNING *`,
    [userId, "Mi perfil"]
  );
  if (created) return created;
  // Carrera: otro proceso lo inserto
  const again = await getProfile(userId);
  if (!again) throw new Error("No se pudo crear el perfil por defecto");
  return again;
}
