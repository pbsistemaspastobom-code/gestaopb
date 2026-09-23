import { useState } from "react";
import { Plus, Pencil, Download, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { LoadingState, ErrorState, EmptyState } from "@/components/DataState";
import { useJobs, useSaveJob, useDeleteJob, useApplications, useUpdateApplicationStatus, downloadResume } from "@/hooks/useRecrutamento";
import { APPLICATION_STATUS, APPLICATION_STATUS_LIST } from "@/lib/types";
import { DivulgacaoVagas, CopiarLinkVaga } from "@/components/DivulgacaoVagas";
import type { Job } from "@/lib/types";

const emptyJob: Partial<Job> = { title: "", description: "", role_function: "", requirements: "", compensation: "", location: "", type: "", active: true };
const fmt = (d: string) => new Date(d).toLocaleDateString("pt-BR");

function Vagas({ onVerCandidatos }: { onVerCandidatos: (jobId: string, jobTitle: string) => void }) {
  const { data, isLoading, isError } = useJobs(false);
  const { data: apps } = useApplications();
  const save = useSaveJob(); const del = useDeleteJob();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Job>>(emptyJob);
  const [filtro, setFiltro] = useState<"todas" | "ativas" | "inativas">("todas");
  const [busca, setBusca] = useState("");

  const salvar = async () => { if (!form.title?.trim()) return; await save.mutateAsync(form); setOpen(false); };

  const todas = data ?? [];
  const ativas = todas.filter((j) => j.active);
  const inativas = todas.filter((j) => !j.active);
  const listados = todas
    .filter((j) => filtro === "todas" || (filtro === "ativas" ? j.active : !j.active))
    .filter((j) => !busca.trim() || j.title.toLowerCase().includes(busca.toLowerCase()) || (j.location ?? "").toLowerCase().includes(busca.toLowerCase()));

  const contarCandidatos = (jobId: string) => (apps ?? []).filter((a) => a.job_id === jobId).length;

  return (
    <>
    <DivulgacaoVagas />

    {/* Cards de resumo */}
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total</div>
        <div className="mt-1 font-display text-3xl font-extrabold text-primary-container">{todas.length}</div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Ativas</div>
        <div className="mt-1 font-display text-3xl font-extrabold" style={{ color: "hsl(var(--kpi-ontarget))" }}>{ativas.length}</div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Inativas</div>
        <div className="mt-1 font-display text-3xl font-extrabold text-muted-foreground">{inativas.length}</div>
      </div>
    </div>

    <Card className="rounded-2xl"><CardContent className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-primary-container">Vagas cadastradas</h3>
        <Button onClick={() => { setForm(emptyJob); setOpen(true); }}><Plus className="h-4 w-4" /> Nova vaga</Button>
      </div>

      {/* Busca + filtros em pill */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Buscar por vaga ou local..." value={busca} onChange={(e) => setBusca(e.target.value)} className="max-w-xs" />
        {[
          { key: "todas" as const, label: "Todas" },
          { key: "ativas" as const, label: "Ativas" },
          { key: "inativas" as const, label: "Inativas" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filtro === f.key ? "bg-primary-container text-white" : "border border-border bg-card text-muted-foreground hover:bg-surface-low"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState /> : isError ? <ErrorState /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Vaga</TableHead><TableHead>Área</TableHead><TableHead>Local</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {listados.map((j) => {
              const n = contarCandidatos(j.id);
              return (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell className="text-muted-foreground">{j.role_function || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{j.location || "—"}</TableCell>
                  <TableCell><Badge variant={j.active ? "ontarget" : "muted"}>{j.active ? "Ativa" : "Inativa"}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="relative" title={`${n} candidato${n !== 1 ? "s" : ""} — ver candidaturas desta vaga`}
                      onClick={() => onVerCandidatos(j.id, j.title)}>
                      <Users className="h-4 w-4" />
                      {n > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: "#2D6A27" }}>
                          {n}
                        </span>
                      )}
                    </Button>
                    <CopiarLinkVaga jobId={j.id} />
                    <Button variant="ghost" size="icon" onClick={() => { setForm(j); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <ConfirmDelete label={j.title} onConfirm={() => del.mutate(j.id)} />
                  </div></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {!isLoading && !isError && listados.length === 0 && <EmptyState text="Nenhuma vaga encontrada." />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{form.id ? "Editar vaga" : "Nova vaga"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Título *</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Área / Função</Label><Input value={form.role_function ?? ""} onChange={(e) => setForm({ ...form, role_function: e.target.value })} /></div>
            <div className="space-y-2"><Label>Local</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tipo</Label><Input placeholder="CLT, PJ, Estágio..." value={form.type ?? ""} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div className="space-y-2"><Label>Remuneração</Label><Input value={form.compensation ?? ""} onChange={(e) => setForm({ ...form, compensation: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Descrição</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Requisitos</Label><Textarea value={form.requirements ?? ""} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
            <div className="space-y-2"><Label>Situação</Label>
              <Select value={form.active ? "1" : "0"} onValueChange={(v) => setForm({ ...form, active: v === "1" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Ativa</SelectItem><SelectItem value="0">Inativa</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar} disabled={save.isPending || !form.title?.trim()}>{save.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent></Card>
    </>
  );
}

function Candidaturas({ filtroJobId, filtroJobTitle, onLimparFiltro }: { filtroJobId: string | null; filtroJobTitle: string | null; onLimparFiltro: () => void }) {
  const { data, isLoading, isError } = useApplications();
  const upd = useUpdateApplicationStatus();
  const lista = (data ?? []).filter((a) => !filtroJobId || a.job_id === filtroJobId);

  return (
    <Card><CardContent className="p-4">
      {filtroJobId && (
        <div className="mb-4 flex items-center gap-2 rounded-full bg-surface-low px-4 py-2 text-sm font-semibold text-primary-container w-fit">
          <Users className="h-4 w-4" /> Vaga: {filtroJobTitle}
          <button onClick={onLimparFiltro} className="ml-1 rounded-full p-0.5 hover:bg-black/5" title="Limpar filtro"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {isLoading ? <LoadingState /> : isError ? <ErrorState /> : lista.length === 0 ? (
        <EmptyState text={filtroJobId ? "Nenhuma candidatura recebida para esta vaga." : "Nenhuma candidatura recebida."} />
      ) : (
        <div className="grid gap-3">
          {lista.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2"><span className="font-medium">{a.name}</span><Badge variant={APPLICATION_STATUS[a.status].variant}>{APPLICATION_STATUS[a.status].label}</Badge></div>
                <div className="text-sm text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ""}</div>
                <div className="mt-1 text-xs text-muted-foreground">{(a as any).job?.title ? `Vaga: ${(a as any).job.title} · ` : ""}Recebida em {fmt(a.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                {a.resume_path && <Button variant="outline" size="sm" onClick={() => downloadResume(a.resume_path!)}><Download className="h-4 w-4" /> Currículo</Button>}
                <Select value={a.status} onValueChange={(v) => upd.mutate({ id: a.id, status: v as any })}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{APPLICATION_STATUS_LIST.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent></Card>
  );
}

export default function Recrutamento() {
  const [aba, setAba] = useState("vagas");
  const [filtroJobId, setFiltroJobId] = useState<string | null>(null);
  const [filtroJobTitle, setFiltroJobTitle] = useState<string | null>(null);

  const abrirCandidatosDaVaga = (jobId: string, jobTitle: string) => {
    setFiltroJobId(jobId); setFiltroJobTitle(jobTitle); setAba("candidaturas");
  };
  const limparFiltro = () => { setFiltroJobId(null); setFiltroJobTitle(null); };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-2xl font-extrabold text-primary-container">Recrutamento</h2>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Vagas e candidaturas</p>
      </div>
      <Tabs value={aba} onValueChange={(v) => { setAba(v); if (v === "vagas") limparFiltro(); }}>
        <TabsList><TabsTrigger value="vagas">Vagas</TabsTrigger><TabsTrigger value="candidaturas">Candidaturas</TabsTrigger></TabsList>
        <TabsContent value="vagas"><Vagas onVerCandidatos={abrirCandidatosDaVaga} /></TabsContent>
        <TabsContent value="candidaturas"><Candidaturas filtroJobId={filtroJobId} filtroJobTitle={filtroJobTitle} onLimparFiltro={limparFiltro} /></TabsContent>
      </Tabs>
    </div>
  );
}
