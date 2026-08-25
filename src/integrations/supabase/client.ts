import { createClient } from "@supabase/supabase-js";

// Projeto Supabase oficial do sistema (gqyodqunriyfhwzytpji).
// URL e chave anon (pública, feita pra ficar no cliente) fixas — sem depender
// de variáveis de ambiente, pra garantir que sempre batem entre si.
const url = "https://gqyodqunriyfhwzytpji.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeW9kcXVucml5Zmh3enl0cGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTEyNzMsImV4cCI6MjEwMDgyNzI3M30.gLVD1rKyV9SAmXSk0J9PqOTq6lsDN4tx49UVEGVLXY4";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "pb-gestao-auth" },
});
