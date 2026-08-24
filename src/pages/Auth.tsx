import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const { user, loading, roleLoading, isAdmin, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !roleLoading && user) return <Navigate to={isAdmin ? "/admin" : "/kpis"} replace />;

  const entrar = async () => {
    if (!email || !password) { toast.error("Preencha e-mail e senha."); return; }
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) toast.error("Credenciais inválidas.");
    else toast.success("Bem-vindo!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/60 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-lg animate-fade-in">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/logo.png" alt="Rede do Campo / Pasto Bom" className="mb-4 h-24 w-auto object-contain" />
            <h1 className="font-display text-xl font-bold text-primary">Pasto Bom Gestão</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acesso restrito</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} /></div>
            <div className="space-y-2"><Label htmlFor="pw">Senha</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} /></div>
            <Button className="w-full" onClick={entrar} disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
            <p className="text-center text-xs text-muted-foreground">Contas são criadas por um administrador.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
