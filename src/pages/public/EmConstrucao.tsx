import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <img src="/logo.png" className="h-16 w-auto object-contain" />
      <Construction className="h-10 w-10 text-gold" />
      <h1 className="font-display text-xl font-bold">{titulo}</h1>
      <p className="max-w-md text-sm text-muted-foreground">Este portal faz parte da especificação e será construído na próxima etapa. As tabelas e políticas já existem no banco.</p>
      <Button asChild variant="outline"><Link to="/auth">Ir para o login</Link></Button>
    </div>
  );
}
