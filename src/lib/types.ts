export type ApplicationStatus = "received" | "reviewing" | "interview" | "approved" | "rejected";
export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; variant: "muted" | "secondary" | "gold" | "ontarget" | "critical" }> = {
  received: { label: "Recebida", variant: "muted" },
  reviewing: { label: "Em análise", variant: "secondary" },
  interview: { label: "Entrevista", variant: "gold" },
  approved: { label: "Aprovada", variant: "ontarget" },
  rejected: { label: "Reprovada", variant: "critical" },
};
export const APPLICATION_STATUS_LIST = Object.entries(APPLICATION_STATUS).map(([value, m]) => ({ value: value as ApplicationStatus, ...m }));

export interface Job {
  id: string; title: string; description: string | null; role_function: string | null;
  requirements: string | null; compensation: string | null; location: string | null;
  type: string | null; active: boolean; created_at: string;
}
export interface Application {
  id: string; job_id: string | null; name: string; email: string; phone: string | null;
  resume_path: string | null; status: ApplicationStatus; created_at: string;
}
