import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Redondea a 1 decimal
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Redondea a entero
export function round0(n: number): number {
  return Math.round(n);
}

// Convierte de forma segura un valor de pg (string | number | null) a number
export function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

// Fecha de hoy en formato YYYY-MM-DD (zona local)
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Lunes de la semana que contiene `date` (YYYY-MM-DD)
export function weekStartISO(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=domingo
  const diff = (day === 0 ? -6 : 1) - day; // mover a lunes
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];
