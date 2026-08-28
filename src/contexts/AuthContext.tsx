import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gerente" | "supervisao";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  isGerente: boolean;
  isSupervisao: boolean;
  canManageUsers: boolean;   // só admin
  canEditMeta: boolean;      // admin + gerente
  canConfig: boolean;        // admin + gerente
  hasAccess: boolean;        // qualquer perfil ativo
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  const loadRole = async (uid: string | undefined) => {
    if (!uid) { setRole(null); setRoleLoading(false); return; }
    setRoleLoading(true);
    const { data } = await supabase.from("user_roles").select("role, active").eq("user_id", uid);
    const rows = (data ?? []).filter((r: any) => r.active !== false);
    // prioridade admin > gerente > supervisao
    const found = ["admin", "gerente", "supervisao"].find((r) => rows.some((x: any) => x.role === r)) as AppRole | undefined;
    setRole(found ?? null);
    setRoleLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      loadRole(data.session?.user?.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      loadRole(s?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };
  const signOut = async () => { await supabase.auth.signOut(); setRole(null); };

  const isAdmin = role === "admin";
  const isGerente = role === "gerente";
  const isSupervisao = role === "supervisao";

  return (
    <AuthContext.Provider value={{
      user, session, role, isAdmin, isGerente, isSupervisao,
      canManageUsers: isAdmin,
      canEditMeta: isAdmin || isGerente,
      canConfig: isAdmin || isGerente,
      hasAccess: !!role,
      loading, roleLoading, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
