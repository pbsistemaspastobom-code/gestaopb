import { Card, CardContent } from "@/components/ui/card";
import { Inbox, AlertCircle } from "lucide-react";
export function LoadingState() {
  return <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" /></div>;
}
export function ErrorState({ message }: { message?: string }) {
  return <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center"><AlertCircle className="h-8 w-8 text-destructive" /><p className="font-medium">Não foi possível carregar.</p><p className="max-w-md text-sm text-muted-foreground">{message ?? "Verifique se a migração foi executada no Supabase."}</p></CardContent></Card>;
}
export function EmptyState({ text }: { text: string }) {
  return <div className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground"><Inbox className="h-8 w-8" /><p className="text-sm">{text}</p></div>;
}
