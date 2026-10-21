import { usePedidosPendentes, useAprovarPedido, useRecusarPedido } from '../../hooks/usePedidos'
import { useItens } from '../../hooks/useItens'
import { formatCurrency, formatDate, formatPhone, waLink } from '../../lib/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { MessageCircle } from 'lucide-react'

export function Pedidos() {
  const { data: pedidos = [], isLoading } = usePedidosPendentes()
  const { data: itens = [] } = useItens()
  const aprovar = useAprovarPedido()
  const recusar = useRecusarPedido()

  const nomeItem = (id: string) => itens.find((i) => i.id === id)?.nome ?? id.slice(0, 8)

  return (
    <div className="space-y-4 pb-28">
      <h1 className="text-xl font-bold">Pedidos online</h1>
      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Carregando…</p>}
      {!isLoading && pedidos.length === 0 && (
        <Card className="p-6 text-center text-sm text-[var(--text-secondary)]">
          Nenhum pedido pendente.
        </Card>
      )}
      <div className="space-y-3">
        {pedidos.map((p) => (
          <Card key={p.id} className="p-4 space-y-3">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold">{p.cliente_nome}</p>
                <a
                  href={waLink(p.cliente_telefone)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--brand-from)] flex items-center gap-1 mt-0.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {formatPhone(p.cliente_telefone)}
                </a>
              </div>
              <p className="font-bold">{formatCurrency(p.total)}</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {formatDate(p.data_festa)}
              {p.hora_entrega && ` · entrega ${p.hora_entrega.slice(0, 5)}`} →{' '}
              {formatDate(p.data_retirada)}
              {p.hora_retirada && ` · ${p.hora_retirada.slice(0, 5)}`}
            </p>
            <p className="text-sm">{p.endereco}</p>
            <ul className="text-sm space-y-0.5">
              {(p.itens as { item_id: string; quantidade: number }[]).map((it, i) => (
                <li key={i}>
                  {it.quantidade}× {nomeItem(it.item_id)}
                </li>
              ))}
            </ul>
            {p.forma_pagamento && (
              <p className="text-xs text-[var(--text-secondary)]">Preferência: {p.forma_pagamento}</p>
            )}
            {p.observacoes && <p className="text-xs text-[var(--text-secondary)]">{p.observacoes}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                fullWidth
                disabled={recusar.isPending || aprovar.isPending}
                onClick={() => recusar.mutate(p.id)}
              >
                Recusar
              </Button>
              <Button
                fullWidth
                disabled={aprovar.isPending || recusar.isPending}
                onClick={() => aprovar.mutate(p.id)}
              >
                Aprovar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
