import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Perspective, Objective, Indicator, KpiValue } from "@/lib/kpi";

export function useKpiData(year: number) {
  const perspectives = useQuery({
    queryKey: ["kpi_perspectives"],
    queryFn: async (): Promise<Perspective[]> => {
      const { data, error } = await supabase.from("kpi_perspectives").select("*").order("ord");
      if (error) throw error; return (data ?? []) as Perspective[];
    },
  });
  const objectives = useQuery({
    queryKey: ["kpi_objectives"],
    queryFn: async (): Promise<Objective[]> => {
      const { data, error } = await supabase.from("kpi_objectives").select("*").order("ord");
      if (error) throw error; return (data ?? []) as Objective[];
    },
  });
  const indicators = useQuery({
    queryKey: ["kpi_indicators"],
    queryFn: async (): Promise<Indicator[]> => {
      const { data, error } = await supabase.from("kpi_indicators").select("*").order("ord");
      if (error) throw error; return (data ?? []) as Indicator[];
    },
  });
  const values = useQuery({
    queryKey: ["kpi_values", year],
    queryFn: async (): Promise<KpiValue[]> => {
      const { data, error } = await supabase.from("kpi_values").select("*").eq("year", year);
      if (error) throw error; return (data ?? []) as KpiValue[];
    },
  });
  return { perspectives, objectives, indicators, values,
    isLoading: perspectives.isLoading || objectives.isLoading || indicators.isLoading || values.isLoading,
    isError: perspectives.isError || objectives.isError || indicators.isError || values.isError };
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  ["kpi_perspectives","kpi_objectives","kpi_indicators","kpi_values"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

// ---- CRUD genérico para as 3 tabelas de estrutura ----
export function useKpiCrud(table: "kpi_perspectives" | "kpi_objectives" | "kpi_indicators") {
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) { const { id, ...rest } = payload; const { error } = await supabase.from(table).update(rest).eq("id", id); if (error) throw error; }
      else { const { error } = await supabase.from(table).insert(payload); if (error) throw error; }
    },
    onSuccess: () => { invalidateAll(qc); toast.success("Salvo."); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(table).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { invalidateAll(qc); toast.success("Removido."); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover."),
  });
  const reorder = useMutation({
    mutationFn: async ({ a, b }: { a: { id: string; ord: number }; b: { id: string; ord: number } }) => {
      const e1 = await supabase.from(table).update({ ord: b.ord }).eq("id", a.id);
      const e2 = await supabase.from(table).update({ ord: a.ord }).eq("id", b.id);
      if (e1.error) throw e1.error; if (e2.error) throw e2.error;
    },
    onSuccess: () => invalidateAll(qc),
    onError: (e: any) => toast.error(e?.message ?? "Erro ao reordenar."),
  });
  return { save, remove, reorder };
}

// ---- Meta (somente admin) ----
export function useSetTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ indicator_id, year, month, target }: { indicator_id: string; year: number; month: number; target: number | null }) => {
      const { data: existing } = await supabase.from("kpi_values").select("id").eq("indicator_id", indicator_id).eq("year", year).eq("month", month).maybeSingle();
      if (existing) { const { error } = await supabase.from("kpi_values").update({ target }).eq("id", existing.id); if (error) throw error; }
      else { const { error } = await supabase.from("kpi_values").insert({ indicator_id, year, month, target }); if (error) throw error; }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kpi_values"] }),
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar meta."),
  });
}

// ---- Realizado (via função SECURITY DEFINER; usuário comum pode) ----
export function useSetActual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ indicator_id, year, month, actual }: { indicator_id: string; year: number; month: number; actual: number | null }) => {
      const { error } = await supabase.rpc("set_kpi_actual", { _indicator_id: indicator_id, _year: year, _month: month, _actual: actual });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kpi_values"] }),
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar realizado."),
  });
}
