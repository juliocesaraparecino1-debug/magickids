import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItens } from '../../hooks/useItens'
import { useReserva, useReservaItens } from '../../hooks/useReservas'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export function NovaReserva() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: itens = [] } = useItens()
  const { data: reserva } = useReserva(id)
  const { data: reservaItens = [] } = useReservaItens(id)

  const [clienteNome, setClienteNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [dataFesta, setDataFesta] = useState('')
  const [dataRetirada, setDataRetirada] = useState('')
  const [horaEntrega, setHoraEntrega] = useState('')
  const [horaRetirada, setHoraRetirada] = useState('')
  const [ajuste, setAjuste] = useState('0')
  const [totalManual, setTotalManual] = useState<string | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [qty, setQty] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (reserva) {
      setClienteNome(reserva.cliente_nome)
      setTelefone(reserva.cliente_telefone ?? '')
      setEndereco(reserva.endereco ?? '')
      setDataFesta(reserva.data_festa)
      setDataRetirada(reserva.data_retirada)
      setHoraEntrega(reserva.hora_entrega?.slice(0, 5) ?? '')
      setHoraRetirada(reserva.hora_retirada?.slice(0, 5) ?? '')
      setAjuste(String(reserva.ajuste))
      setTotalManual(String(reserva.total))
      setObservacoes(reserva.observacoes ?? '')
    }
  }, [reserva])

  useEffect(() => {
    if (reservaItens.length) {
      const map: Record<string, number> = {}
      for (const ri of reservaItens) map[ri.item_id] = ri.quantidade
      setQty(map)
    }
  }, [reservaItens])

  useEffect(() => {
    if (dataFesta && !dataRetirada) setDataRetirada(dataFesta)
  }, [dataFesta, dataRetirada])

  const subtotal = useMemo(() => {
    let s = 0
    for (const item of itens) {
      const q = qty[item.id] ?? 0
      s += q * Number(item.preco)
    }
    return s
  }, [itens, qty])

  const ajusteN = parseFloat(ajuste.replace(',', '.')) || 0
  const totalCalc = subtotal + ajusteN
  const total = totalManual !== null ? parseFloat(totalManual.replace(',', '.')) || totalCalc : totalCalc

  function changeQty(itemId: string, delta: number) {
    setQty((prev) => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta)
      return { ...prev, [itemId]: next }
    })
    setTotalManual(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!clienteNome.trim() || !dataFesta || !dataRetirada) {
      setErro('Preencha nome e datas.')
      return
    }
    const selecionados = Object.entries(qty).filter(([, q]) => q > 0)
    if (!selecionados.length) {
      setErro('Selecione pelo menos um item.')
      return
    }
    setSaving(true)
    try {
      let reservaId = id
      if (isEdit && id) {
        const { error } = await supabase
          .from('reservas')
          .update({
            cliente_nome: clienteNome.trim(),
            cliente_telefone: telefone || null,
            endereco: endereco || null,
            data_festa: dataFesta,
            data_retirada: dataRetirada,
            hora_entrega: horaEntrega || null,
            hora_retirada: horaRetirada || null,
            ajuste: ajusteN,
            total,
            observacoes: observacoes || null,
          })
          .eq('id', id)
        if (error) throw error
        await supabase.from('reserva_itens').delete().eq('reserva_id', id)
      } else {
        const { data, error } = await supabase
          .from('reservas')
          .insert({
            cliente_nome: clienteNome.trim(),
            cliente_telefone: telefone || null,
            endereco: endereco || null,
            data_festa: dataFesta,
            data_retirada: dataRetirada,
            hora_entrega: horaEntrega || null,
            hora_retirada: horaRetirada || null,
            ajuste: ajusteN,
            total,
            observacoes: observacoes || null,
            origem: 'painel',
            status: 'agendada',
          })
          .select('id')
          .single()
        if (error) throw error
        reservaId = data.id
      }

      const rows = selecionados.map(([itemId, quantidade]) => {
        const item = itens.find((i) => i.id === itemId)!
        return {
          reserva_id: reservaId!,
          item_id: itemId,
          quantidade,
          preco_unitario: Number(item.preco),
        }
      })
      const { error: errItens } = await supabase.from('reserva_itens').insert(rows)
      if (errItens) throw errItens

      qc.invalidateQueries({ queryKey: ['reservas'] })
      navigate(`/admin/agenda/${reservaId}`)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-28">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--highlight)]"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{isEdit ? 'Editar reserva' : 'Nova reserva'}</h1>
      </header>

      <Card className="p-4 space-y-3">
        <Field label="Cliente" required>
          <input required value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className={inputCls} />
        </Field>
        <Field label="WhatsApp">
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputCls} inputMode="tel" />
        </Field>
        <Field label="Endereço">
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data da festa" required>
            <input type="date" required value={dataFesta} onChange={(e) => setDataFesta(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Data retirada" required>
            <input type="date" required value={dataRetirada} onChange={(e) => setDataRetirada(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Hora entrega">
            <input type="time" value={horaEntrega} onChange={(e) => setHoraEntrega(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Hora retirada">
            <input type="time" value={horaRetirada} onChange={(e) => setHoraRetirada(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Itens</h2>
        {itens.map((item) => {
          const q = qty[item.id] ?? 0
          return (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{item.nome}</p>
                <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(item.preco)} · est. {item.quantidade}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className={qtyBtn} onClick={() => changeQty(item.id, -1)} aria-label="Menos">−</button>
                <span className="w-8 text-center font-semibold">{q}</span>
                <button type="button" className={qtyBtn} onClick={() => changeQty(item.id, 1)} aria-label="Mais">+</button>
              </div>
            </div>
          )
        })}
        {!itens.length && <p className="text-sm text-[var(--text-secondary)]">Cadastre itens no Estoque primeiro.</p>}
      </Card>

      <Card className="p-4 space-y-3">
        <Field label="Frete / ajuste (R$)">
          <input value={ajuste} onChange={(e) => { setAjuste(e.target.value); setTotalManual(null) }} className={inputCls} inputMode="decimal" />
        </Field>
        <Field label="Total (editável)">
          <input
            value={totalManual ?? totalCalc.toFixed(2)}
            onChange={(e) => setTotalManual(e.target.value)}
            className={inputCls + ' font-bold'}
            inputMode="decimal"
          />
        </Field>
        <p className="text-xs text-[var(--text-secondary)]">
          Subtotal itens {formatCurrency(subtotal)} + ajuste = {formatCurrency(totalCalc)}
        </p>
        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className={inputCls} />
        </Field>
      </Card>

      {erro && <p className="text-sm text-[var(--danger)]" role="alert">{erro}</p>}

      <Button type="submit" fullWidth disabled={saving}>
        {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar reserva'}
      </Button>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">
        {label}{required && ' *'}
      </span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-[16px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-from)]'

const qtyBtn =
  'min-w-[40px] min-h-[40px] rounded-xl bg-[var(--highlight)] text-lg font-bold flex items-center justify-center'
