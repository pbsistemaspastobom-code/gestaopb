import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/DataState";

export function ProtectedRoute({ children, requireAdmin = false }: { children: JSX.Element; requireAdmin?: boolean }) {
  const { user, loading, roleLoading, isAdmin } = useAuth();
  // Nunca decide antes de sessão E papel terminarem de carregar
  if (loading || roleLoading) return <div className="flex h-screen items-center justify-center"><LoadingState /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/kpis" replace />;
  return children;
}
