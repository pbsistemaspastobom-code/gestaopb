import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Job, Application, ApplicationStatus } from "@/lib/types";

export function useJobs(onlyActive = false) {
  return useQuery({
    queryKey: ["jobs", onlyActive],
    queryFn: async (): Promise<Job[]> => {
      let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (onlyActive) q = supabase.from("jobs").select("*").eq("active", true).order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Job[];
    },
  });
}

export function useJob(id?: string) {
  return useQuery({
    queryKey: ["job", id],
    enabled: !!id,
    queryFn: async (): Promise<Job | null> => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Job) ?? null;
    },
  });
}

export function useSaveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Job>) => {
      if (payload.id) {
        const { id, created_at, ...rest } = payload as any;
        const { error } = await supabase.from("jobs").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v: any) => { qc.invalidateQueries({ queryKey: ["jobs"] }); toast.success(v?.id ? "Vaga atualizada." : "Vaga criada."); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar vaga."),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("jobs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jobs"] }); toast.success("Vaga removida."); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover."),
  });
}

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async (): Promise<(Application & { job?: { title: string } })[]> => {
      const { data, error } = await supabase.from("applications").select("*, job:jobs(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); toast.success("Status atualizado."); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar."),
  });
}

export async function downloadResume(path: string) {
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 120);
  if (error || !data) { toast.error("Não foi possível gerar o link do currículo."); return; }
  window.open(data.signedUrl, "_blank");
}

// Candidatura pública (anon)
export async function submitApplication(input: {
  job_id: string; name: string; email: string; phone: string; file: File | null;
}) {
  let resume_path: string | null = null;
  if (input.file) {
    const ext = input.file.name.split(".").pop();
    const path = `${input.job_id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("resumes").upload(path, input.file);
    if (upErr) throw upErr;
    resume_path = path;
  }
  const { error } = await supabase.from("applications").insert({
    job_id: input.job_id, name: input.name, email: input.email, phone: input.phone, resume_path,
  });
  if (error) throw error;
}
