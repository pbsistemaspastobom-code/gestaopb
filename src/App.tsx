import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingState } from "@/components/DataState";

const Auth = lazy(() => import("@/pages/Auth"));
const Admin = lazy(() => import("@/pages/Admin"));
const Kpis = lazy(() => import("@/pages/Kpis"));
const Vagas = lazy(() => import("@/pages/public/Vagas"));
const VagaDetalhe = lazy(() => import("@/pages/public/VagaDetalhe"));
const EmConstrucao = lazy(() => import("@/pages/public/EmConstrucao"));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingState /></div>}>
            <Routes>
              {/* Público */}
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<EmConstrucao titulo="Redefinição de senha" />} />
              <Route path="/vagas" element={<Vagas />} />
              <Route path="/vaga/:id" element={<VagaDetalhe />} />
              <Route path="/pesquisa/:id" element={<EmConstrucao titulo="Responder Pesquisa" />} />
              <Route path="/avaliacao/:token" element={<EmConstrucao titulo="Avaliação de Desempenho" />} />
              {/* Protegido */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/kpis" element={<ProtectedRoute><Kpis /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </Suspense>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
