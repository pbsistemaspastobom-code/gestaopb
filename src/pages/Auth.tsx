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
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "#EEF2E9" }}>
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-xl">
        {/* Topo verde sólido (sem degradê) */}
        <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center" style={{ background: "#0F2E1E" }}>
          <div className="mb-4 rounded-2xl bg-white px-5 py-3 shadow-lg">
            <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="font-display text-[21px] font-extrabold leading-tight text-white">Gestão</h1>
          <p className="mt-1 text-[13px]" style={{ color: "#9FAE9B" }}>Pasto Bom · Rede do Campo</p>
        </div>

        {/* Formulário */}
        <div className="space-y-4 px-8 py-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()}
              className="h-12 text-[15px]" style={{ background: "#E8F0FE", borderColor: "#C0D2BE" }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Senha</Label>
            <Input id="pw" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()}
              className="h-12 text-[15px]" style={{ background: "#E8F0FE", borderColor: "#C0D2BE" }} />
          </div>
          <Button className="h-12 w-full text-base" onClick={entrar} disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
        </div>
      </div>
    </div>
  );
}
