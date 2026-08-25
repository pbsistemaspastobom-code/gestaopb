import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Painel from "@/pages/admin/kpi/Painel";
import Lancamento from "@/pages/admin/kpi/Lancamento";
import Configuracao from "@/pages/admin/kpi/Configuracao";

export default function Indicadores() {
  return (
    <Tabs defaultValue="painel">
      <TabsList className="mb-2">
        <TabsTrigger value="painel">Painel de KPI</TabsTrigger>
        <TabsTrigger value="lancamento">Indicadores</TabsTrigger>
        <TabsTrigger value="config">Configuração</TabsTrigger>
      </TabsList>
      <TabsContent value="painel"><Painel /></TabsContent>
      <TabsContent value="lancamento"><Lancamento /></TabsContent>
      <TabsContent value="config"><Configuracao /></TabsContent>
    </Tabs>
  );
}
