import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message)
      return
    }
    navigate('/admin')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[var(--bg)]">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3"
            style={{ backgroundImage: 'var(--brand-gradient)' }}
            aria-hidden
          >
            🎈
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">magicKIDS</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Painel do dono</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-[16px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-from)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-[16px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-from)]"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
