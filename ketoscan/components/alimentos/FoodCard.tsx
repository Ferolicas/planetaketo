"use client";

import { Pencil, Trash2, Plus, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Food } from "@/types";
import { num, round0, round1 } from "@/lib/utils";

interface Props {
  food: Food;
  onEdit?: (food: Food) => void;
  onDelete?: (food: Food) => void;
  onAddToMenu?: (food: Food) => void;
}

export function FoodCard({ food, onEdit, onDelete, onAddToMenu }: Props) {
  const carbs = num(food.carbs_per_100g);
  const fiber = num(food.fiber_per_100g);
  const netCarbs = Math.max(0, carbs - fiber);
  const isKeto = netCarbs <= 10;

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold">{food.name}</h3>
            {isKeto && (
              <span
                title="Apto keto"
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground"
              >
                <Leaf className="h-3 w-3" /> keto
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {round0(num(food.calories_per_100g))} kcal · por 100g
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {onAddToMenu && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => onAddToMenu(food)}
              aria-label="Agregar al menu"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(food)}
              aria-label="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(food)}
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1 text-center">
        <Macro label="Prot" value={round1(num(food.protein_per_100g))} color="text-keto-protein" />
        <Macro label="Carbs" value={round1(carbs)} color="text-keto-carbs" />
        <Macro label="Grasa" value={round1(num(food.fat_per_100g))} color="text-keto-fat" />
        <Macro label="Netos" value={round1(netCarbs)} color="text-primary" />
      </div>
    </Card>
  );
}

function Macro({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-md bg-muted/60 py-1.5">
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
