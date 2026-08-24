// Edge Function: manage-users
// Cria/lista/exclui usuários e gerencia papéis. Só admins podem chamar.
// Deploy: supabase functions deploy manage-users --no-verify-jwt=false
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // valida o chamador como admin
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await caller.auth.getUser();
    const callerId = userData?.user?.id;
    if (!callerId) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(url, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "Acesso restrito a administradores" }, 403);

    const body = await req.json();
    const action = body.action;

    if (action === "list") {
      const { data: list } = await admin.auth.admin.listUsers();
      const { data: allRoles } = await admin.from("user_roles").select("user_id, role");
      const adminIds = new Set((allRoles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
      const users = (list?.users ?? []).map((u: any) => ({ id: u.id, email: u.email, isAdmin: adminIds.has(u.id) }));
      return json({ users });
    }

    if (action === "create") {
      const { email, password, makeAdmin } = body;
      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) return json({ error: error.message }, 400);
      const uid = created.user!.id;
      await admin.from("user_roles").insert({ user_id: uid, role: makeAdmin ? "admin" : "user" });
      return json({ ok: true, id: uid });
    }

    if (action === "setRole") {
      const { userId, role } = body;
      if (userId === callerId) return json({ error: "Não é possível alterar o próprio papel" }, 400);
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.from("user_roles").insert({ user_id: userId, role });
      return json({ ok: true });
    }

    if (action === "delete") {
      const { userId } = body;
      if (userId === callerId) return json({ error: "Não é possível excluir a si mesmo" }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "resetPassword") {
      const { userId, password } = body;
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
