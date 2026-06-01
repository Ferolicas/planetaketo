import { query, queryOne } from "@/lib/db";
import type { Food } from "@/types";

// ============================================================
// Queries de alimentos (foods)
// ============================================================

export interface FoodInput {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number | null;
  sugar_per_100g?: number | null;
  sodium_per_100g?: number | null;
  saturated_fat_per_100g?: number | null;
}

export async function listFoods(userId: string): Promise<Food[]> {
  const res = await query<Food>(
    `SELECT * FROM foods WHERE user_id = $1 ORDER BY name ASC`,
    [userId]
  );
  return res.rows;
}

export async function getFood(userId: string, id: string): Promise<Food | null> {
  return queryOne<Food>(`SELECT * FROM foods WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
}

export async function createFood(
  userId: string,
  data: FoodInput
): Promise<Food> {
  const food = await queryOne<Food>(
    `INSERT INTO foods (
        user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g,
        fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
        saturated_fat_per_100g
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      data.name,
      data.calories_per_100g,
      data.protein_per_100g,
      data.carbs_per_100g,
      data.fat_per_100g,
      data.fiber_per_100g ?? 0,
      data.sugar_per_100g ?? 0,
      data.sodium_per_100g ?? 0,
      data.saturated_fat_per_100g ?? 0,
    ]
  );
  if (!food) throw new Error("No se pudo crear el alimento");
  return food;
}

export async function updateFood(
  userId: string,
  id: string,
  data: FoodInput
): Promise<Food | null> {
  return queryOne<Food>(
    `UPDATE foods SET
        name = $3,
        calories_per_100g = $4,
        protein_per_100g = $5,
        carbs_per_100g = $6,
        fat_per_100g = $7,
        fiber_per_100g = $8,
        sugar_per_100g = $9,
        sodium_per_100g = $10,
        saturated_fat_per_100g = $11
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      id,
      userId,
      data.name,
      data.calories_per_100g,
      data.protein_per_100g,
      data.carbs_per_100g,
      data.fat_per_100g,
      data.fiber_per_100g ?? 0,
      data.sugar_per_100g ?? 0,
      data.sodium_per_100g ?? 0,
      data.saturated_fat_per_100g ?? 0,
    ]
  );
}

export async function deleteFood(userId: string, id: string): Promise<boolean> {
  const res = await query(`DELETE FROM foods WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (res.rowCount ?? 0) > 0;
}
