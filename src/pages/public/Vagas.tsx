import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, ArrowRight, Wallet, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState, EmptyState } from "@/components/DataState";
import { useJobs } from "@/hooks/useRecrutamento";

export default function Vagas() {
  const { data, isLoading } = useJobs(true);
  const [busca, setBusca] = useState("");

  const vagas = data ?? [];
  const filtradas = vagas.filter((j) =>
    !busca.trim() ||
    j.title.toLowerCase().includes(busca.toLowerCase()) ||
    (j.location ?? "").toLowerCase().includes(busca.toLowerCase()) ||
    (j.role_function ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#EEF2E9" }}>
      {/* Banner com a marca */}
      <header className="text-white" style={{ background: "#0F2E1E" }}>
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:py-14">
          <div className="mb-5 inline-flex rounded-2xl bg-white px-5 py-3 shadow-lg">
            <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-11 w-auto object-contain" />
          </div>
          <h1 className="font-display text-[26px] font-extrabold sm:text-[32px]">Trabalhe conosco</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: "#9FAE9B" }}>
            Faça parte da Rede do Campo — Pasto Bom. Confira as vagas abertas e candidate-se em poucos minutos.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {/* Resumo + busca */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-display text-2xl font-extrabold" style={{ color: "#1C4416" }}>{vagas.length}</span>
            <span className="ml-2 text-sm font-semibold text-muted-foreground">vaga{vagas.length !== 1 ? "s" : ""} aberta{vagas.length !== 1 ? "s" : ""}</span>
          </div>
          {vagas.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por cargo ou local..." value={busca} onChange={(e) => setBusca(e.target.value)} className="rounded-full bg-card pl-9" />
            </div>
          )}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : vagas.length === 0 ? (
          <Card className="rounded-2xl"><CardContent><EmptyState text="Nenhuma vaga aberta no momento. Volte em breve!" /></CardContent></Card>
        ) : filtradas.length === 0 ? (
          <Card className="rounded-2xl"><CardContent><EmptyState text="Nenhuma vaga encontrada para essa busca." /></CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {filtradas.map((j) => (
              <Card key={j.id} className="group overflow-hidden rounded-2xl border-border transition-shadow hover:shadow-lg">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-bold" style={{ color: "#1C4416" }}>{j.title}</h2>
                    {j.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                      {j.role_function && <span className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4 shrink-0" style={{ color: "#3A7D2E" }} />{j.role_function}</span>}
                      {j.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" style={{ color: "#3A7D2E" }} />{j.location}</span>}
                      {j.compensation && <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4 shrink-0" style={{ color: "#3A7D2E" }} />{j.compensation}</span>}
                    </div>
                  </div>
                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                    {j.type && <Badge className="w-fit" style={{ background: "#D8F3DC", color: "#1C4416" }}>{j.type}</Badge>}
                    <Button asChild className="w-full sm:w-auto"><Link to={`/vaga/${j.id}`}>Ver vaga e se candidatar <ArrowRight className="h-4 w-4" /></Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Rede do Campo — Pasto Bom
      </footer>
    </div>
  );
}
