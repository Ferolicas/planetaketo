"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ScanLine, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FoodCard } from "@/components/alimentos/FoodCard";
import { FoodForm } from "@/components/alimentos/FoodForm";
import { ScanModal } from "@/components/alimentos/ScanModal";
import { api } from "@/lib/api-client";
import type { Food, ScanResult } from "@/types";

export default function AlimentosPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [prefill, setPrefill] = useState<Partial<Food> | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{ foods: Food[] }>("/api/foods");
      setFoods(res.foods);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((f) => f.name.toLowerCase().includes(q));
  }, [foods, search]);

  function openNew() {
    setEditing(null);
    setPrefill(null);
    setFormOpen(true);
  }

  function openEdit(food: Food) {
    setEditing(food);
    setPrefill(food);
    setFormOpen(true);
  }

  function handleScanned(result: ScanResult) {
    setEditing(null);
    setPrefill({
      name: result.name,
      calories_per_100g: result.calories_per_100g,
      protein_per_100g: result.protein_per_100g,
      carbs_per_100g: result.carbs_per_100g,
      fat_per_100g: result.fat_per_100g,
      fiber_per_100g: result.fiber_per_100g,
      sugar_per_100g: result.sugar_per_100g,
      sodium_per_100g: result.sodium_per_100g,
      saturated_fat_per_100g: result.saturated_fat_per_100g,
    });
    setFormOpen(true);
  }

  function handleSaved(food: Food) {
    setFoods((prev) => {
      const exists = prev.some((f) => f.id === food.id);
      const next = exists
        ? prev.map((f) => (f.id === food.id ? food : f))
        : [...prev, food];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async function handleDelete(food: Food) {
    if (!confirm(`¿Eliminar "${food.name}"?`)) return;
    const prev = foods;
    setFoods((f) => f.filter((x) => x.id !== food.id));
    try {
      await api.del(`/api/foods/${food.id}`);
    } catch {
      setFoods(prev); // revertir
    }
  }

  async function handleAddToMenu(food: Food) {
    try {
      await api.post("/api/daily-menu", { food_id: food.id, grams: 100 });
      setAdded(food.id);
      setTimeout(() => setAdded((c) => (c === food.id ? null : c)), 1500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo agregar al menu");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mis alimentos</h1>
        <span className="text-sm text-muted-foreground">{foods.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => setScanOpen(true)} className="h-12">
          <ScanLine className="h-5 w-5" /> Escanear
        </Button>
        <Button onClick={openNew} variant="secondary" className="h-12">
          <Plus className="h-5 w-5" /> Manual
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alimento..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : err ? (
        <p className="py-8 text-center text-sm text-destructive">{err}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {foods.length === 0
              ? "Aún no tienes alimentos. Escanea uno para empezar 🥑"
              : "Sin resultados para tu búsqueda."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((food) => (
            <div key={food.id} className="relative">
              <FoodCard
                food={food}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAddToMenu={handleAddToMenu}
              />
              {added === food.id && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  <Check className="h-3 w-3" /> Agregado
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <FoodForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={prefill}
        editingId={editing?.id ?? null}
        onSaved={handleSaved}
      />
      <ScanModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        onScanned={handleScanned}
      />
    </div>
  );
}
