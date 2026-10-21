import { useMemo } from 'react'
import { useReservas } from '../../hooks/useReservas'
import { formatCurrency } from '../../lib/format'
import { Card } from '../../components/ui/Card'
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  format,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Financeiro() {
  const { data: reservas = [] } = useReservas()

  const stats = useMemo(() => {
    const agora = new Date()
    const meses: {
      key: string
      label: string
      festas: number
      faturado: number
      recebido: number
      aReceber: number
    }[] = []

    for (let i = 0; i < 6; i++) {
      const ref = subMonths(agora, i)
      const ini = startOfMonth(ref)
      const fim = endOfMonth(ref)
      let festas = 0
      let faturado = 0
      let recebido = 0
      let aReceber = 0
      for (const r of reservas) {
        if (r.status === 'cancelada') continue
        const festa = parseISO(r.data_festa)
        if (isWithinInterval(festa, { start: ini, end: fim })) {
          festas++
          faturado += Number(r.total)
          recebido += Number(r.pago)
          aReceber += Number(r.falta)
        }
      }
      meses.push({
        key: format(ref, 'yyyy-MM'),
        label: format(ref, 'MMM yyyy', { locale: ptBR }),
        festas,
        faturado,
        recebido,
        aReceber,
      })
    }

    const mesAtual = meses[0]
    const ticketMedio = mesAtual.festas ? mesAtual.faturado / mesAtual.festas : 0
    return { meses, mesAtual, ticketMedio }
  }, [reservas])

  return (
    <div className="space-y-4 pb-28">
      <h1 className="text-xl font-bold">Financeiro</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase">Faturado (mês)</p>
          <p className="text-xl font-bold">{formatCurrency(stats.mesAtual.faturado)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase">Recebido (mês)</p>
          <p className="text-xl font-bold">{formatCurrency(stats.mesAtual.recebido)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase">A receber</p>
          <p className="text-xl font-bold">{formatCurrency(stats.mesAtual.aReceber)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase">Ticket médio</p>
          <p className="text-xl font-bold">{formatCurrency(stats.ticketMedio)}</p>
        </Card>
      </div>

      <Card className="p-4 overflow-x-auto">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Por mês
        </h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[var(--text-secondary)] text-xs">
              <th className="pb-2 pr-2">Mês</th>
              <th className="pb-2 pr-2">Festas</th>
              <th className="pb-2 pr-2">Faturado</th>
              <th className="pb-2 pr-2">Recebido</th>
              <th className="pb-2">A receber</th>
            </tr>
          </thead>
          <tbody>
            {stats.meses.map((m) => (
              <tr key={m.key} className="border-t border-[var(--border)]">
                <td className="py-2 pr-2 capitalize">{m.label}</td>
                <td className="py-2 pr-2">{m.festas}</td>
                <td className="py-2 pr-2">{formatCurrency(m.faturado)}</td>
                <td className="py-2 pr-2">{formatCurrency(m.recebido)}</td>
                <td className="py-2">{formatCurrency(m.aReceber)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-[var(--text-secondary)]">
        Faturado e a receber pelo mês da festa; recebido aproximado pelo pago das reservas do mês. Detalhamento por forma de pagamento na próxima iteração.
      </p>
    </div>
  )
}
