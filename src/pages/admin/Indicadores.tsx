import { BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Painel from "@/pages/admin/kpi/Painel";
import Lancamento from "@/pages/admin/kpi/Lancamento";
import Configuracao from "@/pages/admin/kpi/Configuracao";

export default function Indicadores() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-bold">Indicadores (KPI)</h2></div>
      <Tabs defaultValue="painel">
        <TabsList>
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="lancamento">Lançamento de Resultados</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>
        <TabsContent value="painel"><Painel /></TabsContent>
        <TabsContent value="lancamento"><Lancamento /></TabsContent>
        <TabsContent value="config"><Configuracao /></TabsContent>
      </Tabs>
    </div>
  );
}
