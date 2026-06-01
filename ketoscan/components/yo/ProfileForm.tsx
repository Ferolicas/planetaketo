"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Flame, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { ACTIVITY_LABELS } from "@/lib/calculations/tdee";
import type {
  ActivityLevel,
  DietType,
  Gender,
  MacroTargets,
  TdeeResult,
  User,
} from "@/types";
import { num } from "@/lib/utils";

interface ProfileResponse {
  profile: User | null;
  tdee: TdeeResult | null;
  targets: MacroTargets | null;
}

interface FormState {
  name: string;
  height_cm: string;
  weight_kg: string;
  age: string;
  gender: Gender | "";
  activity_level: ActivityLevel | "";
  target_weight_kg: string;
  target_weeks: string;
  diet_type: DietType;
  max_carbs_g: string;
}

const EMPTY: FormState = {
  name: "",
  height_cm: "",
  weight_kg: "",
  age: "",
  gender: "",
  activity_level: "",
  target_weight_kg: "",
  target_weeks: "",
  diet_type: "keto",
  max_carbs_g: "25",
};

function toForm(p: User | null): FormState {
  if (!p) return { ...EMPTY };
  return {
    name: p.name ?? "",
    height_cm: p.height_cm != null ? String(num(p.height_cm)) : "",
    weight_kg: p.weight_kg != null ? String(num(p.weight_kg)) : "",
    age: p.age != null ? String(p.age) : "",
    gender: (p.gender as Gender) ?? "",
    activity_level: (p.activity_level as ActivityLevel) ?? "",
    target_weight_kg:
      p.target_weight_kg != null ? String(num(p.target_weight_kg)) : "",
    target_weeks: p.target_weeks != null ? String(p.target_weeks) : "",
    diet_type: p.diet_type ?? "keto",
    max_carbs_g: p.max_carbs_g != null ? String(p.max_carbs_g) : "25",
  };
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function ProfileForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tdee, setTdee] = useState<TdeeResult | null>(null);
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ProfileResponse>("/api/profile")
      .then((r) => {
        setForm(toForm(r.profile));
        setTdee(r.tdee);
        setTargets(r.targets);
      })
      .catch(() => setMsg("No se pudo cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        name: form.name.trim() || null,
        height_cm: numOrNull(form.height_cm),
        weight_kg: numOrNull(form.weight_kg),
        age: numOrNull(form.age),
        gender: form.gender || null,
        activity_level: form.activity_level || null,
        target_weight_kg: numOrNull(form.target_weight_kg),
        target_weeks: numOrNull(form.target_weeks),
        diet_type: form.diet_type,
        max_carbs_g: numOrNull(form.max_carbs_g),
      };
      const res = await api.put<ProfileResponse>("/api/profile", payload);
      setTdee(res.tdee);
      setTargets(res.targets);
      setMsg("Perfil guardado ✓");
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {(tdee || targets) && (
        <Card className="grid grid-cols-2 gap-3 bg-accent/40 p-4">
          <Result
            icon={<Flame className="h-4 w-4" />}
            label="TDEE"
            value={tdee ? `${tdee.tdee} kcal` : "—"}
          />
          <Result
            icon={<Target className="h-4 w-4" />}
            label="Objetivo"
            value={tdee ? `${tdee.targetCalories} kcal` : "—"}
          />
          {targets && (
            <div className="col-span-2 grid grid-cols-3 gap-2 border-t pt-3 text-center text-sm">
              <Macro label="Proteína" value={`${targets.protein_g} g`} />
              <Macro label="Carbos" value={`${targets.carbs_g} g`} />
              <Macro label="Grasa" value={`${targets.fat_g} g`} />
            </div>
          )}
          {tdee && tdee.weeklyRateKg !== 0 && (
            <p className="col-span-2 text-center text-xs text-muted-foreground">
              Ritmo estimado: {tdee.weeklyRateKg > 0 ? "+" : ""}
              {tdee.weeklyRateKg} kg/semana
            </p>
          )}
        </Card>
      )}

      <Card className="space-y-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Tu nombre"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Altura (cm)">
            <Input
              type="number"
              inputMode="decimal"
              value={form.height_cm}
              onChange={(e) => set("height_cm", e.target.value)}
            />
          </Field>
          <Field label="Peso (kg)">
            <Input
              type="number"
              inputMode="decimal"
              value={form.weight_kg}
              onChange={(e) => set("weight_kg", e.target.value)}
            />
          </Field>
          <Field label="Edad">
            <Input
              type="number"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
            />
          </Field>
          <Field label="Sexo">
            <Select
              value={form.gender || undefined}
              onValueChange={(v) => set("gender", v as Gender)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Hombre</SelectItem>
                <SelectItem value="female">Mujer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Nivel de actividad">
          <Select
            value={form.activity_level || undefined}
            onValueChange={(v) => set("activity_level", v as ActivityLevel)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Elegir nivel" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {ACTIVITY_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Objetivo</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso objetivo (kg)">
            <Input
              type="number"
              inputMode="decimal"
              value={form.target_weight_kg}
              onChange={(e) => set("target_weight_kg", e.target.value)}
            />
          </Field>
          <Field label="En (semanas)">
            <Input
              type="number"
              inputMode="numeric"
              value={form.target_weeks}
              onChange={(e) => set("target_weeks", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Tipo de dieta">
          <Select
            value={form.diet_type}
            onValueChange={(v) => set("diet_type", v as DietType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keto">Keto</SelectItem>
              <SelectItem value="low_carb">Low carb</SelectItem>
              <SelectItem value="normal">Normal / balanceada</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {form.diet_type !== "normal" && (
          <Field label="Máx. carbohidratos al día (g)">
            <Input
              type="number"
              inputMode="numeric"
              value={form.max_carbs_g}
              onChange={(e) => set("max_carbs_g", e.target.value)}
            />
          </Field>
        )}
      </Card>

      {msg && (
        <p
          className={`text-center text-sm ${
            msg.includes("✓") ? "text-primary" : "text-destructive"
          }`}
        >
          {msg}
        </p>
      )}

      <Button type="submit" disabled={saving} className="h-12 w-full">
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        Guardar perfil
      </Button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Result({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
