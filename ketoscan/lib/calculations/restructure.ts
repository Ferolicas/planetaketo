import type {
  DailyMenuItemWithFood,
  DietType,
  MacroTargets,
  RestructureItem,
  RestructureResult,
} from "@/types";
import { num, round0 } from "@/lib/utils";
import { macrosForFood, sumMenuMacros } from "./macros";

// ============================================================
// Reestructuracion del menu diario
// ============================================================
// Ajusta los GRAMOS de cada alimento (sin agregar ni quitar alimentos)
// para acercar los macros del dia a los objetivos del usuario.
//
// Metodo: minimos cuadrados ponderados resueltos por descenso por
// coordenadas. Es determinista, rapido y corre en el cliente.

interface Bounds {
  min: number;
  max: number;
}

const DEFAULT_BOUNDS: Bounds = { min: 0, max: 600 };

// Coeficientes (por gramo) de cada alimento
interface Coef {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

function coefForItem(item: DailyMenuItemWithFood): Coef {
  const m = macrosForFood(item.food, 100);
  return {
    cal: m.calories / 100,
    protein: m.protein_g / 100,
    carbs: m.carbs_g / 100,
    fat: m.fat_g / 100,
  };
}

export function restructureMenu(
  items: DailyMenuItemWithFood[],
  targets: MacroTargets,
  dietType: DietType = "keto",
  bounds: Bounds = DEFAULT_BOUNDS
): RestructureResult {
  const n = items.length;

  if (n === 0) {
    return {
      items: [],
      totals: sumMenuMacros([]),
      targets,
      message: "No hay alimentos en el menu para reestructurar.",
    };
  }

  const coefs = items.map(coefForItem);

  // Para keto apuntamos un poco por debajo del limite de carbos.
  const carbTarget =
    dietType === "keto" ? Math.max(5, targets.carbs_g * 0.8) : targets.carbs_g;

  // Pesos: normalizados por el cuadrado del objetivo para que cada macro
  // pese de forma comparable. Carbos pesa mas en keto.
  const macroKeys = ["cal", "protein", "carbs", "fat"] as const;
  type MacroKey = (typeof macroKeys)[number];

  const targetByKey: Record<MacroKey, number> = {
    cal: targets.calories,
    protein: targets.protein_g,
    carbs: carbTarget,
    fat: targets.fat_g,
  };

  const weightByKey: Record<MacroKey, number> = {
    cal: 1 / Math.max(1, targets.calories) ** 2,
    protein: 1.5 / Math.max(1, targets.protein_g) ** 2,
    carbs: (dietType === "keto" ? 4 : 1) / Math.max(1, carbTarget) ** 2,
    fat: 1 / Math.max(1, targets.fat_g) ** 2,
  };

  // Estado inicial: gramos actuales
  const x = items.map((it) => clamp(num(it.grams, 100), bounds));

  // Totales actuales por macro
  const totals: Record<MacroKey, number> = { cal: 0, protein: 0, carbs: 0, fat: 0 };
  const recompute = () => {
    for (const k of macroKeys) totals[k] = 0;
    for (let i = 0; i < n; i++) {
      totals.cal += x[i] * coefs[i].cal;
      totals.protein += x[i] * coefs[i].protein;
      totals.carbs += x[i] * coefs[i].carbs;
      totals.fat += x[i] * coefs[i].fat;
    }
  };
  recompute();

  // Descenso por coordenadas
  const ITERATIONS = 250;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let j = 0; j < n; j++) {
      const a = coefs[j];
      const aByKey: Record<MacroKey, number> = {
        cal: a.cal,
        protein: a.protein,
        carbs: a.carbs,
        fat: a.fat,
      };

      let numerator = 0;
      let denominator = 0;
      for (const k of macroKeys) {
        const ak = aByKey[k];
        if (ak === 0) continue;
        const w = weightByKey[k];
        const partial = totals[k] - x[j] * ak; // total sin el item j
        numerator += w * ak * (targetByKey[k] - partial);
        denominator += w * ak * ak;
      }

      if (denominator <= 0) continue; // alimento sin macros utiles
      const newX = clamp(numerator / denominator, bounds);

      // Actualizar totales con el delta
      const delta = newX - x[j];
      if (delta !== 0) {
        totals.cal += delta * a.cal;
        totals.protein += delta * a.protein;
        totals.carbs += delta * a.carbs;
        totals.fat += delta * a.fat;
        x[j] = newX;
      }
    }
  }

  // Redondear a multiplos de 5g y reconstruir items
  const resultItems: RestructureItem[] = items.map((it, i) => ({
    id: it.id,
    food_id: it.food_id,
    name: it.food.name,
    grams: roundTo5(x[i]),
  }));

  // Totales finales con los gramos redondeados
  const finalMenu: DailyMenuItemWithFood[] = items.map((it, i) => ({
    ...it,
    grams: resultItems[i].grams,
  }));
  const finalTotals = sumMenuMacros(finalMenu);

  return {
    items: resultItems,
    totals: finalTotals,
    targets,
    message: buildMessage(finalTotals.calories, targets.calories, dietType, finalTotals.net_carbs_g, targets.carbs_g),
  };
}

function clamp(v: number, b: Bounds): number {
  return Math.max(b.min, Math.min(b.max, v));
}

function roundTo5(v: number): number {
  return Math.max(0, round0(v / 5) * 5);
}

function buildMessage(
  cal: number,
  targetCal: number,
  dietType: DietType,
  netCarbs: number,
  maxCarbs: number
): string {
  const diff = round0(cal - targetCal);
  const sign = diff > 0 ? "+" : "";
  let msg = `Menu ajustado: ${round0(cal)} kcal (${sign}${diff} vs objetivo).`;
  if (dietType === "keto") {
    const ok = netCarbs <= maxCarbs;
    msg += ` Carbos netos: ${round0(netCarbs)}g ${ok ? "(dentro del limite keto)" : "(revisa, sobre el limite)"}.`;
  }
  return msg;
}
