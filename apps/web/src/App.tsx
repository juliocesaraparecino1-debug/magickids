import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { BottomNav } from './components/layout/BottomNav'
import { Login } from './pages/admin/Login'
import { Inicio } from './pages/admin/Inicio'
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

function Placeholder({ title }: { title: string }) {
  return (
    <div className="pb-28">
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-[var(--text-secondary)]">
        Tela em construção — Fase 1. Os dados já estão no Supabase.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Placeholder title="Página pública de reservas" />} />
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
            <Route path="agenda" element={<Placeholder title="Agenda" />} />
            <Route path="agenda/nova" element={<Placeholder title="Nova reserva" />} />
            <Route path="pedidos" element={<Placeholder title="Pedidos online" />} />
            <Route path="estoque" element={<Placeholder title="Estoque" />} />
            <Route path="financeiro" element={<Placeholder title="Financeiro" />} />
            <Route path="ajustes" element={<Placeholder title="Ajustes" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
