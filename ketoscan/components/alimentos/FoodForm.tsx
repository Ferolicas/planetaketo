"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import type { Food } from "@/types";
import { num } from "@/lib/utils";

export interface FoodFormValues {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  sodium_per_100g: number;
  saturated_fat_per_100g: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // food existente (editar) o valores parciales (prefill desde escaneo)
  initial?: Partial<Food> | null;
  editingId?: string | null;
  onSaved: (food: Food) => void;
}

const EMPTY: FoodFormValues = {
  name: "",
  calories_per_100g: 0,
  protein_per_100g: 0,
  carbs_per_100g: 0,
  fat_per_100g: 0,
  fiber_per_100g: 0,
  sugar_per_100g: 0,
  sodium_per_100g: 0,
  saturated_fat_per_100g: 0,
};

function fromInitial(initial?: Partial<Food> | null): FoodFormValues {
  if (!initial) return { ...EMPTY };
  return {
    name: initial.name ?? "",
    calories_per_100g: num(initial.calories_per_100g),
    protein_per_100g: num(initial.protein_per_100g),
    carbs_per_100g: num(initial.carbs_per_100g),
    fat_per_100g: num(initial.fat_per_100g),
    fiber_per_100g: num(initial.fiber_per_100g),
    sugar_per_100g: num(initial.sugar_per_100g),
    sodium_per_100g: num(initial.sodium_per_100g),
    saturated_fat_per_100g: num(initial.saturated_fat_per_100g),
  };
}

export function FoodForm({
  open,
  onOpenChange,
  initial,
  editingId,
  onSaved,
}: Props) {
  const [values, setValues] = useState<FoodFormValues>(fromInitial(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(fromInitial(initial));
      setError(null);
    }
  }, [open, initial]);

  function set<K extends keyof FoodFormValues>(key: K, raw: string) {
    setValues((v) => ({
      ...v,
      [key]: key === "name" ? raw : raw === "" ? 0 : parseFloat(raw),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = values;
      const res = editingId
        ? await api.put<{ food: Food }>(`/api/foods/${editingId}`, payload)
        : await api.post<{ food: Food }>("/api/foods", payload);
      onSaved(res.food);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Editar alimento" : "Nuevo alimento"}
          </DialogTitle>
          <DialogDescription>Valores por cada 100 g.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Pechuga de pollo"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField id="calories_per_100g" label="Calorias (kcal)" value={values.calories_per_100g} onChange={set} />
            <NumField id="protein_per_100g" label="Proteina (g)" value={values.protein_per_100g} onChange={set} />
            <NumField id="carbs_per_100g" label="Carbohidratos (g)" value={values.carbs_per_100g} onChange={set} />
            <NumField id="fat_per_100g" label="Grasa (g)" value={values.fat_per_100g} onChange={set} />
            <NumField id="fiber_per_100g" label="Fibra (g)" value={values.fiber_per_100g} onChange={set} />
            <NumField id="sugar_per_100g" label="Azucar (g)" value={values.sugar_per_100g} onChange={set} />
            <NumField id="saturated_fat_per_100g" label="Grasa sat. (g)" value={values.saturated_fat_per_100g} onChange={set} />
            <NumField id="sodium_per_100g" label="Sodio (mg)" value={values.sodium_per_100g} onChange={set} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NumField({
  id,
  label,
  value,
  onChange,
}: {
  id: keyof FoodFormValues;
  label: string;
  value: number;
  onChange: <K extends keyof FoodFormValues>(key: K, raw: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={String(id)} className="text-xs">
        {label}
      </Label>
      <Input
        id={String(id)}
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(id, e.target.value)}
      />
    </div>
  );
}
