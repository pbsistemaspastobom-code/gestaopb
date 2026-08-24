import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/DataState";
import { useJob, submitApplication } from "@/hooks/useRecrutamento";

export default function VagaDetalhe() {
  const { id } = useParams();
  const { data: job, isLoading } = useJob(id);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const enviar = async () => {
    if (!form.name || !form.email) { toast.error("Preencha nome e e-mail."); return; }
    if (file && file.size > 5 * 1024 * 1024) { toast.error("Currículo acima de 5 MB."); return; }
    setBusy(true);
    try { await submitApplication({ job_id: id!, ...form, file }); setDone(true); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao enviar candidatura."); }
    finally { setBusy(false); }
  };

  if (isLoading) return <div className="min-h-screen"><LoadingState /></div>;
  if (!job) return <div className="flex min-h-screen flex-col items-center justify-center gap-3"><p>Vaga não encontrada.</p><Button asChild variant="outline"><Link to="/vagas">Ver vagas</Link></Button></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4"><img src="/logo.png" className="h-10 w-auto object-contain" /></div></header>
      <main className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/vagas"><ArrowLeft className="h-4 w-4" /> Voltar</Link></Button>
        <Card className="mb-6"><CardContent className="p-6">
          <h1 className="font-display text-2xl font-bold">{job.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {job.role_function && <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.role_function}</span>}
            {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>}
            {job.type && <Badge variant="secondary">{job.type}</Badge>}
          </div>
          {job.description && <div className="mt-4"><h3 className="font-semibold">Descrição</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{job.description}</p></div>}
          {job.requirements && <div className="mt-4"><h3 className="font-semibold">Requisitos</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{job.requirements}</p></div>}
          {job.compensation && <div className="mt-4"><h3 className="font-semibold">Remuneração</h3><p className="mt-1 text-sm text-muted-foreground">{job.compensation}</p></div>}
        </CardContent></Card>

        <Card><CardContent className="p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-kpi-ontarget" />
              <h2 className="font-display text-xl font-bold">Candidatura enviada!</h2>
              <p className="text-sm text-muted-foreground">Recebemos seus dados. Entraremos em contato caso avance no processo.</p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 font-display text-lg font-bold">Candidatar-se</h2>
              <div className="grid gap-4">
                <div className="space-y-2"><Label>Nome completo *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Currículo (PDF, até 5 MB)</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
                <Button onClick={enviar} disabled={busy}>{busy ? "Enviando..." : "Enviar candidatura"}</Button>
              </div>
            </>
          )}
        </CardContent></Card>
      </main>
    </div>
  );
}
