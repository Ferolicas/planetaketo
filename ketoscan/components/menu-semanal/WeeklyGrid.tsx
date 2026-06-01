"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { WeeklyMenuItem } from "@/types";
import { DAY_NAMES, num, round0 } from "@/lib/utils";

interface Props {
  items: WeeklyMenuItem[];
}

const MEAL_ORDER = ["desayuno", "almuerzo", "cena", "snack"];

export function WeeklyGrid({ items }: Props) {
  const byDay = useMemo(() => {
    const map = new Map<number, WeeklyMenuItem[]>();
    for (let d = 1; d <= 7; d++) map.set(d, []);
    for (const it of items) {
      map.get(it.day_number)?.push(it);
    }
    // ordenar comidas dentro del dia
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          MEAL_ORDER.indexOf(a.meal_type ?? "") -
          MEAL_ORDER.indexOf(b.meal_type ?? "")
      );
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
        const meals = byDay.get(day) ?? [];
        return (
          <Card key={day} className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{DAY_NAMES[day - 1]}</h3>
              <span className="text-xs text-muted-foreground">
                {meals.length} comida{meals.length === 1 ? "" : "s"}
              </span>
            </div>
            {meals.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin asignar</p>
            ) : (
              <ul className="space-y-1.5">
                {meals.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.food_name}
                      </p>
                      {m.meal_type && (
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {m.meal_type}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {round0(num(m.grams))} g
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
