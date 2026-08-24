import { useState } from "react";
import { toast } from "sonner";
import { Share2, Copy, ExternalLink, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DivulgacaoVagas() {
  const url = `${window.location.origin}/vagas`;
  const [copied, setCopied] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado! Cole no WhatsApp, redes sociais ou onde quiser divulgar.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o link manualmente.");
    }
  };

  return (
    <Card className="mb-4 border-primary/30 bg-secondary/40">
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2 text-primary">
          <Share2 className="h-5 w-5" />
          <span className="font-display font-semibold">Divulgar vagas</span>
        </div>
        <p className="w-full text-sm text-muted-foreground sm:w-auto sm:flex-1">
          Compartilhe este link. Qualquer pessoa vê as vagas ativas e se candidata (sem precisar de login).
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input readOnly value={url} onClick={(e) => (e.target as HTMLInputElement).select()} className="min-w-[220px] flex-1 bg-background text-sm" />
          <Button variant="outline" size="icon" onClick={copiar} title="Copiar link">
            {copied ? <Check className="h-4 w-4 text-kpi-ontarget" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => window.open(url, "_blank")} title="Abrir página pública">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Botão para copiar o link de UMA vaga específica
export function CopiarLinkVaga({ jobId }: { jobId: string }) {
  const copiar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/vaga/${jobId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link da vaga copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };
  return (
    <Button variant="ghost" size="icon" onClick={copiar} title="Copiar link desta vaga">
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
