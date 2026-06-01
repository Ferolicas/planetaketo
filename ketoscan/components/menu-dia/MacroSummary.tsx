"use client";

import { Card } from "@/components/ui/card";
import type { MacroTargets, MacroTotals } from "@/types";
import { round0 } from "@/lib/utils";

interface Props {
  totals: MacroTotals;
  targets: MacroTargets | null;
}

export function MacroSummary({ totals, targets }: Props) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Calorías del día
          </p>
          <p className="text-2xl font-bold">
            {round0(totals.calories)}
            {targets && (
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {targets.calories} kcal
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Carbos netos</p>
          <p className="text-lg font-bold text-primary">
            {round0(totals.net_carbs_g)} g
          </p>
        </div>
      </div>

      <Bar
        label="Calorías"
        value={totals.calories}
        target={targets?.calories}
        unit="kcal"
        color="bg-primary"
      />
      <Bar
        label="Proteína"
        value={totals.protein_g}
        target={targets?.protein_g}
        unit="g"
        color="bg-keto-protein"
      />
      <Bar
        label="Carbohidratos"
        value={totals.carbs_g}
        target={targets?.carbs_g}
        unit="g"
        color="bg-keto-carbs"
      />
      <Bar
        label="Grasa"
        value={totals.fat_g}
        target={targets?.fat_g}
        unit="g"
        color="bg-keto-fat"
      />
    </Card>
  );
}

function Bar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target?: number;
  unit: string;
  color: string;
}) {
  const pct = target && target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = target ? value > target * 1.05 : false;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {round0(value)}
          {target != null && ` / ${round0(target)}`} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            over ? "bg-destructive" : color
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
