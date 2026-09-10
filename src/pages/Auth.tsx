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
    <div className="flex min-h-screen items-center justify-center bg-surface-low p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-xl">
        {/* Topo verde com a marca */}
        <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center text-white"
          style={{ background: "linear-gradient(160deg, #0F2E1E, #1C4416)" }}>
          <div className="mb-4 rounded-2xl bg-white px-5 py-3 shadow-lg">
            <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="font-display text-[28px] font-extrabold leading-tight">Gestão</h1>
          <p className="mt-1 text-sm text-white/70">Pasto Bom · Rede do Campo</p>
        </div>

        {/* Formulário */}
        <div className="space-y-4 px-8 py-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()}
              className="h-12 border-border text-[15px]" style={{ background: "#EEF2FB" }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Senha</Label>
            <Input id="pw" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()}
              className="h-12 border-border text-[15px]" style={{ background: "#EEF2FB" }} />
          </div>
          <Button className="h-12 w-full text-base" onClick={entrar} disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
        </div>
      </div>
    </div>
  );
}
