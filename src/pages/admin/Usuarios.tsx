import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Power, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LoadingState } from "@/components/DataState";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "supervisao", label: "Supervisão" },
];
const ROLE_LABEL: Record<string, string> = { admin: "Administrador", gerente: "Gerente", supervisao: "Supervisão" };

async function callManageUsers(action: string, payload: any = {}) {
  const { data, error } = await supabase.functions.invoke("manage-users", { body: { action, ...payload } });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export function CriarContaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [role, setRole] = useState("supervisao"); const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const criar = async () => {
    if (!email) { toast.error("Informe o e-mail."); return; }
    setBusy(true);
    try {
      const d: any = await callManageUsers("create", { email, password: password || undefined, role });
      if (d?.link) { setLink(d.link); toast.success("Usuário criado. Envie o link para ele definir a senha."); }
      else { toast.success("Usuário criado."); onOpenChange(false); }
      setEmail(""); setPassword("");
    } catch (e: any) { toast.error(e?.message ?? "Erro. Publique a Edge Function 'manage-users'."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setLink(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar usuário</DialogTitle></DialogHeader>
        {link ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Usuário criado! Envie este link para a pessoa criar a senha dela:</p>
            <div className="flex gap-2">
              <Input readOnly value={link} onClick={(e) => (e.target as HTMLInputElement).select()} />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado!"); }}><Copy className="h-4 w-4" /></Button>
            </div>
            <DialogFooter><Button onClick={() => { setLink(null); onOpenChange(false); }}>Concluir</Button></DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Perfil de acesso</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Senha (opcional)</Label>
                <Input type="text" placeholder="Deixe em branco para gerar link de definição de senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">Se deixar em branco, geramos um link para a pessoa criar a própria senha.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={criar} disabled={busy}>{busy ? "Criando..." : "Criar"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UsuariosDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [users, setUsers] = useState<any[]>([]); const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d: any = await callManageUsers("list"); setUsers(d?.users ?? []); }
    catch (e: any) { toast.error(e?.message ?? "Publique a Edge Function 'manage-users'."); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (open) load(); }, [open]);

  const setRole = async (id: string, role: string) => {
    try { await callManageUsers("setRole", { userId: id, role }); toast.success("Perfil atualizado."); load(); }
    catch (e: any) { toast.error(e?.message ?? "Erro."); }
  };
  const toggleActive = async (u: any) => {
    try { await callManageUsers("setActive", { userId: u.id, active: !u.active }); toast.success(u.active ? "Usuário inativado." : "Usuário ativado."); load(); }
    catch (e: any) { toast.error(e?.message ?? "Erro."); }
  };
  const senhaLink = async (u: any) => {
    try { const d: any = await callManageUsers("passwordLink", { userId: u.id, email: u.email }); if (d?.link) { navigator.clipboard.writeText(d.link); toast.success("Link de senha copiado! Envie para o usuário."); } }
    catch (e: any) { toast.error(e?.message ?? "Erro."); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Gerenciar usuários</DialogTitle></DialogHeader>
        {loading ? <LoadingState /> : (
          <div className="divide-y rounded-xl border">
            {users.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum usuário encontrado (ou a Edge Function ainda não foi publicada).</p>}
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-[180px]">
                  <div className="text-sm font-medium">{u.email}</div>
                  {!u.active && <Badge variant="muted" className="mt-1">Inativo</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={u.role ?? "supervisao"} onValueChange={(v) => setRole(u.id, v)}>
                    <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => senhaLink(u)} title="Gerar link de senha"><KeyRound className="h-4 w-4" /></Button>
                  <Button variant={u.active ? "outline" : "default"} size="sm" onClick={() => toggleActive(u)} title={u.active ? "Inativar" : "Ativar"}>
                    <Power className="h-4 w-4" /> {u.active ? "Inativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
