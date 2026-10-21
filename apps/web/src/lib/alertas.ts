import { differenceInHours, parseISO, isBefore, startOfDay } from 'date-fns'
import type { ReservaResumo, Configuracoes } from '../types/database'

export type Gravidade = 'urgente' | 'atencao' | 'informativo'

export interface Alerta {
  id: string
  gravidade: Gravidade
  mensagem: string
  reservaId?: string
}

function toDateTime(date: string, time?: string | null) {
  const t = time || '12:00'
  return parseISO(`${date}T${t.length === 5 ? t + ':00' : t}`)
}

export function calcularAlertas(
  reservas: ReservaResumo[],
  config?: Partial<Configuracoes> | null,
  pedidosPendentes = 0
): Alerta[] {
  const now = new Date()
  const alertas: Alerta[] = []
  const anteEntrega = config?.antecedencia_alerta_entrega_h ?? 24
  const anteRetirada = config?.antecedencia_alerta_retirada_h ?? 6

  for (const r of reservas) {
    if (r.status === 'cancelada') continue

    const entregaEm = toDateTime(r.data_festa, r.hora_entrega)
    const retiradaEm = toDateTime(r.data_retirada, r.hora_retirada)

    // Entrega atrasada
    if (r.status === 'agendada' && isBefore(entregaEm, now)) {
      alertas.push({
        id: `ent-atraso-${r.id}`,
        gravidade: 'urgente',
        mensagem: `Entrega passou do horário: ${r.cliente_nome}`,
        reservaId: r.id,
      })
    } else if (r.status === 'agendada') {
      const h = differenceInHours(entregaEm, now)
      if (h >= 0 && h <= anteEntrega) {
        alertas.push({
          id: `ent-prox-${r.id}`,
          gravidade: 'atencao',
          mensagem: `Entrega em ${h}h: ${r.cliente_nome}`,
          reservaId: r.id,
        })
      }
    }

    // Retirada atrasada / próxima
    if (r.status === 'entregue' && isBefore(retiradaEm, now)) {
      alertas.push({
        id: `ret-atraso-${r.id}`,
        gravidade: 'urgente',
        mensagem: `Retirada atrasada: ${r.cliente_nome}`,
        reservaId: r.id,
      })
    } else if (r.status === 'entregue') {
      const h = differenceInHours(retiradaEm, now)
      if (h >= 0 && h <= anteRetirada) {
        alertas.push({
          id: `ret-prox-${r.id}`,
          gravidade: 'atencao',
          mensagem: `Retirada em ${h}h: ${r.cliente_nome}`,
          reservaId: r.id,
        })
      }
    }

    // Saldo pendente após festa
    const festaPassou =
      r.status === 'recolhida' ||
      (r.status === 'entregue' && isBefore(retiradaEm, now)) ||
      (r.status === 'agendada' && isBefore(entregaEm, now))

    if (festaPassou && r.falta > 0) {
      alertas.push({
        id: `saldo-${r.id}`,
        gravidade: 'urgente',
        mensagem: `Saldo pendente R$ ${r.falta.toFixed(2).replace('.', ',')}: ${r.cliente_nome}. O pagamento foi recebido e não anotado?`,
        reservaId: r.id,
      })
    }

    // Sem entrada em até 72h
    if (r.status === 'agendada' && r.pago === 0) {
      const h = differenceInHours(entregaEm, now)
      if (h >= 0 && h <= 72) {
        alertas.push({
          id: `sem-entrada-${r.id}`,
          gravidade: 'atencao',
          mensagem: `Sem entrada registrada: ${r.cliente_nome}`,
          reservaId: r.id,
        })
      }
    }
  }

  if (pedidosPendentes > 0) {
    alertas.push({
      id: 'pedidos-pendentes',
      gravidade: 'informativo',
      mensagem: `${pedidosPendentes} pedido${pedidosPendentes > 1 ? 's' : ''} online aguardando`,
    })
  }

  // Ordenar: urgente > atenção > informativo
  const ordem: Record<Gravidade, number> = { urgente: 0, atencao: 1, informativo: 2 }
  return alertas.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade])
}

export function resumoDia(reservas: ReservaResumo[]) {
  const hoje = startOfDay(new Date())
  let entregas = 0
  let retiradas = 0
  for (const r of reservas) {
    if (r.status === 'cancelada') continue
    if (r.status === 'agendada' && startOfDay(parseISO(r.data_festa)).getTime() === hoje.getTime()) {
      entregas++
    }
    if (r.status === 'entregue' && startOfDay(parseISO(r.data_retirada)).getTime() === hoje.getTime()) {
      retiradas++
    }
  }
  return { entregas, retiradas }
}
