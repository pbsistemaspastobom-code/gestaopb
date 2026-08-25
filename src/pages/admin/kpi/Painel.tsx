import { Fragment, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Users, Zap, XCircle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/DataState";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumberBR, cn } from "@/lib/utils";
import { useKpiData } from "@/hooks/useKpi";
import { MESES, performance, statusFromPerf, indicatorLatestPerf, monthsWithActual } from "@/lib/kpi";

const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];
const STATUS_COLOR: Record<string, string> = {
  ontarget: "text-kpi-ontarget", attention: "text-kpi-attention", critical: "text-kpi-critical", nodata: "text-muted-foreground",
};

export default function Painel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
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

  const perfInMonth = (indId: string, dir: any) => {
    const c = valMap[`${indId}-${month}`];
    return c ? performance(c.target, c.actual, dir) : null;
  };

  const summary = useMemo(() => {
    let ontarget = 0, attention = 0, critical = 0, comDados = 0;
    inds.forEach((i) => {
      const p = perfInMonth(i.id, i.direction);
      if (p == null) return;
      comDados++;
      const s = statusFromPerf(p);
      if (s === "ontarget") ontarget++; else if (s === "attention") attention++; else critical++;
    });
    return { total: inds.length, ontarget, attention, critical, comDados };
  }, [inds, valMap, month]);

  const pct = (n: number) => (summary.total ? Math.round((n / summary.total) * 100) : 0);
  const healthMonth = useMemo(() => {
    let w = 0, acc = 0, any = false;
    for (const p of persps) {
      const os = objs.filter((o) => o.perspective_id === p.id);
      const objScores: number[] = [];
      for (const o of os) {
        const is = inds.filter((i) => i.objective_id === o.id);
        const s = is.map((i) => perfInMonth(i.id, i.direction)).filter((x): x is number => x != null);
        if (s.length) objScores.push(s.reduce((a, b) => a + b, 0) / s.length);
      }
      if (objScores.length) { acc += (objScores.reduce((a, b) => a + b, 0) / objScores.length) * (p.weight || 1); w += (p.weight || 1); any = true; }
    }
    return any && w ? acc / w : null;
  }, [persps, objs, inds, valMap, month]);

  const criticos = useMemo(() => inds.filter((i) => statusFromPerf(indicatorLatestPerf(i, vals, year)) === "critical"), [inds, vals, year]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;
  if (inds.length === 0) return <Card><CardContent><EmptyState text="Cadastre indicadores e lance resultados para ver o painel." /></CardContent></Card>;

  const mesLabel = `${MESES[month - 1]}/${year}`;
  const changeMonth = (d: number) => { let m = month + d; if (m < 1) m = 1; if (m > 12) m = 12; setMonth(m); };

  const cards = [
    { label: "TOTAL KPIS", value: summary.total, border: "border-t-primary", badge: null as number | null, badgeCls: "", valueCls: "" },
    { label: "NO ALVO", value: summary.ontarget, border: "border-t-kpi-ontarget", badge: pct(summary.ontarget), badgeCls: "bg-kpi-ontarget/12 text-kpi-ontarget", valueCls: "text-kpi-ontarget" },
    { label: "ATENÇÃO", value: summary.attention, border: "border-t-kpi-attention", badge: pct(summary.attention), badgeCls: "bg-kpi-attention/12 text-kpi-attention", valueCls: "text-kpi-attention" },
    { label: "CRÍTICO", value: summary.critical, border: "border-t-kpi-critical", badge: pct(summary.critical), badgeCls: "bg-kpi-critical/12 text-kpi-critical", valueCls: "text-kpi-critical" },
  ];

  const MonthTable = ({ indsList }: { indsList: any[] }) => (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-low text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 text-left font-semibold">Indicador</th>
            {months.map((m) => <th key={m} colSpan={2} className="border-l border-border px-3 py-2 text-center font-semibold">{MESES[m - 1]}/{String(year).slice(2)}</th>)}
          </tr>
          <tr className="bg-surface-low/60 text-[10px] uppercase text-muted-foreground/70">
            <th></th>
            {months.map((m) => (
              <Fragment key={m}>
                <th className="border-l border-border px-3 py-1 font-medium">Meta</th>
                <th className="px-3 py-1 font-medium">Real</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {indsList.map((i, idx) => (
            <tr key={i.id} className={cn("border-t border-border transition-colors hover:bg-surface-low/50", idx % 2 === 1 && "bg-surface-low/20")}>
              <td className="px-4 py-3 font-medium">{i.name}{i.unit ? <span className="ml-1 text-[11px] text-muted-foreground/70">({i.unit})</span> : null}</td>
              {months.map((m) => {
                const c = valMap[`${i.id}-${m}`] ?? { target: null, actual: null };
                const s = statusFromPerf(performance(c.target, c.actual, i.direction));
                return (
                  <Fragment key={m}>
                    <td className="border-l border-border px-3 py-3 text-right tabular-nums text-muted-foreground">{formatNumberBR(c.target, i.unit)}</td>
                    <td className={cn("px-3 py-3 text-right font-bold tabular-nums", c.actual != null ? STATUS_COLOR[s] : "text-muted-foreground")}>{formatNumberBR(c.actual, i.unit)}</td>
                  </Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary">Painel de KPI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visualização somente leitura — use a aba Indicadores para lançamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-card shadow-sm">
            <button className="px-3 py-2 text-muted-foreground hover:text-primary" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-[92px] text-center text-sm font-semibold">{mesLabel}</span>
            <button className="px-3 py-2 text-muted-foreground hover:text-primary" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></button>
          </div>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[92px] shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={cn("rounded-2xl border border-border border-t-4 bg-card p-5 shadow-sm", c.border)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.label}</span>
              {c.badge != null && <span className={cn("rounded-lg px-2 py-0.5 text-xs font-bold", c.badgeCls)}>{c.badge}%</span>}
            </div>
            <div className={cn("mt-2 font-display text-4xl font-extrabold", c.valueCls || "text-foreground")}>{c.value}</div>
          </div>
        ))}
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-primary">Saúde Geral — {mesLabel}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kpi-ontarget" /> No alvo ≥ meta</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kpi-attention" /> Atenção</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kpi-critical" /> Crítico</span>
            </div>
          </div>
          {summary.comDados === 0 ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">Sem dados lançados para este mês</p>
              <div className="mt-4 h-6 w-full rounded-full bg-muted" />
            </>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-kpi-ontarget to-secondary transition-all"
                  style={{ width: `${Math.min(100, Math.round((healthMonth ?? 0) * 100))}%` }} />
              </div>
              <span className="w-14 text-right font-display text-lg font-extrabold text-primary">
                {healthMonth == null ? "—" : `${Math.min(100, Math.round(healthMonth * 100))}%`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {persps.map((p) => {
        const pObjs = objs.filter((o) => o.perspective_id === p.id).sort((a, b) => a.ord - b.ord);
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-border shadow-sm">
            {/* PERSPECTIVA (sem peso) */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-primary-container px-6 py-4 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Users className="h-5 w-5" /></span>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Perspectiva</div>
                <div className="text-lg font-bold leading-tight">{p.name}</div>
              </div>
            </div>
            {/* OBJETIVOS */}
            <div className="space-y-5 bg-card p-4">
              {pObjs.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum objetivo cadastrado nesta perspectiva.</p>}
              {pObjs.map((o) => {
                const oInds = inds.filter((i) => i.objective_id === o.id).sort((a, b) => a.ord - b.ord);
                return (
                  <div key={o.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-secondary">Objetivo</span>
                      <span className="h-px flex-1 bg-border" />
                      <span className="font-bold text-primary">{o.name}</span>
                    </div>
                    {oInds.length === 0
                      ? <p className="rounded-xl border border-border bg-surface-low/40 px-4 py-3 text-sm text-muted-foreground">Nenhum indicador neste objetivo.</p>
                      : months.length === 0
                        ? <p className="rounded-xl border border-border bg-surface-low/40 px-4 py-3 text-sm text-muted-foreground">Nenhum resultado lançado ainda neste ano.</p>
                        : <MonthTable indsList={oInds} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-primary"><Zap className="h-5 w-5 text-gold" /> Ações Estratégicas</h2>
          {criticos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum indicador em situação crítica.</p>
          ) : (
            <ul className="space-y-2">
              {criticos.map((i) => (
                <li key={i.id} className="flex items-start gap-2 rounded-xl border border-kpi-critical/30 bg-kpi-critical/5 p-3 text-sm">
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
