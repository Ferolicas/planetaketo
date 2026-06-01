"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2, Trash2, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeeklyGrid } from "@/components/menu-semanal/WeeklyGrid";
import { api } from "@/lib/api-client";
import { weekStartISO, DAY_NAMES } from "@/lib/utils";
import type { WeeklyMenuItem } from "@/types";

interface WeeklyResponse {
  week_start: string;
  items: WeeklyMenuItem[];
}

export default function MenuSemanalPage() {
  const [weekStart] = useState(weekStartISO());
  const [items, setItems] = useState<WeeklyMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<WeeklyResponse>(
        `/api/weekly-menu?week_start=${weekStart}`
      );
      setItems(res.items);
    } catch {
      setError("No se pudo cargar el menú semanal");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post<WeeklyResponse>("/api/generate-menu", {
        week_start: weekStart,
        days: 7,
        meals_per_day: 4,
      });
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el menú");
    } finally {
      setGenerating(false);
    }
  }

  async function clearWeek() {
    if (!confirm("¿Borrar el menú de esta semana?")) return;
    try {
      await api.del(`/api/weekly-menu?week_start=${weekStart}`);
      setItems([]);
    } catch {
      setError("No se pudo borrar el menú");
    }
  }

  const weekLabel = `${DAY_NAMES[0]} ${weekStart}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Menú semanal</h1>
          <p className="text-xs text-muted-foreground">
            Semana del {weekLabel}
          </p>
        </div>
        {items.length > 0 && (
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={clearWeek}
            aria-label="Borrar semana"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Button onClick={generate} disabled={generating} className="h-12 w-full">
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Generando con IA...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {items.length > 0 ? "Regenerar menú" : "Generar menú keto"}
          </>
        )}
      </Button>

      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <CalendarRange className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Genera un plan semanal a partir de tus alimentos y objetivos.
          </p>
        </div>
      ) : (
        <WeeklyGrid items={items} />
      )}
    </div>
  );
}
