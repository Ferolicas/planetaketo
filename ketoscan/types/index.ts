// ============================================================
// Planeta Keto Scan - Tipos globales
// ============================================================

export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type DietType = "keto" | "low_carb" | "normal";

export type MealType = "desayuno" | "almuerzo" | "cena" | "snack";

// --- Entidades de base de datos ---

export interface User {
  id: string;
  name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: Gender | null;
  activity_level: ActivityLevel | null;
  target_weight_kg: number | null;
  target_weeks: number | null;
  diet_type: DietType;
  max_carbs_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  saturated_fat_per_100g: number | null;
  created_at: string;
  updated_at: string;
}

export interface DailyMenuItem {
  id: string;
  user_id: string;
  food_id: string;
  date: string;
  grams: number;
  created_at: string;
  updated_at: string;
}

// Item del menu diario con los datos del alimento "joineados"
export interface DailyMenuItemWithFood extends DailyMenuItem {
  food: Food;
}

export interface WeeklyMenuItem {
  id: string;
  user_id: string;
  week_start: string;
  day_number: number; // 1..7
  food_id: string | null;
  food_name: string | null;
  grams: number | null;
  meal_type: MealType | null;
  created_at: string;
}

// --- Calculos nutricionales ---

export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  net_carbs_g: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  dailyDeficitOrSurplus: number;
  weeklyRateKg: number;
}

// --- Payloads de la API de escaneo ---

export interface ScanResult {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  sodium_per_100g: number;
  saturated_fat_per_100g: number;
  confidence: "high" | "medium" | "low";
  is_keto_friendly: boolean;
  notes?: string;
}

// --- Resultado de reestructuracion del menu ---

export interface RestructureItem {
  id: string;
  food_id: string;
  name: string;
  grams: number;
}

export interface RestructureResult {
  items: RestructureItem[];
  totals: MacroTotals;
  targets: MacroTargets;
  message: string;
}

// Respuesta estandar de la API
export interface ApiError {
  error: string;
  details?: unknown;
}
