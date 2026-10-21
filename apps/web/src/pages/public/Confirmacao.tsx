import { useLocation, Link } from 'react-router-dom'
import { useConfig } from '../../hooks/useConfig'
import { formatCurrency, formatDate } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { MessageCircle, CheckCircle2 } from 'lucide-react'

export function Confirmacao() {
  const { state } = useLocation() as {
    state?: { nome?: string; total?: number; forma?: string; dataFesta?: string }
  }
  const { data: config } = useConfig()

  const wa = config?.whatsapp?.replace(/\D/g, '')
  const waUrl = wa
    ? `https://wa.me/55${wa.startsWith('55') ? wa.slice(2) : wa}?text=${encodeURIComponent(
        `Olá! Enviei um pedido pelo site magicKIDS (${state?.nome ?? ''}).`
      )}`
    : '#'

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-5 text-center">
        <CheckCircle2 className="w-14 h-14 mx-auto text-[var(--success)]" />
        <div>
          <h1 className="text-xl font-bold">Pedido enviado!</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {state?.nome ? `Obrigado, ${state.nome}. ` : ''}
            Vamos analisar e confirmar pelo WhatsApp.
          </p>
        </div>
        {state && (
          <div className="text-sm text-left space-y-1 bg-[var(--highlight)] rounded-xl p-3">
            {state.dataFesta && <p>Data: {formatDate(state.dataFesta)}</p>}
            {state.total != null && <p>Total estimado: {formatCurrency(state.total)}</p>}
            {state.forma && <p>Pagamento: {state.forma}</p>}
          </div>
        )}
        {state?.forma === 'Pix' && config?.chave_pix && (
          <div className="text-left text-sm space-y-1">
            <p className="font-medium">Chave Pix</p>
            <p className="break-all bg-[var(--highlight)] rounded-xl p-3 font-mono text-xs">{config.chave_pix}</p>
          </div>
        )}
        <a href={waUrl} target="_blank" rel="noreferrer">
          <Button fullWidth>
            <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
          </Button>
        </a>
        <Link to="/" className="block text-sm text-[var(--text-secondary)] underline">
          Voltar ao início
        </Link>
      </Card>
    </div>
  )
}
