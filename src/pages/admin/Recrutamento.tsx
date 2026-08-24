import { useState } from "react";
import { Plus, Pencil, Download, Briefcase } from "lucide-react";
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

function Vagas() {
  const { data, isLoading, isError } = useJobs(false);
  const save = useSaveJob(); const del = useDeleteJob();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Job>>(emptyJob);

  const salvar = async () => { if (!form.title?.trim()) return; await save.mutateAsync(form); setOpen(false); };

  return (
    <>
    <DivulgacaoVagas />
    <Card><CardContent className="p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Vagas cadastradas</span>
        <Button onClick={() => { setForm(emptyJob); setOpen(true); }}><Plus className="h-4 w-4" /> Nova vaga</Button>
      </div>
      {isLoading ? <LoadingState /> : isError ? <ErrorState /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Vaga</TableHead><TableHead>Área</TableHead><TableHead>Local</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((j) => (
              <TableRow key={j.id}>
                <TableCell className="font-medium">{j.title}</TableCell>
                <TableCell className="text-muted-foreground">{j.role_function || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{j.location || "—"}</TableCell>
                <TableCell><Badge variant={j.active ? "ontarget" : "muted"}>{j.active ? "Ativa" : "Inativa"}</Badge></TableCell>
                <TableCell className="text-right"><div className="flex justify-end gap-1">
                  <CopiarLinkVaga jobId={j.id} />
                  <Button variant="ghost" size="icon" onClick={() => { setForm(j); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <ConfirmDelete label={j.title} onConfirm={() => del.mutate(j.id)} />
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {!isLoading && !isError && (data ?? []).length === 0 && <EmptyState text="Nenhuma vaga cadastrada." />}

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

function Candidaturas() {
  const { data, isLoading, isError } = useApplications();
  const upd = useUpdateApplicationStatus();
  return (
    <Card><CardContent className="p-4">
      {isLoading ? <LoadingState /> : isError ? <ErrorState /> : (data ?? []).length === 0 ? <EmptyState text="Nenhuma candidatura recebida." /> : (
        <div className="grid gap-3">
          {(data ?? []).map((a) => (
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
  return (
    <div>
      <div className="mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-bold">Recrutamento</h2></div>
      <Tabs defaultValue="vagas">
        <TabsList><TabsTrigger value="vagas">Vagas</TabsTrigger><TabsTrigger value="candidaturas">Candidaturas</TabsTrigger></TabsList>
        <TabsContent value="vagas"><Vagas /></TabsContent>
        <TabsContent value="candidaturas"><Candidaturas /></TabsContent>
      </Tabs>
    </div>
  );
}
