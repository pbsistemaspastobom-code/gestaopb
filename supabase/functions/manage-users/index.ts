// Edge Function: manage-users
// Gestão de usuários com service_role (criar, listar, definir perfil, ativar/inativar, link de senha).
// Só administradores podem executar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente com o token do solicitante (para checar se é admin)
    const authHeader = req.headers.get("Authorization") ?? "";
    const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: udata } = await asUser.auth.getUser();
    const uid = udata?.user?.id;
    if (!uid) return json({ error: "Não autenticado." }, 401);

    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: roleRows } = await admin.from("user_roles").select("role, active").eq("user_id", uid);
    const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin" && r.active !== false);
    if (!isAdmin) return json({ error: "Apenas administradores." }, 403);

    const body = await req.json();
    const action = body.action as string;
    const redirectTo = (body.redirectTo as string) || `${new URL(req.url).origin}`;

    if (action === "list") {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const { data: roles } = await admin.from("user_roles").select("user_id, role, active");
      const rmap = new Map((roles ?? []).map((r: any) => [r.user_id, r]));
      const users = (list?.users ?? []).map((u: any) => {
        const r: any = rmap.get(u.id);
        return { id: u.id, email: u.email, role: r?.role ?? null, active: r ? r.active !== false : true, banned: !!u.banned_until };
      });
      return json({ users });
    }

    if (action === "create") {
      const { email, password, role } = body;
      let link: string | null = null;
      const createRes = await admin.auth.admin.createUser({
        email, password: password || undefined, email_confirm: true,
      });
      if (createRes.error) return json({ error: createRes.error.message }, 400);
      const newId = createRes.data.user!.id;
      await admin.from("user_roles").delete().eq("user_id", newId);
      await admin.from("user_roles").insert({ user_id: newId, role: role || "supervisao", active: true });
      if (!password) {
        const { data: linkData } = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
        link = linkData?.properties?.action_link ?? null;
      }
      return json({ ok: true, link });
    }

    if (action === "setRole") {
      const { userId, role } = body;
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.from("user_roles").insert({ user_id: userId, role, active: true });
      return json({ ok: true });
    }

    if (action === "setActive") {
      const { userId, active } = body;
      await admin.from("user_roles").update({ active }).eq("user_id", userId);
      // bloqueia/desbloqueia login de verdade
      await admin.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" });
      return json({ ok: true });
    }

    if (action === "passwordLink") {
      const { email } = body;
      const { data: linkData, error } = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, link: linkData?.properties?.action_link ?? null });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }

  function json(obj: unknown, status = 200) {
    return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
