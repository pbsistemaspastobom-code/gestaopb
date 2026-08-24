import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/DataState";

async function callManageUsers(action: string, payload: any = {}) {
  const { data, error } = await supabase.functions.invoke("manage-users", { body: { action, ...payload } });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export function CriarContaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [admin, setAdmin] = useState(false); const [busy, setBusy] = useState(false);
  const criar = async () => {
    if (!email || !password) { toast.error("Preencha e-mail e senha."); return; }
    setBusy(true);
    try { await callManageUsers("create", { email, password, makeAdmin: admin }); toast.success("Conta criada."); onOpenChange(false); setEmail(""); setPassword(""); setAdmin(false); }
    catch (e: any) { toast.error(e?.message ?? "Erro. A Edge Function 'manage-users' precisa estar publicada."); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar conta</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} /> Administrador</label>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={criar} disabled={busy}>{busy ? "Criando..." : "Criar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsuariosDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [users, setUsers] = useState<any[]>([]); const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); try { const d: any = await callManageUsers("list"); setUsers(d?.users ?? []); } catch (e: any) { toast.error(e?.message ?? "Publique a Edge Function 'manage-users'."); } finally { setLoading(false); } };
  useEffect(() => { if (open) load(); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Usuários</DialogTitle></DialogHeader>
        {loading ? <LoadingState /> : (
          <div className="divide-y rounded-lg border">
            {users.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum usuário ou função ainda não publicada.</p>}
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="text-sm">{u.email} {u.isAdmin && <Badge variant="gold" className="ml-2">admin</Badge>}</div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
