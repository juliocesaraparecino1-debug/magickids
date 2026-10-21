import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useReservas } from '../../hooks/useReservas'
import { formatCurrency, formatDate } from '../../lib/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { isAfter, parseISO, startOfDay } from 'date-fns'

type Filtro = 'proximas' | 'saldo' | 'historico' | 'todas'

export function Agenda() {
  const { data: reservas = [], isLoading } = useReservas()
  const [filtro, setFiltro] = useState<Filtro>('proximas')
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => {
    const hoje = startOfDay(new Date())
    let list = [...reservas]

    if (filtro === 'proximas') {
      list = list.filter(
        (r) =>
          r.status !== 'cancelada' &&
          r.status !== 'recolhida' &&
          !isAfter(hoje, parseISO(r.data_retirada))
      )
    } else if (filtro === 'saldo') {
      list = list.filter((r) => r.falta > 0 && r.status !== 'cancelada')
    } else if (filtro === 'historico') {
      list = list.filter((r) => r.status === 'recolhida' || r.status === 'cancelada')
    }

    if (busca.trim()) {
      const q = busca.toLowerCase()
      list = list.filter(
        (r) =>
          r.cliente_nome.toLowerCase().includes(q) ||
          (r.endereco ?? '').toLowerCase().includes(q) ||
          (r.cliente_telefone ?? '').includes(q)
      )
    }

    return list
  }, [reservas, filtro, busca])

  const filtros: { id: Filtro; label: string }[] = [
    { id: 'proximas', label: 'Próximas' },
    { id: 'saldo', label: 'Com saldo' },
    { id: 'historico', label: 'Histórico' },
    { id: 'todas', label: 'Todas' },
  ]

  return (
    <div className="space-y-4 pb-28">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Agenda</h1>
        <Link to="/admin/agenda/nova">
          <Button>
            <Plus className="w-5 h-5" /> Nova
          </Button>
        </Link>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente, endereço, telefone…"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-10 pr-3 py-3 text-[16px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-from)]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {filtros.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium min-h-[36px] transition-colors ${
              filtro === f.id
                ? 'text-white bg-[image:var(--brand-gradient)]'
                : 'bg-[var(--highlight)] text-[var(--text-secondary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Carregando…</p>}

      <div className="space-y-3">
        {lista.map((r) => (
          <Link key={r.id} to={`/admin/agenda/${r.id}`}>
            <Card className="p-4 active:scale-[0.99] transition-transform">
              <div className="flex gap-3">
                <div className="shrink-0 w-14 text-center">
                  <p className="text-2xl font-bold text-[var(--text)] leading-none">
                    {formatDate(r.data_festa, 'dd')}
                  </p>
                  <p className="text-xs uppercase text-[var(--text-secondary)]">
                    {formatDate(r.data_festa, 'MMM')}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.cliente_nome}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {r.hora_entrega?.slice(0, 5) ?? '—'} → {r.hora_retirada?.slice(0, 5) ?? '—'} ·{' '}
                    {r.data_retirada !== r.data_festa && `até ${formatDate(r.data_retirada)}`}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Chip label={r.status} />
                    <Chip
                      label={
                        r.situacao_pagamento === 'Parcial'
                          ? `Falta ${formatCurrency(r.falta)}`
                          : r.situacao_pagamento
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {!isLoading && lista.length === 0 && (
          <Card className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma reserva encontrada.
          </Card>
        )}
      </div>
    </div>
  )
}
