import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import Painel from "@/pages/admin/kpi/Painel";
import Lancamento from "@/pages/admin/kpi/Lancamento";

export default function Kpis() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3"><img src="/logo.png" className="h-9 w-auto object-contain" /><span className="font-display font-bold text-primary">Pasto Bom Gestão</span></div>
        <div className="flex items-center gap-2"><span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span><Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Sair</Button></div>
      </div></header>
      <main className="mx-auto max-w-6xl px-4 py-6 animate-fade-in">
        <Tabs defaultValue="painel">
          <TabsList><TabsTrigger value="painel">Painel</TabsTrigger><TabsTrigger value="lancamento">Lançamento de Resultados</TabsTrigger></TabsList>
          <TabsContent value="painel"><Painel /></TabsContent>
          <TabsContent value="lancamento"><Lancamento /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
