import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatNumberBR(value: number | null | undefined, unit?: string): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const u = (unit ?? "").trim();
  if (u === "R$") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (u === "%") return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  const n = value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return u ? `${n} ${u}` : n;
}
