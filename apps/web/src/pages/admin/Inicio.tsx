import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Inicio() {
  const hoje = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="space-y-5 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            magicKIDS
          </p>
          <h1 className="text-2xl font-bold text-[var(--text)] capitalize">{hoje}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Resumo do dia e alertas
          </p>
        </div>
        <Link to="/admin/agenda/nova">
          <Button className="shrink-0">
            <Plus className="w-5 h-5" /> Nova reserva
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Festas hoje</p>
          <p className="text-3xl font-bold mt-1 text-[var(--text)]">—</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">A receber</p>
          <p className="text-3xl font-bold mt-1 text-[var(--text)]">—</p>
        </Card>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Alertas
        </h2>
        <Card className="p-4 text-sm text-[var(--text-secondary)]">
          Nenhum alerta no momento. Os alertas de entrega, retirada e saldo pendente aparecerão aqui.
        </Card>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Próximas festas
        </h2>
        <Card className="p-4 text-sm text-[var(--text-secondary)]">
          Nenhuma reserva próxima. Toque em “Nova reserva” para começar.
        </Card>
      </section>
    </div>
  )
}
