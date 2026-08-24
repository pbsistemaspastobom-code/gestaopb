import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
if (!url || !key) console.warn("[Pasto Bom Gestão] Variáveis do Supabase ausentes (.env)");
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "pb-gestao-auth" },
});
