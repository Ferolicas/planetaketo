"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { Food } from "@/types";
import { num, round0 } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (foodId: string, grams: number) => Promise<void> | void;
}

export function FoodSelector({ open, onOpenChange, onAdd }: Props) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState("100");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setSearch("");
    setGrams("100");
    setLoading(true);
    api
      .get<{ foods: Food[] }>("/api/foods")
      .then((r) => setFoods(r.foods))
      .catch(() => setFoods([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods;
  }, [foods, search]);

  async function confirmAdd() {
    if (!selected) return;
    const g = parseFloat(grams);
    if (!Number.isFinite(g) || g <= 0) return;
    setAdding(true);
    try {
      await onAdd(selected.id, g);
      onOpenChange(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>Agregar al menú</DialogTitle>
          <DialogDescription>
            Elige un alimento y la cantidad en gramos.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>

        <div className="-mx-1 max-h-56 space-y-1.5 overflow-y-auto px-1">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay alimentos. Agrégalos en la pestaña Alimentos.
            </p>
          ) : (
            filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selected?.id === f.id
                    ? "border-primary bg-accent"
                    : "hover:bg-muted"
                }`}
              >
                <span className="truncate font-medium">{f.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {round0(num(f.calories_per_100g))} kcal
                </span>
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="flex items-end gap-2 border-t pt-3">
            <div className="flex-1">
              <label className="text-xs font-medium" htmlFor="sel-grams">
                Gramos de {selected.name}
              </label>
              <Input
                id="sel-grams"
                type="number"
                inputMode="decimal"
                min="1"
                step="5"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
              />
            </div>
            <Button onClick={confirmAdd} disabled={adding}>
              {adding ? "..." : "Agregar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
