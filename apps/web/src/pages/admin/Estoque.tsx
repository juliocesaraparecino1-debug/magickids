import { useState } from 'react'
import { useItens, useOcupacaoItens, useSalvarItem, useDesativarItem } from '../../hooks/useItens'
import { formatCurrency } from '../../lib/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Plus, Pencil } from 'lucide-react'
import type { Categoria, Item } from '../../types/database'

const CATEGORIAS: Categoria[] = ['Inflável', 'Brinquedo', 'Decoração', 'Jogo de mesa', 'Mesa e cadeira', 'Outro']

export function Estoque() {
  const { data: itens = [], isLoading } = useItens(true)
  const { data: ocupacao = {} } = useOcupacaoItens()
  const salvar = useSalvarItem()
  const desativar = useDesativarItem()
  const [edit, setEdit] = useState<Partial<Item> | null>(null)

  const ativos = itens.filter((i) => i.ativo)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!edit?.nome || !edit.categoria) return
    await salvar.mutateAsync({
      id: edit.id,
      nome: edit.nome,
      categoria: edit.categoria as Categoria,
      quantidade: Number(edit.quantidade) || 0,
      preco: Number(edit.preco) || 0,
      visivel_online: edit.visivel_online ?? true,
      ativo: true,
    })
    setEdit(null)
  }

  return (
    <div className="space-y-4 pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Estoque</h1>
        <Button onClick={() => setEdit({ nome: '', categoria: 'Brinquedo', quantidade: 1, preco: 0, visivel_online: true })}>
          <Plus className="w-5 h-5" /> Item
        </Button>
      </header>

      {isLoading && <p className="text-sm text-[var(--text-secondary)]">Carregando…</p>}

      <div className="space-y-3">
        {ativos.map((item) => {
          const occ = ocupacao[item.id] ?? { emFestas: 0, reservado: 0, locais: [] }
          const guardado = Math.max(0, item.quantidade - occ.emFestas)
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.nome}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{item.categoria} · {formatCurrency(item.preco)}</p>
                </div>
                <button
                  type="button"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--highlight)]"
                  onClick={() => setEdit(item)}
                  aria-label="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-3 text-center text-xs">
                <div>
                  <p className="text-[var(--text-secondary)]">Total</p>
                  <p className="font-bold text-base">{item.quantidade}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Guardado</p>
                  <p className="font-bold text-base">{guardado}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Em festas</p>
                  <p className="font-bold text-base">{occ.emFestas}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Reservado</p>
                  <p className="font-bold text-base">{occ.reservado}</p>
                </div>
              </div>
              {occ.locais.length > 0 && (
                <ul className="mt-2 text-xs text-[var(--text-secondary)] space-y-0.5">
                  {occ.locais.map((l, i) => (
                    <li key={i}>
                      {l.qty}× com {l.cliente} · volta {l.volta}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })}
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md bg-[var(--card)] rounded-t-[20px] sm:rounded-[20px] p-5 space-y-3 max-h-[90dvh] overflow-y-auto"
          >
            <h2 className="font-bold text-lg">{edit.id ? 'Editar item' : 'Novo item'}</h2>
            <label className="block text-sm">
              Nome
              <input
                required
                value={edit.nome ?? ''}
                onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block text-sm">
              Categoria
              <select
                value={edit.categoria ?? 'Brinquedo'}
                onChange={(e) => setEdit({ ...edit, categoria: e.target.value as Categoria })}
                className={inputCls}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Quantidade
                <input
                  type="number"
                  min={0}
                  value={edit.quantidade ?? 0}
                  onChange={(e) => setEdit({ ...edit, quantidade: Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="block text-sm">
                Preço (R$)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={edit.preco ?? 0}
                  onChange={(e) => setEdit({ ...edit, preco: Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={edit.visivel_online ?? true}
                onChange={(e) => setEdit({ ...edit, visivel_online: e.target.checked })}
              />
              Visível na página do cliente
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={() => setEdit(null)}>
                Cancelar
              </Button>
              <Button type="submit" fullWidth disabled={salvar.isPending}>
                Salvar
              </Button>
            </div>
            {edit.id && (
              <Button
                type="button"
                variant="danger"
                fullWidth
                onClick={async () => {
                  await desativar.mutateAsync(edit.id!)
                  setEdit(null)
                }}
              >
                Desativar item
              </Button>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

const inputCls =
  'mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-[16px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-from)]'
