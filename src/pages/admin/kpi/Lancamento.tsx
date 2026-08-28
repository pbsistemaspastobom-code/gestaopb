import { Fragment, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/DataState";
import { EditableNumber } from "@/components/EditableNumber";
import { useAuth } from "@/contexts/AuthContext";
import { useKpiData, useSetTarget, useSetActual } from "@/hooks/useKpi";
import { MESES } from "@/lib/kpi";

const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

export default function Lancamento() {
  const { canEditMeta } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const { perspectives, objectives, indicators, values, isLoading, isError } = useKpiData(year);
  const setTarget = useSetTarget();
  const setActual = useSetActual();

  const valMap = useMemo(() => {
    const m: Record<string, { target: number | null; actual: number | null }> = {};
    (values.data ?? []).forEach((v) => { m[`${v.indicator_id}-${v.month}`] = { target: v.target, actual: v.actual }; });
    return m;
  }, [values.data]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;

  const persps = [...(perspectives.data ?? [])].sort((a, b) => a.ord - b.ord);
  const objs = objectives.data ?? [];
  const inds = indicators.data ?? [];
  if (inds.length === 0) return <Card><CardContent><EmptyState text="Cadastre indicadores na aba Configuração primeiro." /></CardContent></Card>;

  const colCount = 1 + MESES.length * 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        {!canEditMeta && <Badge variant="muted">Você lança apenas o Realizado</Badge>}
      </div>

      <Card className="rounded-2xl shadow-sm"><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b bg-surface-low">
                <th className="sticky left-0 z-20 min-w-[240px] bg-surface-low px-4 py-3 text-left font-bold shadow-[2px_0_4px_rgba(0,0,0,0.04)]">Indicador</th>
                {MESES.map((m) => <th key={m} colSpan={2} className="border-l border-border px-3 py-3 text-center font-bold">{m}</th>)}
              </tr>
              <tr className="border-b bg-surface-low/60 text-xs uppercase text-muted-foreground">
                <th className="sticky left-0 z-20 bg-surface-low/60 px-4 py-1.5 text-left shadow-[2px_0_4px_rgba(0,0,0,0.04)]"></th>
                {MESES.map((m) => (
                  <Fragment key={m}>
                    <th className="border-l border-border px-3 py-1.5 font-semibold">Meta</th>
                    <th className="px-3 py-1.5 font-semibold">Real</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {persps.map((p) => {
                const pObjs = objs.filter((o) => o.perspective_id === p.id).sort((a, b) => a.ord - b.ord);
                return (
                  <Fragment key={p.id}>
                    <tr className="bg-primary-container/10"><td colSpan={colCount} className="sticky left-0 px-4 py-2 font-bold uppercase tracking-wide text-primary">{p.name}</td></tr>
                    {pObjs.map((o) => {
                      const oInds = inds.filter((i) => i.objective_id === o.id).sort((a, b) => a.ord - b.ord);
                      return (
                        <Fragment key={o.id}>
                          <tr><td colSpan={colCount} className="sticky left-0 px-4 py-1.5 pl-6 text-xs font-semibold uppercase tracking-wide text-secondary">{o.name}</td></tr>
                          {oInds.map((i) => (
                            <tr key={i.id} className="border-b transition-colors hover:bg-surface-low/40">
                              <td className="sticky left-0 z-10 min-w-[240px] bg-card px-4 py-2 pl-8 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.04)]">{i.name} <span className="text-xs text-muted-foreground">({i.unit})</span></td>
                              {MESES.map((_, mi) => {
                                const month = mi + 1;
                                const cell = valMap[`${i.id}-${month}`] ?? { target: null, actual: null };
                                return (
                                  <Fragment key={month}>
                                    <td className="border-l border-border px-1.5 py-1 text-right">
                                      <EditableNumber value={cell.target} unit={i.unit} disabled={!canEditMeta}
                                        onCommit={(v) => setTarget.mutate({ indicator_id: i.id, year, month, target: v })} />
                                    </td>
                                    <td className="px-1.5 py-1 text-right">
                                      <EditableNumber value={cell.actual} unit={i.unit}
                                        onCommit={(v) => setActual.mutate({ indicator_id: i.id, year, month, actual: v })} />
                                    </td>
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
    </div>
  );
}
