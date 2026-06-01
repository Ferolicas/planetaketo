"use client";

import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restructureMenu } from "@/lib/calculations/restructure";
import { api } from "@/lib/api-client";
import type {
  DailyMenuItemWithFood,
  DietType,
  MacroTargets,
} from "@/types";

interface Props {
  items: DailyMenuItemWithFood[];
  targets: MacroTargets | null;
  dietType: DietType;
  date: string;
  onDone: (message: string) => void;
  disabled?: boolean;
}

export function RestructureButton({
  items,
  targets,
  dietType,
  date,
  onDone,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!targets || items.length === 0) return;
    setLoading(true);
    try {
      // Optimizacion local (deterministica)
      const result = restructureMenu(items, targets, dietType);

      // Persistir los nuevos gramos en lote
      await api.patch("/api/daily-menu", {
        date,
        updates: result.items.map((i) => ({ id: i.id, grams: i.grams })),
      });

      onDone(result.message);
    } catch (e) {
      onDone(
        e instanceof Error ? e.message : "No se pudo reestructurar el menú"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading || !targets || items.length === 0}
      className="w-full"
      variant="default"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Wand2 className="h-5 w-5" />
      )}
      Reestructurar para cuadrar macros
    </Button>
  );
}
