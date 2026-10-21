export type Categoria =
  | 'Inflável'
  | 'Brinquedo'
  | 'Decoração'
  | 'Jogo de mesa'
  | 'Mesa e cadeira'
  | 'Outro'

export type StatusReserva = 'agendada' | 'entregue' | 'recolhida' | 'cancelada'
export type FormaPagamento = 'Pix' | 'Dinheiro' | 'Cartão'
export type SituacaoPagamento = 'Pago' | 'Parcial' | 'Não pago'
export type StatusPedido = 'pendente' | 'aprovado' | 'recusado'

export interface Item {
  id: string
  nome: string
  categoria: Categoria
  quantidade: number
  preco: number
  ativo: boolean
  visivel_online: boolean
  foto_url: string | null
  criado_em: string
}

export interface Reserva {
  id: string
  cliente_nome: string
  cliente_telefone: string | null
  endereco: string | null
  data_festa: string
  data_retirada: string
  hora_entrega: string | null
  hora_retirada: string | null
  status: StatusReserva
  ajuste: number
  total: number
  observacoes: string | null
  origem: 'painel' | 'online'
  criado_em: string
}

export interface ReservaResumo extends Reserva {
  pago: number
  falta: number
  situacao_pagamento: SituacaoPagamento
}

export interface ReservaItem {
  id: string
  reserva_id: string
  item_id: string
  quantidade: number
  preco_unitario: number
  item?: Item
}

export interface Pagamento {
  id: string
  reserva_id: string
  valor: number
  forma: FormaPagamento
  pago_em: string
  observacao: string | null
  criado_em?: string
}

export interface PedidoOnline {
  id: string
  criado_em: string
  status: StatusPedido
  cliente_nome: string
  cliente_telefone: string
  endereco: string
  data_festa: string
  data_retirada: string
  hora_entrega: string | null
  hora_retirada: string | null
  itens: { item_id: string; quantidade: number }[]
  total: number
  forma_pagamento: FormaPagamento | null
  observacoes: string | null
  reserva_id: string | null
}

export interface Configuracoes {
  id: number
  whatsapp: string | null
  chave_pix: string | null
  nome_empresa: string
  antecedencia_alerta_entrega_h: number
  antecedencia_alerta_retirada_h: number
}

export interface DisponibilidadeItem {
  item_id: string
  nome: string
  categoria: string
  preco: number
  foto_url: string | null
  disponivel: number
}
