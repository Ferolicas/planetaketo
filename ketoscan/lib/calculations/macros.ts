import type {
  DailyMenuItemWithFood,
  Food,
  MacroTargets,
  MacroTotals,
  User,
} from "@/types";
import { num } from "@/lib/utils";
import { calcTdee } from "./tdee";

// ============================================================
// Distribucion de macros y totales del menu
// ============================================================
// Calorias por gramo: proteina 4, carbos 4, grasa 9

const KCAL_PROTEIN = 4;
const KCAL_CARBS = 4;
const KCAL_FAT = 9;

/**
 * Calcula los objetivos de macros segun el tipo de dieta y las calorias objetivo.
 *
 * - keto:      carbos limitados por max_carbs_g (default 25g), proteina moderada
 *              (1.6 g/kg de peso), resto en grasa.
 * - low_carb:  ~20% carbos, 30% proteina, 50% grasa.
 * - normal:    ~45% carbos, 30% proteina, 25% grasa.
 */
export function calcMacroTargets(user: Partial<User>): MacroTargets | null {
  const tdee = calcTdee(user);
  if (!tdee) return null;

  const calories = tdee.targetCalories;
  const dietType = user.diet_type ?? "keto";
  const weight = num(user.weight_kg, 70);

  if (dietType === "keto") {
    const carbs_g = user.max_carbs_g && user.max_carbs_g > 0 ? user.max_carbs_g : 25;
    const protein_g = Math.round(weight * 1.6);
    const carbsKcal = carbs_g * KCAL_CARBS;
    const proteinKcal = protein_g * KCAL_PROTEIN;
    const fatKcal = Math.max(0, calories - carbsKcal - proteinKcal);
    const fat_g = Math.round(fatKcal / KCAL_FAT);
    return { calories, protein_g, carbs_g, fat_g };
  }

  if (dietType === "low_carb") {
    return macrosFromPercent(calories, 0.3, 0.2, 0.5);
  }

  // normal
  return macrosFromPercent(calories, 0.3, 0.45, 0.25);
}

function macrosFromPercent(
  calories: number,
  pProtein: number,
  pCarbs: number,
  pFat: number
): MacroTargets {
  return {
    calories,
    protein_g: Math.round((calories * pProtein) / KCAL_PROTEIN),
    carbs_g: Math.round((calories * pCarbs) / KCAL_CARBS),
    fat_g: Math.round((calories * pFat) / KCAL_FAT),
  };
}

// Macros de un alimento para una cantidad concreta de gramos
export function macrosForFood(food: Food, grams: number): MacroTotals {
  const factor = grams / 100;
  const carbs = num(food.carbs_per_100g) * factor;
  const fiber = num(food.fiber_per_100g) * factor;
  return {
    calories: num(food.calories_per_100g) * factor,
    protein_g: num(food.protein_per_100g) * factor,
    carbs_g: carbs,
    fat_g: num(food.fat_per_100g) * factor,
    fiber_g: fiber,
    net_carbs_g: Math.max(0, carbs - fiber),
  };
}

// Suma de macros de una lista de items del menu diario
export function sumMenuMacros(items: DailyMenuItemWithFood[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, item) => {
      const m = macrosForFood(item.food, num(item.grams, 0));
      acc.calories += m.calories;
      acc.protein_g += m.protein_g;
      acc.carbs_g += m.carbs_g;
      acc.fat_g += m.fat_g;
      acc.fiber_g += m.fiber_g;
      acc.net_carbs_g += m.net_carbs_g;
      return acc;
    },
    {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      net_carbs_g: 0,
    }
  );
}

// Porcentaje de macros (por calorias) para graficos
export function macroPercentages(totals: MacroTotals): {
  protein: number;
  carbs: number;
  fat: number;
} {
  const pKcal = totals.protein_g * KCAL_PROTEIN;
  const cKcal = totals.carbs_g * KCAL_CARBS;
  const fKcal = totals.fat_g * KCAL_FAT;
  const sum = pKcal + cKcal + fKcal;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((pKcal / sum) * 100),
    carbs: Math.round((cKcal / sum) * 100),
    fat: Math.round((fKcal / sum) * 100),
  };
}
