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
  const { isAdmin } = useAuth();
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
        {!isAdmin && <Badge variant="muted">Você edita apenas o Realizado</Badge>}
      </div>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-semibold">Indicador</th>
                {MESES.map((m) => <th key={m} colSpan={2} className="border-l px-2 py-2 text-center font-semibold">{m}</th>)}
              </tr>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="sticky left-0 z-10 bg-card px-3 py-1 text-left"></th>
                {MESES.map((m) => (
                  <Fragment key={m}>
                    <th className="border-l px-2 py-1 font-medium">Meta</th>
                    <th className="px-2 py-1 font-medium">Real</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {persps.map((p) => {
                const pObjs = objs.filter((o) => o.perspective_id === p.id).sort((a, b) => a.ord - b.ord);
                return (
                  <Fragment key={p.id}>
                    <tr className="bg-secondary/40"><td colSpan={colCount} className="px-3 py-1.5 font-semibold text-primary">{p.name}</td></tr>
                    {pObjs.map((o) => {
                      const oInds = inds.filter((i) => i.objective_id === o.id).sort((a, b) => a.ord - b.ord);
                      return (
                        <Fragment key={o.id}>
                          <tr><td colSpan={colCount} className="px-3 py-1 pl-6 text-xs font-medium text-muted-foreground">{o.name}</td></tr>
                          {oInds.map((i) => (
                            <tr key={i.id} className="border-b">
                              <td className="sticky left-0 z-10 bg-card px-3 py-1 pl-8 font-medium">{i.name} <span className="text-xs text-muted-foreground">({i.unit})</span></td>
                              {MESES.map((_, mi) => {
                                const month = mi + 1;
                                const cell = valMap[`${i.id}-${month}`] ?? { target: null, actual: null };
                                return (
                                  <Fragment key={month}>
                                    <td className="border-l px-1 py-0.5 text-right">
                                      <EditableNumber value={cell.target} unit={i.unit} disabled={!isAdmin}
                                        onCommit={(v) => setTarget.mutate({ indicator_id: i.id, year, month, target: v })} />
                                    </td>
                                    <td className="px-1 py-0.5 text-right">
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
