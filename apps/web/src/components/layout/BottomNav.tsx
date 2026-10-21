import { NavLink } from 'react-router-dom'
import { Home, Calendar, Package, Wallet, Settings, ClipboardList } from 'lucide-react'
import { cn } from '../../lib/cn'

const items = [
  { to: '/admin', icon: Home, label: 'Início', end: true },
  { to: '/admin/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/admin/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/admin/estoque', icon: Package, label: 'Estoque' },
  { to: '/admin/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/admin/ajustes', icon: Settings, label: 'Ajustes' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      aria-label="Navegação principal"
    >
      <div className="mx-auto max-w-lg pointer-events-auto flex items-center justify-between gap-1 rounded-[var(--radius-nav)] bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-[var(--shadow-soft)] px-2 py-1.5">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[var(--touch-min)] min-h-[var(--touch-min)] rounded-2xl px-2 py-1 text-[10px] font-medium transition-all duration-200',
                isActive
                  ? 'text-white bg-[image:var(--brand-gradient)] shadow-md'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--highlight)]'
              )
            }
          >
            <Icon className="w-5 h-5" strokeWidth={2} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
