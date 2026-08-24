export type KpiStatus = "ontarget" | "attention" | "critical" | "nodata";
export type KpiDirection = "higher_better" | "lower_better";

export interface Perspective { id: string; name: string; weight: number; ord: number; }
export interface Objective { id: string; perspective_id: string; name: string; ord: number; }
export interface Indicator { id: string; objective_id: string; name: string; unit: string; responsible: string | null; direction: KpiDirection; ord: number; }
export interface KpiValue { id: string; indicator_id: string; year: number; month: number; target: number | null; actual: number | null; }

export const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Performance de um indicador num mês (>=1 = no alvo). Respeita a direção.
export function performance(target: number | null, actual: number | null, direction: KpiDirection): number | null {
  if (target == null || actual == null) return null;
  if (direction === "higher_better") {
    if (target === 0) return actual >= 0 ? 1 : 0;
    return actual / target;
  } else {
    if (actual === 0) return target >= 0 ? 1.2 : 1;
    return target / actual;
  }
}

export function statusFromPerf(perf: number | null): KpiStatus {
  if (perf == null) return "nodata";
  if (perf >= 1) return "ontarget";
  if (perf >= 0.8) return "attention";
  return "critical";
}

export const STATUS_META: Record<KpiStatus, { label: string; className: string; bar: string }> = {
  ontarget: { label: "No alvo", className: "bg-kpi-ontarget/20 text-foreground", bar: "bg-kpi-ontarget" },
  attention: { label: "Atenção", className: "bg-kpi-attention/25 text-foreground", bar: "bg-kpi-attention" },
  critical: { label: "Crítico", className: "bg-kpi-critical/25 text-foreground", bar: "bg-kpi-critical" },
  nodata: { label: "Sem dados", className: "bg-muted text-muted-foreground", bar: "bg-kpi-nodata" },
};

// Último status de um indicador (mês mais recente com realizado)
export function indicatorLatestPerf(ind: Indicator, values: KpiValue[], year: number): number | null {
  const rows = values.filter((v) => v.indicator_id === ind.id && v.year === year && v.actual != null)
    .sort((a, b) => b.month - a.month);
  if (rows.length === 0) return null;
  return performance(rows[0].target, rows[0].actual, ind.direction);
}

// Meses (1-12) que possuem ao menos um realizado no ano — ordenados; param a lógica "até o último mês lançado"
export function monthsWithActual(values: KpiValue[], year: number): number[] {
  const set = new Set<number>();
  values.filter((v) => v.year === year && v.actual != null).forEach((v) => set.add(v.month));
  return Array.from(set).sort((a, b) => a - b);
}

// Índice global ponderado: média por objetivo -> média por perspectiva -> ponderado pelos pesos
export function globalHealth(
  perspectives: Perspective[], objectives: Objective[], indicators: Indicator[], values: KpiValue[], year: number
): number | null {
  let weightSum = 0, acc = 0, any = false;
  for (const p of perspectives) {
    const objs = objectives.filter((o) => o.perspective_id === p.id);
    const objScores: number[] = [];
    for (const o of objs) {
      const inds = indicators.filter((i) => i.objective_id === o.id);
      const indScores = inds.map((i) => indicatorLatestPerf(i, values, year)).filter((x): x is number => x != null);
      if (indScores.length) objScores.push(indScores.reduce((a, b) => a + b, 0) / indScores.length);
    }
    if (objScores.length) {
      const pScore = objScores.reduce((a, b) => a + b, 0) / objScores.length;
      acc += pScore * (p.weight || 1); weightSum += (p.weight || 1); any = true;
    }
  }
  if (!any || weightSum === 0) return null;
  return acc / weightSum;
}
