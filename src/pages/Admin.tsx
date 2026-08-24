import { useState } from "react";
import { Settings, LogOut, UserPlus, Users, Briefcase, BarChart3, ClipboardCheck, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import Recrutamento from "@/pages/admin/Recrutamento";
import { ModulePlaceholder } from "@/pages/admin/ModulePlaceholder";
import Indicadores from "@/pages/admin/Indicadores";
import { CriarContaDialog, UsuariosDialog } from "@/pages/admin/Usuarios";

export default function Admin() {
  const { user, signOut } = useAuth();
  const [criar, setCriar] = useState(false);
  const [usuarios, setUsuarios] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Pasto Bom" className="h-9 w-auto object-contain" />
            <span className="hidden font-display font-bold text-primary sm:inline">Pasto Bom Gestão</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Settings className="h-4 w-4" /> Configurações</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCriar(true)}><UserPlus className="h-4 w-4" /> Criar Conta</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUsuarios(true)}><Users className="h-4 w-4" /> Usuários</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Sair</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 animate-fade-in">
        <Tabs defaultValue="recrutamento">
          <div className="overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="recrutamento"><Briefcase className="mr-1 h-4 w-4" /> Recrutamento</TabsTrigger>
              <TabsTrigger value="kpi"><BarChart3 className="mr-1 h-4 w-4" /> Indicadores</TabsTrigger>
              <TabsTrigger value="avaliacao"><ClipboardCheck className="mr-1 h-4 w-4" /> Avaliação</TabsTrigger>
              <TabsTrigger value="pesquisa"><MessageSquare className="mr-1 h-4 w-4" /> Pesquisa</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="recrutamento"><Recrutamento /></TabsContent>
          <TabsContent value="kpi"><Indicadores /></TabsContent>
          <TabsContent value="avaliacao"><ModulePlaceholder title="Avaliação de Desempenho" icon={ClipboardCheck} subtabs={["Gestão", "Resultados", "Criar com IA"]} /></TabsContent>
          <TabsContent value="pesquisa"><ModulePlaceholder title="Pesquisa" icon={MessageSquare} subtabs={["Gestão", "Resultados", "Criar com IA"]} /></TabsContent>
        </Tabs>
      </main>

      <CriarContaDialog open={criar} onOpenChange={setCriar} />
      <UsuariosDialog open={usuarios} onOpenChange={setUsuarios} />
    </div>
  );
}
