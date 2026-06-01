import { z } from "zod";

// ============================================================
// Esquemas de validacion Zod - toda entrada de usuario se valida
// ============================================================

const optionalNonNegative = z
  .number()
  .nonnegative()
  .max(100000)
  .optional()
  .nullable();

export const foodSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  calories_per_100g: z.number().nonnegative().max(900),
  protein_per_100g: z.number().nonnegative().max(100),
  carbs_per_100g: z.number().nonnegative().max(100),
  fat_per_100g: z.number().nonnegative().max(100),
  fiber_per_100g: optionalNonNegative,
  sugar_per_100g: optionalNonNegative,
  sodium_per_100g: optionalNonNegative,
  saturated_fat_per_100g: optionalNonNegative,
});

export type FoodSchema = z.infer<typeof foodSchema>;

export const profileSchema = z.object({
  name: z.string().trim().max(100).optional().nullable(),
  height_cm: z.number().min(50).max(280).optional().nullable(),
  weight_kg: z.number().min(20).max(400).optional().nullable(),
  age: z.number().int().min(10).max(120).optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  activity_level: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional()
    .nullable(),
  target_weight_kg: z.number().min(20).max(400).optional().nullable(),
  target_weeks: z.number().int().min(1).max(104).optional().nullable(),
  diet_type: z.enum(["keto", "low_carb", "normal"]).optional().nullable(),
  max_carbs_g: z.number().int().min(0).max(400).optional().nullable(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;

export const dailyMenuAddSchema = z.object({
  food_id: z.string().uuid("food_id invalido"),
  grams: z.number().positive().max(5000).default(100),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida (YYYY-MM-DD)")
    .optional(),
});

export const dailyMenuUpdateSchema = z.object({
  grams: z.number().positive().max(5000),
});

// Reestructuracion en lote (persistir gramos calculados en cliente)
export const dailyMenuBulkSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida (YYYY-MM-DD)")
    .optional(),
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        grams: z.number().nonnegative().max(5000),
      })
    )
    .min(1)
    .max(100),
});

// Escaneo: imagen en base64 (data URL o crudo) + mime
export const scanSchema = z.object({
  image: z.string().min(16, "Imagen invalida").max(12_000_000),
  media_type: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
    .default("image/jpeg"),
  hint: z.string().max(200).optional(),
});

export const generateMenuSchema = z.object({
  week_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "week_start invalido (YYYY-MM-DD)")
    .optional(),
  days: z.number().int().min(1).max(7).default(7),
  meals_per_day: z.number().int().min(1).max(6).default(4),
  notes: z.string().max(500).optional(),
});

// Formatea errores de Zod a un objeto simple
export function formatZodError(error: z.ZodError) {
  return error.flatten();
}
