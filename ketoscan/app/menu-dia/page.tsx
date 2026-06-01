"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MacroSummary } from "@/components/menu-dia/MacroSummary";
import { MenuItemRow } from "@/components/menu-dia/MenuItemRow";
import { FoodSelector } from "@/components/menu-dia/FoodSelector";
import { RestructureButton } from "@/components/menu-dia/RestructureButton";
import { api } from "@/lib/api-client";
import { sumMenuMacros } from "@/lib/calculations/macros";
import { todayISO } from "@/lib/utils";
import type {
  DailyMenuItemWithFood,
  DietType,
  MacroTargets,
} from "@/types";

interface DailyResponse {
  date: string;
  items: DailyMenuItemWithFood[];
  totals: unknown;
  targets: MacroTargets | null;
}

export default function MenuDiaPage() {
  const [date] = useState(todayISO());
  const [items, setItems] = useState<DailyMenuItemWithFood[]>([]);
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [dietType, setDietType] = useState<DietType>("keto");
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menu, prof] = await Promise.all([
        api.get<DailyResponse>(`/api/daily-menu?date=${date}`),
        api.get<{ profile: { diet_type?: DietType } | null }>("/api/profile"),
      ]);
      setItems(menu.items);
      setTargets(menu.targets);
      setDietType(prof.profile?.diet_type ?? "keto");
    } catch {
      setToast("No se pudo cargar el menú del día");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => sumMenuMacros(items), [items]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((c) => (c === msg ? null : c)), 3500);
  }

  async function handleAdd(foodId: string, grams: number) {
    await api.post("/api/daily-menu", { food_id: foodId, grams, date });
    await load();
  }

  function handleGramsChange(id: string, grams: number) {
    // Optimista: actualizar UI y persistir
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, grams } : it))
    );
    api.patch(`/api/daily-menu/${id}`, { grams }).catch(() => {
      flash("No se pudo guardar el cambio");
      load();
    });
  }

  async function handleDelete(id: string) {
    const prev = items;
    setItems((it) => it.filter((x) => x.id !== id));
    try {
      await api.del(`/api/daily-menu/${id}`);
    } catch {
      setItems(prev);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Menú de hoy</h1>
        <Button size="sm" onClick={() => setSelectorOpen(true)}>
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <MacroSummary totals={totals} targets={targets} />

          {!targets && (
            <p className="rounded-md bg-accent p-3 text-xs text-accent-foreground">
              Completa tu perfil en la pestaña <strong>Yo</strong> para ver tus
              objetivos de macros.
            </p>
          )}

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <UtensilsCrossed className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aún no agregaste alimentos a hoy.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  onGramsChange={handleGramsChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {items.length > 0 && (
            <RestructureButton
              items={items}
              targets={targets}
              dietType={dietType}
              date={date}
              onDone={(msg) => {
                flash(msg);
                load();
              }}
            />
          )}
        </>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto max-w-[440px] px-4">
          <div className="rounded-lg bg-foreground px-4 py-3 text-center text-sm font-medium text-background shadow-lg">
            {toast}
          </div>
        </div>
      )}

      <FoodSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onAdd={handleAdd}
      />
    </div>
  );
}
