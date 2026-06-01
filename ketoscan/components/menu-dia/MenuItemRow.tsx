"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DailyMenuItemWithFood } from "@/types";
import { macrosForFood } from "@/lib/calculations/macros";
import { num, round0 } from "@/lib/utils";

interface Props {
  item: DailyMenuItemWithFood;
  onGramsChange: (id: string, grams: number) => void;
  onDelete: (id: string) => void;
}

export function MenuItemRow({ item, onGramsChange, onDelete }: Props) {
  const [grams, setGrams] = useState<string>(String(num(item.grams, 0)));

  // Mantener sincronizado cuando la reestructuracion cambia los gramos
  useEffect(() => {
    setGrams(String(num(item.grams, 0)));
  }, [item.grams]);

  const m = macrosForFood(item.food, num(item.grams, 0));

  function commit(raw: string) {
    const g = raw === "" ? 0 : parseFloat(raw);
    if (Number.isFinite(g) && g >= 0) onGramsChange(item.id, g);
  }

  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.food.name}</p>
        <p className="text-xs text-muted-foreground">
          {round0(m.calories)} kcal · P {round0(m.protein_g)} · C{" "}
          {round0(m.carbs_g)} · G {round0(m.fat_g)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="5"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          className="h-9 w-20 text-right"
          aria-label={`Gramos de ${item.food.name}`}
        />
        <span className="text-xs text-muted-foreground">g</span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label="Quitar del menu"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}
