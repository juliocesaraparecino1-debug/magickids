import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { BottomNav } from './components/layout/BottomNav'
import { Login } from './pages/admin/Login'
import { Inicio } from './pages/admin/Inicio'
import { Agenda } from './pages/admin/Agenda'
import { ReservaDetalhe } from './pages/admin/ReservaDetalhe'
import { NovaReserva } from './pages/admin/NovaReserva'
import { Estoque } from './pages/admin/Estoque'
import { Pedidos } from './pages/admin/Pedidos'
import { Financeiro } from './pages/admin/Financeiro'
import { Ajustes } from './pages/admin/Ajustes'
import { Reservar } from './pages/public/Reservar'
import { Confirmacao } from './pages/public/Confirmacao'
import './styles/tokens.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function AdminShell() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto max-w-lg px-4 pt-4 pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] text-[var(--text-secondary)]">
        Carregando…
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Reservar />} />
          <Route path="/confirmacao" element={<Confirmacao />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminShell />
              </RequireAuth>
            }
          >
            <Route index element={<Inicio />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="agenda/nova" element={<NovaReserva />} />
            <Route path="agenda/:id" element={<ReservaDetalhe />} />
            <Route path="agenda/:id/editar" element={<NovaReserva />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="ajustes" element={<Ajustes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
