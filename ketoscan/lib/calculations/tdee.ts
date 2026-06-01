import type { ActivityLevel, Gender, TdeeResult, User } from "@/types";

// ============================================================
// Calculo de TDEE (Total Daily Energy Expenditure)
// Ecuacion de Mifflin-St Jeor
// ============================================================

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // poco o ningun ejercicio
  light: 1.375, // ejercicio ligero 1-3 dias/semana
  moderate: 1.55, // ejercicio moderado 3-5 dias/semana
  active: 1.725, // ejercicio fuerte 6-7 dias/semana
  very_active: 1.9, // ejercicio muy fuerte / trabajo fisico
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentario (oficina, poco movimiento)",
  light: "Ligero (1-3 dias/semana)",
  moderate: "Moderado (3-5 dias/semana)",
  active: "Activo (6-7 dias/semana)",
  very_active: "Muy activo (atleta / trabajo fisico)",
};

// 1 kg de grasa corporal ~ 7700 kcal
const KCAL_PER_KG = 7700;

export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/**
 * Calcula BMR, TDEE y las calorias objetivo segun la meta de peso.
 * Si target_weight/target_weeks no estan definidos, mantiene el TDEE.
 * Limita el deficit/superavit a un rango seguro (-25% .. +20% del TDEE)
 * y nunca baja de un piso minimo de calorias.
 */
export function calcTdee(user: Partial<User>): TdeeResult | null {
  const weight = user.weight_kg ?? null;
  const height = user.height_cm ?? null;
  const age = user.age ?? null;
  const gender = (user.gender as Gender) ?? null;
  const activity = (user.activity_level as ActivityLevel) ?? "sedentary";

  if (!weight || !height || !age || !gender) {
    return null;
  }

  const bmr = calcBMR(weight, height, age, gender);
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activity] ?? 1.2);

  let dailyDelta = 0;
  let weeklyRateKg = 0;

  if (user.target_weight_kg && user.target_weeks && user.target_weeks > 0) {
    const deltaKg = user.target_weight_kg - weight; // negativo = perder
    weeklyRateKg = deltaKg / user.target_weeks;
    const totalKcal = deltaKg * KCAL_PER_KG;
    dailyDelta = totalKcal / (user.target_weeks * 7);
  }

  // Limites de seguridad
  const maxDeficit = -tdee * 0.25;
  const maxSurplus = tdee * 0.2;
  dailyDelta = Math.max(maxDeficit, Math.min(maxSurplus, dailyDelta));

  const floor = gender === "male" ? 1500 : 1200;
  const targetCalories = Math.max(floor, Math.round(tdee + dailyDelta));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    dailyDeficitOrSurplus: Math.round(dailyDelta),
    weeklyRateKg: Math.round(weeklyRateKg * 100) / 100,
  };
}
