import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ModulePlaceholder({ title, icon: Icon, subtabs }: { title: string; icon: any; subtabs: string[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-bold">{title}</h2></div>
      <Tabs defaultValue={subtabs[0]}>
        <TabsList>{subtabs.map((s) => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}</TabsList>
        {subtabs.map((s) => (
          <TabsContent key={s} value={s}>
            <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Construction className="h-8 w-8 text-gold" />
              <p className="font-display text-lg font-semibold">{title} · {s}</p>
              <p className="max-w-md text-sm text-muted-foreground">Módulo previsto na especificação, a ser construído na próxima etapa. A base de dados (tabelas, RLS e funções) já está pronta no banco.</p>
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
