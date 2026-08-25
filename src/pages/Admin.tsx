import { useState } from "react";
import { Sidebar, ModuleKey } from "@/components/layout/Sidebar";
import Recrutamento from "@/pages/admin/Recrutamento";
import Indicadores from "@/pages/admin/Indicadores";
import { CriarContaDialog, UsuariosDialog } from "@/pages/admin/Usuarios";

export default function Admin() {
  const [active, setActive] = useState<ModuleKey>("indicadores");
  const [criar, setCriar] = useState(false);
  const [usuarios, setUsuarios] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        active={active}
        onSelect={setActive}
        onCriarConta={() => setCriar(true)}
        onUsuarios={() => setUsuarios(true)}
      />
      <main className="flex-1 overflow-x-hidden px-5 py-8 md:px-10 lg:px-12 animate-fade-in">
        <div className="mx-auto max-w-6xl">
          {active === "recrutamento" && <Recrutamento />}
          {active === "indicadores" && <Indicadores />}
        </div>
      </main>

      <CriarContaDialog open={criar} onOpenChange={setCriar} />
      <UsuariosDialog open={usuarios} onOpenChange={setUsuarios} />
    </div>
  );
}
