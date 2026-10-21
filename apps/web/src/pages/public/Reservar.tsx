import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/format'
import type { DisponibilidadeItem, FormaPagamento } from '../../types/database'
import { Button } from '../../components/ui/Button'

export function Reservar() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [dataFesta, setDataFesta] = useState('')
  const [dataRetirada, setDataRetirada] = useState('')
  const [horaEntrega, setHoraEntrega] = useState('')
  const [horaRetirada, setHoraRetirada] = useState('')
  const [forma, setForma] = useState<FormaPagamento | ''>('')
  const [obs, setObs] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [itens, setItens] = useState<DisponibilidadeItem[]>([])
  const [qty, setQty] = useState<Record<string, number>>({})
  const [loadingDisp, setLoadingDisp] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (dataFesta && !dataRetirada) setDataRetirada(dataFesta)
  }, [dataFesta, dataRetirada])

  useEffect(() => {
    if (!dataFesta || !dataRetirada) {
      setItens([])
      return
    }
    let cancelled = false
    setLoadingDisp(true)
    supabase
      .rpc('disponibilidade', { p_ini: dataFesta, p_fim: dataRetirada })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setErro(error.message)
          setItens([])
        } else {
          setItens((data as DisponibilidadeItem[]) ?? [])
          setErro(null)
        }
        setLoadingDisp(false)
      })
    return () => {
      cancelled = true
    }
  }, [dataFesta, dataRetirada])

  const total = useMemo(() => {
    let t = 0
    for (const it of itens) {
      t += (qty[it.item_id] ?? 0) * Number(it.preco)
    }
    return t
  }, [itens, qty])

  function changeQty(id: string, delta: number, max: number) {
    setQty((prev) => {
      const next = Math.max(0, Math.min(max, (prev[id] ?? 0) + delta))
      return { ...prev, [id]: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (honeypot) return
    setErro(null)

    const telDigits = telefone.replace(/\D/g, '')
    if (nome.trim().length < 2) {
      setErro('Informe seu nome.')
      return
    }
    if (telDigits.length < 10) {
      setErro('Informe um WhatsApp válido com DDD.')
      return
    }
    if (endereco.trim().length < 5) {
      setErro('Informe o endereço da festa.')
      return
    }
    if (!dataFesta || !dataRetirada) {
      setErro('Escolha as datas.')
      return
    }
    const selecionados = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([item_id, quantidade]) => ({ item_id, quantidade }))
    if (!selecionados.length) {
      setErro('Selecione pelo menos um item.')
      return
    }
    if (!forma) {
      setErro('Escolha a forma de pagamento.')
      return
    }

    setEnviando(true)
    try {
      const { data, error } = await supabase.rpc('criar_pedido_online', {
        p_cliente_nome: nome.trim(),
        p_cliente_telefone: telefone.trim(),
        p_endereco: endereco.trim(),
        p_data_festa: dataFesta,
        p_data_retirada: dataRetirada,
        p_hora_entrega: horaEntrega || null,
        p_hora_retirada: horaRetirada || null,
        p_itens: selecionados,
        p_forma_pagamento: forma,
        p_observacoes: obs || null,
      })
      if (error) throw error
      navigate('/confirmacao', {
        state: {
          pedidoId: data,
          nome,
          total,
          forma,
          dataFesta,
        },
      })
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] pb-28">
      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundImage: 'var(--brand-gradient)' }}
            aria-hidden
          >
            🎈
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">magicKIDS</h1>
            <p className="text-xs text-[var(--text-secondary)]">Reserve sua festa</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-6">
        {/* honeypot */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Seus dados
          </h2>
          <input
            required
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputCls}
          />
          <input
            required
            placeholder="WhatsApp com DDD"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            inputMode="tel"
            className={inputCls}
          />
          <input
            required
            placeholder="Endereço da festa"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className={inputCls}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Data e horários
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Data da festa
              <input type="date" required value={dataFesta} onChange={(e) => setDataFesta(e.target.value)} className={inputCls + ' mt-1'} />
            </label>
            <label className="text-sm">
              Data retirada
              <input type="date" required value={dataRetirada} onChange={(e) => setDataRetirada(e.target.value)} className={inputCls + ' mt-1'} />
            </label>
            <label className="text-sm">
              Hora entrega
              <input type="time" value={horaEntrega} onChange={(e) => setHoraEntrega(e.target.value)} className={inputCls + ' mt-1'} />
            </label>
            <label className="text-sm">
              Hora retirada
              <input type="time" value={horaRetirada} onChange={(e) => setHoraRetirada(e.target.value)} className={inputCls + ' mt-1'} />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            O que você quer alugar
          </h2>
          {!dataFesta && (
            <p className="text-sm text-[var(--text-secondary)]">Escolha a data da festa para ver a disponibilidade.</p>
          )}
          {loadingDisp && <p className="text-sm text-[var(--text-secondary)]">Consultando estoque…</p>}
          {itens.map((it) => {
            const q = qty[it.item_id] ?? 0
            const indisponivel = it.disponivel <= 0
            return (
              <div
                key={it.item_id}
                className={`flex items-center gap-3 p-3 rounded-[20px] border border-[var(--border)] bg-[var(--card)] ${
                  indisponivel ? 'opacity-50' : ''
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-[var(--highlight)] flex items-center justify-center text-xl shrink-0">
                  {it.foto_url ? (
                    <img src={it.foto_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    '🎈'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{it.nome}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {it.categoria} · {formatCurrency(it.preco)}
                    {indisponivel ? ' · indisponível nesta data' : ` · ${it.disponivel} disp.`}
                  </p>
                </div>
                {!indisponivel && (
                  <div className="flex items-center gap-1">
                    <button type="button" className={qtyBtn} onClick={() => changeQty(it.item_id, -1, it.disponivel)} aria-label="Menos">−</button>
                    <span className="w-7 text-center font-semibold">{q}</span>
                    <button type="button" className={qtyBtn} onClick={() => changeQty(it.item_id, 1, it.disponivel)} aria-label="Mais">+</button>
                  </div>
                )}
              </div>
            )
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Forma de pagamento
          </h2>
          <div className="flex gap-2">
            {(['Pix', 'Dinheiro', 'Cartão'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setForma(f)}
                className={`flex-1 rounded-xl py-3 text-sm font-medium min-h-[44px] border ${
                  forma === f
                    ? 'text-white border-transparent bg-[image:var(--brand-gradient)]'
                    : 'border-[var(--border)] bg-[var(--card)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Observações (opcional)"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={2}
            maxLength={500}
            className={inputCls}
          />
          <p className="text-xs text-[var(--text-secondary)]">
            Seu pedido será analisado e confirmado pelo WhatsApp. O valor da entrada e o restante são combinados na confirmação.
          </p>
        </section>

        {erro && (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {erro}
          </p>
        )}
      </form>

      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-[var(--text-secondary)]">Total</p>
            <p className="text-lg font-bold">{formatCurrency(total)}</p>
          </div>
          <Button onClick={handleSubmit as unknown as () => void} disabled={enviando} className="min-w-[140px]">
            {enviando ? 'Enviando…' : 'Enviar pedido'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-[16px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-from)]'

const qtyBtn =
  'min-w-[40px] min-h-[40px] rounded-xl bg-[var(--highlight)] text-lg font-bold flex items-center justify-center'
