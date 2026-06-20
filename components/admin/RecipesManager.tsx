'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface Ingredient {
  quantity: string;
  item: string;
}
interface Nutrition {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  netCarbs: number | null;
}
interface AdminRecipe {
  video_id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  ingredients: Ingredient[];
  steps: string[];
  tips: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  nutrition: Nutrition | null;
  image_url: string | null;
  is_published: boolean;
  edited: boolean;
}

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none';

export default function RecipesManager() {
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminRecipe | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/recipes', { cache: 'no-store' });
      if (res.ok) setRecipes((await res.json()).recipes ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function toggle(r: AdminRecipe) {
    await fetch('/api/admin/recipes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', videoId: r.video_id, isPublished: !r.is_published }),
    });
    load();
  }

  const visibles = recipes.filter((r) => r.is_published).length;

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold text-gray-900">
        Recetas <span className="text-base font-normal text-gray-500">({visibles} visibles / {recipes.length})</span>
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Edita u oculta cualquier receta. Al editar, la IA ya no la sobreescribirá.
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {recipes.map((r) => (
            <div key={r.video_id} className="flex items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.image_url && <img src={r.image_url} alt="" className="h-12 w-20 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <a
                  href={`/recetas/${r.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-medium text-gray-900 hover:text-emerald-600"
                >
                  {r.title}
                </a>
                <p className="text-xs text-gray-500">
                  {r.category ?? '—'} · {r.ingredients.length} ingr · {r.steps.length} pasos
                  {r.edited ? ' · editada' : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  r.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {r.is_published ? 'Visible' : 'Oculta'}
              </span>
              <button
                onClick={() => setEditing(r)}
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                onClick={() => toggle(r)}
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                {r.is_published ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          recipe={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  recipe,
  onClose,
  onSaved,
}: {
  recipe: AdminRecipe;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [summary, setSummary] = useState(recipe.summary ?? '');
  const [category, setCategory] = useState(recipe.category ?? '');
  const [servings, setServings] = useState(recipe.servings?.toString() ?? '');
  const [prep, setPrep] = useState(recipe.prep_minutes?.toString() ?? '');
  const [cook, setCook] = useState(recipe.cook_minutes?.toString() ?? '');
  const [cal, setCal] = useState(recipe.nutrition?.calories?.toString() ?? '');
  const [prot, setProt] = useState(recipe.nutrition?.protein?.toString() ?? '');
  const [fat, setFat] = useState(recipe.nutrition?.fat?.toString() ?? '');
  const [carbs, setCarbs] = useState(recipe.nutrition?.netCarbs?.toString() ?? '');
  const [ingredients, setIngredients] = useState(
    recipe.ingredients.map((i) => `${i.quantity} | ${i.item}`).join('\n')
  );
  const [steps, setSteps] = useState(recipe.steps.join('\n'));
  const [tips, setTips] = useState(recipe.tips ?? '');
  const [isPublished, setIsPublished] = useState(recipe.is_published);
  const [saving, setSaving] = useState(false);

  const numOrNull = (s: string) => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  };

  async function save() {
    setSaving(true);
    const payload = {
      videoId: recipe.video_id,
      title: title.trim(),
      summary: summary.trim() || null,
      category: category.trim() || null,
      ingredients: ingredients
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const idx = l.indexOf('|');
          return idx >= 0
            ? { quantity: l.slice(0, idx).trim(), item: l.slice(idx + 1).trim() }
            : { quantity: '', item: l };
        }),
      steps: steps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      tips: tips.trim() || null,
      prepMinutes: numOrNull(prep),
      cookMinutes: numOrNull(cook),
      servings: numOrNull(servings),
      nutrition: {
        calories: numOrNull(cal),
        protein: numOrNull(prot),
        fat: numOrNull(fat),
        netCarbs: numOrNull(carbs),
      },
      isPublished,
    };
    const res = await fetch('/api/admin/recipes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert('Error al guardar la receta');
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900">Editar receta</h3>
        <div className="mt-4 space-y-3 text-sm">
          <Field label="Título">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} />
          </Field>
          <Field label="Resumen">
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={INPUT} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <input value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Raciones">
              <input value={servings} onChange={(e) => setServings(e.target.value)} className={INPUT} inputMode="numeric" />
            </Field>
            <Field label="Prep (min)">
              <input value={prep} onChange={(e) => setPrep(e.target.value)} className={INPUT} inputMode="numeric" />
            </Field>
            <Field label="Cocción (min)">
              <input value={cook} onChange={(e) => setCook(e.target.value)} className={INPUT} inputMode="numeric" />
            </Field>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Field label="Kcal">
              <input value={cal} onChange={(e) => setCal(e.target.value)} className={INPUT} inputMode="numeric" />
            </Field>
            <Field label="Prot">
              <input value={prot} onChange={(e) => setProt(e.target.value)} className={INPUT} inputMode="numeric" />
            </Field>
            <Field label="Grasa">
              <input value={fat} onChange={(e) => setFat(e.target.value)} className={INPUT} inputMode="numeric" />
            </Field>
            <Field label="Carbs">
              <input value={carbs} onChange={(e) => setCarbs(e.target.value)} className={INPUT} inputMode="numeric" />
            </Field>
          </div>
          <Field label="Ingredientes (uno por línea: «cantidad | ingrediente»)">
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={6}
              className={`${INPUT} font-mono text-xs`}
            />
          </Field>
          <Field label="Pasos (uno por línea)">
            <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={8} className={`${INPUT} text-xs`} />
          </Field>
          <Field label="Consejos">
            <textarea value={tips} onChange={(e) => setTips(e.target.value)} rows={2} className={INPUT} />
          </Field>
          <label className="flex items-center gap-2 text-gray-700">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Visible (publicada)
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
