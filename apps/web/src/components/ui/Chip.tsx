import { cn } from '../../lib/cn'

const styles: Record<string, string> = {
  agendada: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  entregue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  recolhida: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  cancelada: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Pago: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Parcial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'Não pago': 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  pendente: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  aprovado: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  recusado: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  default: 'bg-[var(--highlight)] text-[var(--text-secondary)]',
}

export function Chip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[label] ?? styles.default,
        className
      )}
    >
      {label}
    </span>
  )
}
