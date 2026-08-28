import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Painel from "@/pages/admin/kpi/Painel";
import Lancamento from "@/pages/admin/kpi/Lancamento";
import Configuracao from "@/pages/admin/kpi/Configuracao";
import { useAuth } from "@/contexts/AuthContext";

export default function Indicadores() {
  const { canConfig } = useAuth();
  return (
    <Tabs defaultValue="painel">
      <TabsList className="mb-2">
        <TabsTrigger value="painel">Painel de KPI</TabsTrigger>
        <TabsTrigger value="lancamento">Lançar resultados</TabsTrigger>
        {canConfig && <TabsTrigger value="config">Configuração</TabsTrigger>}
      </TabsList>
      <TabsContent value="painel"><Painel /></TabsContent>
      <TabsContent value="lancamento"><Lancamento /></TabsContent>
      {canConfig && <TabsContent value="config"><Configuracao /></TabsContent>}
    </Tabs>
  );
}
