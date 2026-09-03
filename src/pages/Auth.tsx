import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const { user, loading, roleLoading, hasAccess, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !roleLoading && user) return <Navigate to={hasAccess ? "/admin" : "/auth"} replace />;

  const entrar = async () => {
    if (!email || !password) { toast.error("Preencha e-mail e senha."); return; }
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) toast.error("Credenciais inválidas.");
    else toast.success("Bem-vindo!");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel lateral com a marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-container to-secondary p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(circle at 20% 30%, hsl(var(--gold)) 0, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0, transparent 35%)" }} />
        <div className="relative inline-flex w-fit rounded-2xl bg-white px-5 py-3 shadow-lg"><img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-12 w-auto object-contain" /></div>
        <div className="relative">
          <h2 className="font-display text-4xl font-extrabold leading-tight">Gestão de pessoas,<br />do campo à gestão.</h2>
          <p className="mt-4 max-w-md text-white/70">Recrutamento, indicadores e resultados da Rede do Campo — Pasto Bom, tudo em um só lugar.</p>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-white/50">
          <span className="h-2 w-2 rounded-full bg-gold" /> Av. João Neto, 40 — JD Eldorado, Botelhos-MG
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex justify-center lg:hidden">
            <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-primary">Entrar</h1>
          <p className="mt-1 text-muted-foreground">Acesse o painel administrativo</p>
          <div className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Senha</Label>
              <Input id="pw" type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} />
            </div>
            <Button className="w-full" size="lg" onClick={entrar} disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
            <p className="text-center text-xs text-muted-foreground">Contas são criadas por um administrador.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
