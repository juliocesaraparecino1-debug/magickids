import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Configuracoes } from '../types/database'

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 1).single()
      if (error) throw error
      return data as Configuracoes
    },
  })
}

export function useSalvarConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cfg: Partial<Configuracoes>) => {
      const { error } = await supabase.from('configuracoes').update(cfg).eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  })
}
