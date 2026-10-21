import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useReservas } from '../../hooks/useReservas'
import { usePedidosPendentes } from '../../hooks/usePedidos'
import { useConfig } from '../../hooks/useConfig'
import { calcularAlertas, resumoDia } from '../../lib/alertas'
import { formatCurrency, formatDate } from '../../lib/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'

export function Inicio() {
  const hojeStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const { data: reservas = [] } = useReservas()
  const { data: pedidos = [] } = usePedidosPendentes()
  const { data: config } = useConfig()

  const { entregas, retiradas } = useMemo(() => resumoDia(reservas), [reservas])
  const alertas = useMemo(
    () => calcularAlertas(reservas, config, pedidos.length),
    [reservas, config, pedidos.length]
  )

  const { recebidoMes, aReceber } = useMemo(() => {
    const ini = startOfMonth(new Date())
    const fim = endOfMonth(new Date())
    let recebido = 0
    let falta = 0
    for (const r of reservas) {
      if (r.status === 'cancelada') continue
      // a receber: festas do mês com saldo
      const festa = parseISO(r.data_festa)
      if (isWithinInterval(festa, { start: ini, end: fim }) && r.falta > 0) {
        falta += r.falta
      }
      // recebido aproximado pelo pago de reservas do mês (melhor com tabela pagamentos na Fase 3)
      if (isWithinInterval(festa, { start: ini, end: fim })) {
        recebido += r.pago
      }
    }
    return { recebidoMes: recebido, aReceber: falta }
  }, [reservas])

  const proximas = useMemo(
    () =>
      reservas
        .filter((r) => r.status === 'agendada' || r.status === 'entregue')
        .slice(0, 5),
    [reservas]
  )

  return (
    <div className="space-y-5 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            magicKIDS
          </p>
          <h1 className="text-2xl font-bold text-[var(--text)] capitalize">{hojeStr}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {entregas} entrega{entregas !== 1 ? 's' : ''} e {retiradas} retirada{retiradas !== 1 ? 's' : ''} hoje
          </p>
        </div>
        <Link to="/admin/agenda/nova">
          <Button className="shrink-0">
            <Plus className="w-5 h-5" /> Nova reserva
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Recebido no mês</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(recebidoMes)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">A receber</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(aReceber)}</p>
        </Card>
      </div>

      {pedidos.length > 0 && (
        <Link to="/admin/pedidos">
          <Card className="p-4 border-[var(--brand-from)]/40 bg-[var(--highlight)]">
            <p className="font-semibold">
              {pedidos.length} pedido{pedidos.length > 1 ? 's' : ''} online aguardando
            </p>
            <p className="text-sm text-[var(--text-secondary)]">Toque para aprovar ou recusar</p>
          </Card>
        </Link>
      )}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Alertas
        </h2>
        {alertas.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--text-secondary)]">Nenhum alerta no momento.</Card>
        ) : (
          <div className="space-y-2">
            {alertas.map((a) => {
              const content = (
                <Card
                  key={a.id}
                  className={`p-3 text-sm border-l-4 ${
                    a.gravidade === 'urgente'
                      ? 'border-l-[var(--danger)]'
                      : a.gravidade === 'atencao'
                        ? 'border-l-[var(--warning)]'
                        : 'border-l-[var(--brand-from)]'
                  }`}
                >
                  {a.mensagem}
                </Card>
              )
              return a.reservaId ? (
                <Link key={a.id} to={`/admin/agenda/${a.reservaId}`}>
                  {content}
                </Link>
              ) : (
                <Link key={a.id} to="/admin/pedidos">
                  {content}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Próximas festas
        </h2>
        <div className="space-y-2">
          {proximas.map((r) => (
            <Link key={r.id} to={`/admin/agenda/${r.id}`}>
              <Card className="p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{r.cliente_nome}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatDate(r.data_festa)}</p>
                </div>
                <Chip label={r.status} />
              </Card>
            </Link>
          ))}
          {!proximas.length && (
            <Card className="p-4 text-sm text-[var(--text-secondary)]">Nenhuma reserva próxima.</Card>
          )}
        </div>
      </section>
    </div>
  )
}
