import { query, queryOne } from "@/lib/db";
import type { DailyMenuItem, DailyMenuItemWithFood, Food } from "@/types";

// ============================================================
// Queries del menu diario (daily_menu)
// ============================================================

// Fila cruda del JOIN entre daily_menu y foods
interface JoinedRow {
  id: string;
  user_id: string;
  food_id: string;
  date: string;
  grams: number;
  created_at: string;
  updated_at: string;
  food_json: Food;
}

export async function listDailyMenu(
  userId: string,
  date: string
): Promise<DailyMenuItemWithFood[]> {
  const res = await query<JoinedRow>(
    `SELECT
        dm.id, dm.user_id, dm.food_id, dm.date::text AS date,
        dm.grams, dm.created_at, dm.updated_at,
        row_to_json(f.*) AS food_json
     FROM daily_menu dm
     JOIN foods f ON f.id = dm.food_id
     WHERE dm.user_id = $1 AND dm.date = $2
     ORDER BY dm.created_at ASC`,
    [userId, date]
  );
  return res.rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    food_id: r.food_id,
    date: r.date,
    grams: r.grams,
    created_at: r.created_at,
    updated_at: r.updated_at,
    food: r.food_json,
  }));
}

export async function addDailyMenuItem(
  userId: string,
  foodId: string,
  grams: number,
  date: string
): Promise<DailyMenuItem> {
  const item = await queryOne<DailyMenuItem>(
    `INSERT INTO daily_menu (user_id, food_id, grams, date)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, food_id, date::text AS date, grams, created_at, updated_at`,
    [userId, foodId, grams, date]
  );
  if (!item) throw new Error("No se pudo agregar el alimento al menu");
  return item;
}

export async function updateDailyMenuItem(
  userId: string,
  id: string,
  grams: number
): Promise<DailyMenuItem | null> {
  return queryOne<DailyMenuItem>(
    `UPDATE daily_menu SET grams = $3
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, food_id, date::text AS date, grams, created_at, updated_at`,
    [id, userId, grams]
  );
}

export async function deleteDailyMenuItem(
  userId: string,
  id: string
): Promise<boolean> {
  const res = await query(
    `DELETE FROM daily_menu WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return (res.rowCount ?? 0) > 0;
}

// Actualiza en lote los gramos (usado por la reestructuracion)
export async function bulkUpdateGrams(
  userId: string,
  updates: { id: string; grams: number }[]
): Promise<void> {
  if (updates.length === 0) return;
  const client = await (await import("@/lib/db")).pool.connect();
  try {
    await client.query("BEGIN");
    for (const u of updates) {
      await client.query(
        `UPDATE daily_menu SET grams = $3 WHERE id = $1 AND user_id = $2`,
        [u.id, userId, u.grams]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
