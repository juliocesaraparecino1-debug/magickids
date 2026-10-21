import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Item } from '../types/database'

export function useItens(incluirInativos = false) {
  return useQuery({
    queryKey: ['itens', incluirInativos],
    queryFn: async () => {
      let q = supabase.from('itens').select('*').order('categoria').order('nome')
      if (!incluirInativos) q = q.eq('ativo', true)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Item[]
    },
  })
}

export function useSalvarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: Partial<Item> & { nome: string; categoria: string }) => {
      if (item.id) {
        const { error } = await supabase.from('itens').update(item).eq('id', item.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('itens').insert(item)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['itens'] }),
  })
}

export function useDesativarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('itens').update({ ativo: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['itens'] }),
  })
}

/** Calcula ocupação por status a partir das reservas */
export function useOcupacaoItens() {
  return useQuery({
    queryKey: ['ocupacao-itens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reserva_itens')
        .select('item_id, quantidade, reserva:reservas(status, data_festa, data_retirada, cliente_nome, hora_retirada)')
      if (error) throw error

      type Occ = {
        emFestas: number
        reservado: number
        locais: { cliente: string; volta: string; qty: number }[]
      }
      const map: Record<string, Occ> = {}

      for (const row of data ?? []) {
        const r = row.reserva as {
          status: string
          data_festa: string
          data_retirada: string
          cliente_nome: string
          hora_retirada: string | null
        } | null
        if (!r || r.status === 'cancelada' || r.status === 'recolhida') continue
        if (!map[row.item_id]) {
          map[row.item_id] = { emFestas: 0, reservado: 0, locais: [] }
        }
        if (r.status === 'entregue') {
          map[row.item_id].emFestas += row.quantidade
          map[row.item_id].locais.push({
            cliente: r.cliente_nome,
            volta: `${r.data_retirada}${r.hora_retirada ? ' ' + r.hora_retirada.slice(0, 5) : ''}`,
            qty: row.quantidade,
          })
        } else if (r.status === 'agendada') {
          map[row.item_id].reservado += row.quantidade
        }
      }
      return map
    },
  })
}
