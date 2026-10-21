import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PedidoOnline } from '../types/database'

export function usePedidosPendentes() {
  return useQuery({
    queryKey: ['pedidos-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_online')
        .select('*')
        .eq('status', 'pendente')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return (data ?? []) as PedidoOnline[]
    },
    refetchInterval: 15_000,
  })
}

export function useAprovarPedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('aprovar_pedido', { p_id: id })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos-pendentes'] })
      qc.invalidateQueries({ queryKey: ['reservas'] })
    },
  })
}

export function useRecusarPedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('recusar_pedido', { p_id: id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos-pendentes'] }),
  })
}
