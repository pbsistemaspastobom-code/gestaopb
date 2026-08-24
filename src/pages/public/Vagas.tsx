import { Link } from "react-router-dom";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState } from "@/components/DataState";
import { useJobs } from "@/hooks/useRecrutamento";

export default function Vagas() {
  const { data, isLoading } = useJobs(true);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4"><img src="/logo.png" className="h-10 w-auto object-contain" /><span className="font-display font-bold text-primary">Trabalhe conosco</span></div></header>
      <main className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
        <h1 className="mb-6 font-display text-2xl font-bold">Vagas abertas</h1>
        {isLoading ? <LoadingState /> : (data ?? []).length === 0 ? <Card><CardContent><EmptyState text="Nenhuma vaga aberta no momento." /></CardContent></Card> : (
          <div className="grid gap-4">
            {(data ?? []).map((j) => (
              <Card key={j.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <h2 className="font-display text-lg font-semibold">{j.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {j.role_function && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{j.role_function}</span>}
                    {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span>}
                    {j.type && <Badge variant="secondary">{j.type}</Badge>}
                  </div>
                </div>
                <Button asChild><Link to={`/vaga/${j.id}`}>Ver vaga <ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent></Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
