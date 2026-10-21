import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  useReserva,
  useReservaItens,
  usePagamentos,
  useAtualizarStatus,
  useRegistrarPagamento,
  useRemoverPagamento,
} from '../../hooks/useReservas'
import { formatCurrency, formatDate, formatPhone, waLink } from '../../lib/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { ArrowLeft, MessageCircle, MapPin, Trash2 } from 'lucide-react'

export function ReservaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: reserva, isLoading } = useReserva(id)
  const { data: itens = [] } = useReservaItens(id)
  const { data: pagamentos = [] } = usePagamentos(id)
  const atualizarStatus = useAtualizarStatus()
  const registrarPagamento = useRegistrarPagamento()
  const removerPagamento = useRemoverPagamento()

  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix')

  if (isLoading || !reserva) {
    return <p className="text-[var(--text-secondary)] pb-28">Carregando…</p>
  }

  const falta = reserva.falta

  async function handlePagamento(e: React.FormEvent) {
    e.preventDefault()
    const v = parseFloat(valor.replace(',', '.'))
    if (!v || v <= 0) return
    await registrarPagamento.mutateAsync({
      reserva_id: reserva!.id,
      valor: v,
      forma,
    })
    setValor('')
  }

  return (
    <div className="space-y-4 pb-28">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--highlight)]"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{reserva.cliente_nome}</h1>
          <div className="flex gap-1.5 mt-1">
            <Chip label={reserva.status} />
            <Chip label={reserva.situacao_pagamento} />
          </div>
        </div>
      </header>

      <Card className="p-4 space-y-2 text-sm">
        {reserva.cliente_telefone && (
          <a
            href={waLink(reserva.cliente_telefone)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-[var(--brand-from)] font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            {formatPhone(reserva.cliente_telefone)}
          </a>
        )}
        {reserva.endereco && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(reserva.endereco)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-2 text-[var(--text)]"
          >
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            {reserva.endereco}
          </a>
        )}
        <p>
          <span className="text-[var(--text-secondary)]">Festa:</span>{' '}
          {formatDate(reserva.data_festa)}
          {reserva.hora_entrega && ` · entrega ${reserva.hora_entrega.slice(0, 5)}`}
        </p>
        <p>
          <span className="text-[var(--text-secondary)]">Retirada:</span>{' '}
          {formatDate(reserva.data_retirada)}
          {reserva.hora_retirada && ` · ${reserva.hora_retirada.slice(0, 5)}`}
        </p>
        {reserva.observacoes && (
          <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{reserva.observacoes}</p>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
          Itens
        </h2>
        <ul className="space-y-1.5 text-sm">
          {itens.map((ri) => (
            <li key={ri.id} className="flex justify-between gap-2">
              <span>
                {ri.quantidade}× {(ri.item as { nome?: string })?.nome ?? 'Item'}
              </span>
              <span className="text-[var(--text-secondary)]">
                {formatCurrency(ri.quantidade * ri.preco_unitario)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total</p>
            <p className="font-bold">{formatCurrency(reserva.total)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Pago</p>
            <p className="font-bold text-[var(--success)]">{formatCurrency(reserva.pago)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Falta</p>
            <p className="font-bold text-[var(--danger)]">{formatCurrency(falta)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Pagamentos
        </h2>
        {pagamentos.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm gap-2">
            <div>
              <span className="font-medium">{formatCurrency(p.valor)}</span>
              <span className="text-[var(--text-secondary)]"> · {p.forma} · {formatDate(p.pago_em)}</span>
            </div>
            <button
              type="button"
              aria-label="Remover pagamento"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--danger)]"
              onClick={() => removerPagamento.mutate({ id: p.id, reservaId: reserva.id })}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {falta > 0 && (
          <form onSubmit={handlePagamento} className="space-y-2 pt-2 border-t border-[var(--border)]">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder={falta.toFixed(2)}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-[16px]"
              />
              <select
                value={forma}
                onChange={(e) => setForma(e.target.value as typeof forma)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2 text-[16px]"
              >
                <option>Pix</option>
                <option>Dinheiro</option>
                <option>Cartão</option>
              </select>
            </div>
            <Button type="submit" fullWidth disabled={registrarPagamento.isPending}>
              Registrar pagamento
            </Button>
          </form>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        {reserva.status === 'agendada' && (
          <Button
            onClick={() => atualizarStatus.mutate({ id: reserva.id, status: 'entregue' })}
            disabled={atualizarStatus.isPending}
          >
            Marcar entregue
          </Button>
        )}
        {reserva.status === 'entregue' && (
          <Button
            onClick={() => atualizarStatus.mutate({ id: reserva.id, status: 'recolhida' })}
            disabled={atualizarStatus.isPending}
          >
            Marcar recolhido
          </Button>
        )}
        {reserva.status !== 'cancelada' && (
          <Button
            variant="secondary"
            onClick={() => atualizarStatus.mutate({ id: reserva.id, status: 'cancelada' })}
          >
            Cancelar reserva
          </Button>
        )}
        {reserva.status === 'cancelada' && (
          <Button
            variant="secondary"
            onClick={() => atualizarStatus.mutate({ id: reserva.id, status: 'agendada' })}
          >
            Reativar
          </Button>
        )}
        <Link to={`/admin/agenda/${reserva.id}/editar`}>
          <Button variant="ghost" fullWidth>
            Editar
          </Button>
        </Link>
      </div>
    </div>
  )
}
