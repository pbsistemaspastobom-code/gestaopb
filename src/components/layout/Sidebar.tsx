import { Briefcase, BarChart3, Settings, LogOut, UserPlus, Users, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export type ModuleKey = "recrutamento" | "indicadores";

const ROLE_LABEL: Record<string, string> = { admin: "Administrador", gerente: "Gerente", supervisao: "Supervisão" };

export function Sidebar({
  active, onSelect, onCriarConta, onUsuarios,
}: {
  active: ModuleKey; onSelect: (k: ModuleKey) => void;
  onCriarConta: () => void; onUsuarios: () => void;
}) {
  const { user, role, canManageUsers, signOut } = useAuth();
  const [openMobile, setOpenMobile] = useState(false);

  const items: { key: ModuleKey; label: string; icon: any }[] = [
    { key: "recrutamento", label: "Recrutamento", icon: Briefcase },
    { key: "indicadores", label: "Painel de KPI", icon: BarChart3 },
  ];

  const content = (
    // h-screen fixo + flex-col: o topo rola se precisar, o rodapé (usuário/Sair) fica sempre visível
    <aside className="flex h-screen w-[264px] flex-col border-r border-border bg-card shadow-sm">
      {/* topo: logo + navegação — rola se a lista crescer */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="mb-8 flex items-center gap-3 px-6">
          <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-11 w-auto max-w-[190px] object-contain" />
        </div>
        <nav className="flex flex-col gap-1 px-4">
          {items.map((it) => {
            const on = active === it.key;
            return (
              <button key={it.key} onClick={() => { onSelect(it.key); setOpenMobile(false); }}
                className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors",
                  on ? "bg-primary-container text-primary-container-foreground font-semibold" : "text-muted-foreground hover:bg-surface-low font-medium")}>
                <it.icon className="h-5 w-5" /><span>{it.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* rodapé fixo: nunca sai da tela */}
      <div className="shrink-0 space-y-1 border-t border-border bg-card px-4 py-4">
        {canManageUsers && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-muted-foreground transition-colors hover:bg-surface-low">
                <Settings className="h-5 w-5" /> <span>Configurações</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>Gestão de usuários</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCriarConta}><UserPlus className="h-4 w-4" /> Criar usuário</DropdownMenuItem>
              <DropdownMenuItem onClick={onUsuarios}><Users className="h-4 w-4" /> Gerenciar usuários</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="rounded-xl border border-border bg-surface-low/50 p-3">
          <div className="truncate text-xs font-semibold text-foreground">{user?.email}</div>
          <div className="text-[11px] text-muted-foreground">{role ? ROLE_LABEL[role] : "Sem perfil"}</div>
          <button onClick={signOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block">{content}</div>
      <button className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-card p-2 shadow-sm md:hidden" onClick={() => setOpenMobile(true)}>
        <Menu className="h-5 w-5" />
      </button>
      {openMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenMobile(false)} />
          <div className="absolute left-0 top-0 h-full">
            <button className="absolute right-[-44px] top-4 rounded-lg bg-card p-2 shadow" onClick={() => setOpenMobile(false)}><X className="h-5 w-5" /></button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
