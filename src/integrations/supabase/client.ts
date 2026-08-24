import { createClient } from "@supabase/supabase-js";

// Credenciais do Supabase (a chave publishable/anon é pública por design — pode ficar no cliente).
// Usa variáveis de ambiente se existirem; senão, cai nos valores fixos abaixo.
const url = import.meta.env.VITE_SUPABASE_URL || "https://grgpmdtpteljwvrcxpsb.supabase.co";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ3BtZHRwdGVsand2cmN4cHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTg2MzQsImV4cCI6MjA4NjM5NDYzNH0.Kbz5tEXRtw54dOk07DQ3QvA-Kvdh0hYLgOnjbtI3zlM";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "pb-gestao-auth" },
});
