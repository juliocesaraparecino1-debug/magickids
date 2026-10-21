# magicKIDS

Sistema de aluguel de itens para festas infantis (pt-BR / BRL).

**Dois produtos no mesmo banco:**
1. **Painel do dono** (`/admin/*`) — gestão diária (mobile-first)
2. **Página pública de reservas** (`/`) — link que o cliente abre

Stack: React + Vite + TypeScript + Tailwind v4 + Framer Motion + Supabase + TanStack Query + Zod + date-fns.

## Fase 1 (Núcleo) — status

- [x] Schema + RLS + RPCs (disponibilidade, criar_pedido_online, aprovar/recusar)
- [x] Estrutura do monorepo / app único
- [x] Design tokens (claro/escuro) alinhados ao Documento Mestre + práticas UI/UX Pro Max
- [ ] Telas admin completas (Início, Agenda, Estoque, Nova reserva, Pagamentos, Alertas)
- [ ] Login admin + proteção de rotas
- [ ] PWA básico

## Como rodar

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, rode na ordem:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_rpc.sql`
3. Em Authentication → Settings: **desative** “Enable sign-ups” (só o dono entra)
4. Crie o usuário admin (Authentication → Users → Add user)

### 2. Frontend

```bash
cd apps/web
cp .env.example .env.local
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

Abra `http://localhost:5173` (público) e `http://localhost:5173/admin` (painel).

### 3. Deploy (Netlify)

- Build command: `cd apps/web && npm run build`
- Publish directory: `apps/web/dist`
- Variáveis de ambiente: as mesmas do `.env.local`

## Design system (resumo)

- Degradê marca: `#7c3aed → #c026d3 → #ec4899`
- Fundo claro `#f5f3fc` / escuro `#0e0b1c`
- Cartões raio 20px, barra inferior flutuante (mobile)
- Touch targets ≥ 44px, fonte inputs 16px, safe-area, prefers-reduced-motion
- Referências de qualidade: Linear, Stripe, Vercel + personalidade infantil sutil

## Próximos passos (Fase 2+)

- Página pública completa + Realtime nos pedidos
- Financeiro completo + CSV
- PWA instalável + splash
- WhatsApp (opcional)

---

Documento mestre original usado como especificação completa.
