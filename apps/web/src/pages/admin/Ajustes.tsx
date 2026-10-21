import { useEffect, useState } from 'react'
import { useConfig, useSalvarConfig } from '../../hooks/useConfig'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'

export function Ajustes() {
  const { data: config } = useConfig()
  const salvar = useSalvarConfig()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const [whatsapp, setWhatsapp] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('magicKIDS')
  const [anteEntrega, setAnteEntrega] = useState(24)
  const [anteRetirada, setAnteRetirada] = useState(6)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (config) {
      setWhatsapp(config.whatsapp ?? '')
      setChavePix(config.chave_pix ?? '')
      setNomeEmpresa(config.nome_empresa)
      setAnteEntrega(config.antecedencia_alerta_entrega_h)
      setAnteRetirada(config.antecedencia_alerta_retirada_h)
    }
  }, [config])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await salvar.mutateAsync({
      whatsapp,
      chave_pix: chavePix,
      nome_empresa: nomeEmpresa,
      antecedencia_alerta_entrega_h: anteEntrega,
      antecedencia_alerta_retirada_h: anteRetirada,
    })
    setMsg('Salvo!')
    setTimeout(() => setMsg(null), 2000)
  }

  const publicUrl = typeof window !== 'undefined' ? window.location.origin + '/' : ''

  return (
    <div className="space-y-4 pb-28">
      <h1 className="text-xl font-bold">Ajustes</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <Card className="p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Empresa
          </h2>
          <label className="block text-sm">
            Nome
            <input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm">
            WhatsApp (com DDD)
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} inputMode="tel" />
          </label>
          <label className="block text-sm">
            Chave Pix
            <input value={chavePix} onChange={(e) => setChavePix(e.target.value)} className={inputCls} />
          </label>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Alertas (horas de antecedência)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Entrega
              <input
                type="number"
                min={1}
                value={anteEntrega}
                onChange={(e) => setAnteEntrega(Number(e.target.value))}
                className={inputCls}
              />
            </label>
            <label className="block text-sm">
              Retirada
              <input
                type="number"
                min={1}
                value={anteRetirada}
                onChange={(e) => setAnteRetirada(Number(e.target.value))}
                className={inputCls}
              />
            </label>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Link público
          </h2>
          <p className="text-sm break-all">{publicUrl}</p>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigator.clipboard.writeText(publicUrl)}
          >
            Copiar link
          </Button>
        </Card>

        {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
        <Button type="submit" fullWidth disabled={salvar.isPending}>
          Salvar
        </Button>
      </form>

      <Button
        variant="ghost"
        fullWidth
        onClick={async () => {
          await signOut()
          navigate('/admin/login')
        }}
      >
        Sair
      </Button>
    </div>
  )
}

const inputCls =
  'mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-[16px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-from)]'
