import { Fragment, useMemo, useState } from "react";
import { Target, CheckCircle2, AlertTriangle, XCircle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/DataState";
import { formatNumberBR } from "@/lib/utils";
import { useKpiData } from "@/hooks/useKpi";
import { MESES, performance, statusFromPerf, STATUS_META, indicatorLatestPerf, monthsWithActual, globalHealth } from "@/lib/kpi";

const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

function HealthBar({ perf }: { perf: number | null }) {
  const pct = perf == null ? 0 : Math.min(100, Math.round(perf * 100));
  const st = statusFromPerf(perf);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted"><div className={`h-full ${STATUS_META[st].bar}`} style={{ width: `${pct}%` }} /></div>
      <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{perf == null ? "—" : `${pct}%`}</span>
    </div>
  );
}

export default function Painel() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { perspectives, objectives, indicators, values, isLoading, isError } = useKpiData(year);

  const persps = [...(perspectives.data ?? [])].sort((a, b) => a.ord - b.ord);
  const objs = objectives.data ?? [];
  const inds = indicators.data ?? [];
  const vals = values.data ?? [];

  const months = useMemo(() => monthsWithActual(vals, year), [vals, year]);
  const valMap = useMemo(() => {
    const m: Record<string, { target: number | null; actual: number | null }> = {};
    vals.forEach((v) => { m[`${v.indicator_id}-${v.month}`] = { target: v.target, actual: v.actual }; });
    return m;
  }, [vals]);

  const summary = useMemo(() => {
    let ontarget = 0, attention = 0, critical = 0;
    inds.forEach((i) => {
      const s = statusFromPerf(indicatorLatestPerf(i, vals, year));
      if (s === "ontarget") ontarget++; else if (s === "attention") attention++; else if (s === "critical") critical++;
    });
    return { total: inds.length, ontarget, attention, critical };
  }, [inds, vals, year]);

  const health = useMemo(() => globalHealth(persps, objs, inds, vals, year), [persps, objs, inds, vals, year]);
  const criticos = useMemo(() => inds.filter((i) => statusFromPerf(indicatorLatestPerf(i, vals, year)) === "critical"), [inds, vals, year]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;
  if (inds.length === 0) return <Card><CardContent><EmptyState text="Cadastre indicadores e lance resultados para ver o painel." /></CardContent></Card>;

  const cards = [
    { label: "Indicadores", value: summary.total, icon: Target, color: "text-primary" },
    { label: "No alvo", value: summary.ontarget, icon: CheckCircle2, color: "text-kpi-ontarget" },
    { label: "Atenção", value: summary.attention, icon: AlertTriangle, color: "text-kpi-attention" },
    { label: "Crítico", value: summary.critical, icon: XCircle, color: "text-kpi-critical" },
  ];
  const colCount = 2 + months.length * 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}><CardContent className="flex items-center gap-3 p-4">
            <c.icon className={`h-7 w-7 ${c.color}`} />
            <div><div className="font-display text-2xl font-bold">{c.value}</div><div className="text-xs text-muted-foreground">{c.label}</div></div>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardHeader><CardTitle>Saúde geral</CardTitle></CardHeader><CardContent><HealthBar perf={health} /></CardContent></Card>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {(["ontarget","attention","critical","nodata"] as const).map((s) => (
          <span key={s} className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded ${STATUS_META[s].bar}`} /> {STATUS_META[s].label}</span>
        ))}
      </div>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-semibold">Objetivo / Indicador</th>
                <th className="px-3 py-2 text-left font-semibold">Responsável</th>
                {months.map((m) => <th key={m} colSpan={2} className="border-l px-2 py-2 text-center font-semibold">{MESES[m - 1]}</th>)}
              </tr>
              {months.length > 0 && (
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-card"></th><th></th>
                  {months.map((m) => (
                    <Fragment key={m}><th className="border-l px-2 py-1">Meta</th><th className="px-2 py-1">Real</th></Fragment>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {persps.map((p) => {
                const pObjs = objs.filter((o) => o.perspective_id === p.id).sort((a, b) => a.ord - b.ord);
                return (
                  <Fragment key={p.id}>
                    <tr className="bg-secondary/40"><td colSpan={colCount} className="px-3 py-1.5 font-semibold text-primary">{p.name} · peso {p.weight}</td></tr>
                    {pObjs.map((o) => {
                      const oInds = inds.filter((i) => i.objective_id === o.id).sort((a, b) => a.ord - b.ord);
                      return (
                        <Fragment key={o.id}>
                          <tr><td colSpan={colCount} className="px-3 py-1 pl-6 text-xs font-medium text-muted-foreground">{o.name}</td></tr>
                          {oInds.map((i) => (
                            <tr key={i.id} className="border-b">
                              <td className="sticky left-0 z-10 bg-card px-3 py-1.5 pl-8 font-medium">{i.name}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{i.responsible || "—"}</td>
                              {months.map((m) => {
                                const c = valMap[`${i.id}-${m}`] ?? { target: null, actual: null };
                                const perf = performance(c.target, c.actual, i.direction);
                                const st = statusFromPerf(perf);
                                return (
                                  <Fragment key={m}>
                                    <td className="border-l px-2 py-1.5 text-right tabular-nums">{formatNumberBR(c.target, i.unit)}</td>
                                    <td className={`px-2 py-1.5 text-right tabular-nums ${c.actual != null ? STATUS_META[st].className : ""}`}>{formatNumberBR(c.actual, i.unit)}</td>
                                  </Fragment>
                                );
                              })}
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-gold" /> Ações Estratégicas</CardTitle></CardHeader>
        <CardContent>
          {criticos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum indicador em situação crítica.</p>
          ) : (
            <ul className="space-y-2">
              {criticos.map((i) => (
                <li key={i.id} className="flex items-start gap-2 rounded-lg border border-kpi-critical/30 bg-kpi-critical/5 p-3 text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-kpi-critical" />
                  <span><strong>{i.name}</strong> está crítico{i.responsible ? ` — responsável: ${i.responsible}` : ""}. Requer plano de ação.</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
