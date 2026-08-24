import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, ArrowUp, ArrowDown, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { LoadingState, ErrorState, EmptyState } from "@/components/DataState";
import { useKpiData, useKpiCrud } from "@/hooks/useKpi";
import type { Perspective, Objective, Indicator } from "@/lib/kpi";

const UNITS = ["un.", "R$", "%", "h", "dias", "pts"];

function reorderBtn(list: any[], item: any, dir: -1 | 1, reorder: any) {
  const sorted = [...list].sort((a, b) => a.ord - b.ord);
  const i = sorted.findIndex((x) => x.id === item.id);
  const j = i + dir;
  if (j < 0 || j >= sorted.length) return;
  reorder.mutate({ a: { id: sorted[i].id, ord: sorted[i].ord }, b: { id: sorted[j].id, ord: sorted[j].ord } });
}

export default function Configuracao() {
  const { perspectives, objectives, indicators, isLoading, isError } = useKpiData(new Date().getFullYear());
  const pCrud = useKpiCrud("kpi_perspectives");
  const oCrud = useKpiCrud("kpi_objectives");
  const iCrud = useKpiCrud("kpi_indicators");

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const [pDlg, setPDlg] = useState<Partial<Perspective> | null>(null);
  const [oDlg, setODlg] = useState<Partial<Objective> | null>(null);
  const [iDlg, setIDlg] = useState<Partial<Indicator> | null>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;

  const persps = [...(perspectives.data ?? [])].sort((a, b) => a.ord - b.ord);
  const objs = objectives.data ?? [];
  const inds = indicators.data ?? [];
  const nextOrd = (arr: any[]) => (arr.length ? Math.max(...arr.map((x) => x.ord)) + 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setPDlg({ name: "", weight: 1, ord: nextOrd(persps) })}><Plus className="h-4 w-4" /> Nova perspectiva</Button>
      </div>

      {persps.length === 0 && <Card><CardContent><EmptyState text="Nenhuma perspectiva. Comece criando uma." /></CardContent></Card>}

      {persps.map((p) => {
        const pObjs = objs.filter((o) => o.perspective_id === p.id).sort((a, b) => a.ord - b.ord);
        const isOpen = expanded[p.id];
        return (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <button className="flex items-center gap-2 text-left" onClick={() => toggle(p.id)}>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-display font-semibold">{p.name}</span>
                  <Badge variant="secondary">peso {p.weight}</Badge>
                </button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => reorderBtn(persps, p, -1, pCrud.reorder)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => reorderBtn(persps, p, 1, pCrud.reorder)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setPDlg(p)}><Pencil className="h-4 w-4" /></Button>
                  <ConfirmDelete label={p.name} onConfirm={() => pCrud.remove.mutate(p.id)} />
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-3 border-l-2 border-secondary pl-4">
                  <Button variant="outline" size="sm" onClick={() => setODlg({ perspective_id: p.id, name: "", ord: nextOrd(pObjs) })}><Plus className="h-4 w-4" /> Objetivo</Button>
                  {pObjs.map((o) => {
                    const oInds = inds.filter((i) => i.objective_id === o.id).sort((a, b) => a.ord - b.ord);
                    return (
                      <div key={o.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{o.name}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => reorderBtn(pObjs, o, -1, oCrud.reorder)}><ArrowUp className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => reorderBtn(pObjs, o, 1, oCrud.reorder)}><ArrowDown className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setODlg(o)}><Pencil className="h-4 w-4" /></Button>
                            <ConfirmDelete label={o.name} onConfirm={() => oCrud.remove.mutate(o.id)} />
                          </div>
                        </div>
                        <div className="mt-2 space-y-1 pl-3">
                          <Button variant="ghost" size="sm" onClick={() => setIDlg({ objective_id: o.id, name: "", unit: "un.", direction: "higher_better", ord: nextOrd(oInds) })}><Plus className="h-4 w-4" /> Indicador</Button>
                          {oInds.map((i) => (
                            <div key={i.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/40">
                              <div className="flex items-center gap-2 text-sm">
                                <Target className="h-3.5 w-3.5 text-primary" />
                                <span>{i.name}</span>
                                <Badge variant="muted">{i.unit}</Badge>
                                <span className="text-xs text-muted-foreground">{i.direction === "higher_better" ? "maior melhor" : "menor melhor"}{i.responsible ? ` · ${i.responsible}` : ""}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => reorderBtn(oInds, i, -1, iCrud.reorder)}><ArrowUp className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => reorderBtn(oInds, i, 1, iCrud.reorder)}><ArrowDown className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setIDlg(i)}><Pencil className="h-4 w-4" /></Button>
                                <ConfirmDelete label={i.name} onConfirm={() => iCrud.remove.mutate(i.id)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog Perspectiva */}
      <Dialog open={!!pDlg} onOpenChange={(v) => !v && setPDlg(null)}>
        <DialogContent><DialogHeader><DialogTitle>{pDlg?.id ? "Editar" : "Nova"} perspectiva</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={pDlg?.name ?? ""} onChange={(e) => setPDlg({ ...pDlg!, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Peso</Label><Input type="number" step="0.1" value={pDlg?.weight ?? 1} onChange={(e) => setPDlg({ ...pDlg!, weight: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPDlg(null)}>Cancelar</Button><Button onClick={async () => { await pCrud.save.mutateAsync(pDlg); setPDlg(null); }} disabled={!pDlg?.name?.trim()}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Objetivo (com mover perspectiva) */}
      <Dialog open={!!oDlg} onOpenChange={(v) => !v && setODlg(null)}>
        <DialogContent><DialogHeader><DialogTitle>{oDlg?.id ? "Editar" : "Novo"} objetivo</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={oDlg?.name ?? ""} onChange={(e) => setODlg({ ...oDlg!, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Perspectiva</Label>
              <Select value={oDlg?.perspective_id} onValueChange={(v) => setODlg({ ...oDlg!, perspective_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{persps.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setODlg(null)}>Cancelar</Button><Button onClick={async () => { await oCrud.save.mutateAsync(oDlg); setODlg(null); }} disabled={!oDlg?.name?.trim() || !oDlg?.perspective_id}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Indicador (com mover objetivo) */}
      <Dialog open={!!iDlg} onOpenChange={(v) => !v && setIDlg(null)}>
        <DialogContent><DialogHeader><DialogTitle>{iDlg?.id ? "Editar" : "Novo"} indicador</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Nome</Label><Input value={iDlg?.name ?? ""} onChange={(e) => setIDlg({ ...iDlg!, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Unidade</Label>
              <Select value={iDlg?.unit} onValueChange={(v) => setIDlg({ ...iDlg!, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Direção</Label>
              <Select value={iDlg?.direction} onValueChange={(v) => setIDlg({ ...iDlg!, direction: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="higher_better">Maior é melhor</SelectItem><SelectItem value="lower_better">Menor é melhor</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Responsável</Label><Input value={iDlg?.responsible ?? ""} onChange={(e) => setIDlg({ ...iDlg!, responsible: e.target.value })} /></div>
            <div className="space-y-2"><Label>Objetivo</Label>
              <Select value={iDlg?.objective_id} onValueChange={(v) => setIDlg({ ...iDlg!, objective_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{objs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIDlg(null)}>Cancelar</Button><Button onClick={async () => { await iCrud.save.mutateAsync(iDlg); setIDlg(null); }} disabled={!iDlg?.name?.trim() || !iDlg?.objective_id}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
