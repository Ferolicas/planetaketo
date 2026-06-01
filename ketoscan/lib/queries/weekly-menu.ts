import { pool, query } from "@/lib/db";
import type { WeeklyMenuItem } from "@/types";

// ============================================================
// Queries del menu semanal (weekly_menu)
// ============================================================

export async function listWeeklyMenu(
  userId: string,
  weekStart: string
): Promise<WeeklyMenuItem[]> {
  const res = await query<WeeklyMenuItem>(
    `SELECT
        id, user_id, week_start::text AS week_start, day_number,
        food_id, food_name, grams, meal_type, created_at
     FROM weekly_menu
     WHERE user_id = $1 AND week_start = $2
     ORDER BY day_number ASC, created_at ASC`,
    [userId, weekStart]
  );
  return res.rows;
}

export interface WeeklyMenuItemInput {
  day_number: number;
  food_id?: string | null;
  food_name: string;
  grams: number;
  meal_type: string;
}

/**
 * Reemplaza el menu semanal completo de una semana de forma atomica:
 * borra el existente e inserta el nuevo set. Usado por generate-menu.
 */
export async function replaceWeeklyMenu(
  userId: string,
  weekStart: string,
  items: WeeklyMenuItemInput[]
): Promise<WeeklyMenuItem[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM weekly_menu WHERE user_id = $1 AND week_start = $2`,
      [userId, weekStart]
    );
    for (const it of items) {
      await client.query(
        `INSERT INTO weekly_menu
           (user_id, week_start, day_number, food_id, food_name, grams, meal_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          userId,
          weekStart,
          it.day_number,
          it.food_id ?? null,
          it.food_name,
          it.grams,
          it.meal_type,
        ]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return listWeeklyMenu(userId, weekStart);
}

export async function clearWeeklyMenu(
  userId: string,
  weekStart: string
): Promise<void> {
  await query(`DELETE FROM weekly_menu WHERE user_id = $1 AND week_start = $2`, [
    userId,
    weekStart,
  ]);
}
