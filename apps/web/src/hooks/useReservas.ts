import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ReservaResumo, ReservaItem, Pagamento, StatusReserva } from '../types/database'

export function useReservas() {
  return useQuery({
    queryKey: ['reservas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_reservas_resumo')
        .select('*')
        .order('data_festa', { ascending: true })
      if (error) throw error
      return (data ?? []) as ReservaResumo[]
    },
  })
}

export function useReserva(id: string | undefined) {
  return useQuery({
    queryKey: ['reserva', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_reservas_resumo')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as ReservaResumo
    },
  })
}

export function useReservaItens(reservaId: string | undefined) {
  return useQuery({
    queryKey: ['reserva-itens', reservaId],
    enabled: !!reservaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reserva_itens')
        .select('*, item:itens(*)')
        .eq('reserva_id', reservaId!)
      if (error) throw error
      return (data ?? []) as (ReservaItem & { item: ReservaItem['item'] })[]
    },
  })
}

export function usePagamentos(reservaId: string | undefined) {
  return useQuery({
    queryKey: ['pagamentos', reservaId],
    enabled: !!reservaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('reserva_id', reservaId!)
        .order('pago_em', { ascending: false })
      if (error) throw error
      return (data ?? []) as Pagamento[]
    },
  })
}

export function useAtualizarStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusReserva }) => {
      const { error } = await supabase.from('reservas').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] })
      qc.invalidateQueries({ queryKey: ['reserva'] })
    },
  })
}

export function useRegistrarPagamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      reserva_id: string
      valor: number
      forma: string
      pago_em?: string
      observacao?: string
    }) => {
      const { error } = await supabase.from('pagamentos').insert(p)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['pagamentos', vars.reserva_id] })
      qc.invalidateQueries({ queryKey: ['reservas'] })
      qc.invalidateQueries({ queryKey: ['reserva', vars.reserva_id] })
    },
  })
}

export function useRemoverPagamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reservaId }: { id: string; reservaId: string }) => {
      const { error } = await supabase.from('pagamentos').delete().eq('id', id)
      if (error) throw error
      return reservaId
    },
    onSuccess: (reservaId) => {
      qc.invalidateQueries({ queryKey: ['pagamentos', reservaId] })
      qc.invalidateQueries({ queryKey: ['reservas'] })
      qc.invalidateQueries({ queryKey: ['reserva', reservaId] })
    },
  })
}
