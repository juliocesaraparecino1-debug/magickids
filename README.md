# magicKIDS

Sistema de aluguel de itens para festas infantis (pt-BR / BRL).

**Dois produtos no mesmo banco:**
1. **Página pública** (`/`) — cliente reserva sozinho
2. **Painel do dono** (`/admin/*`) — gestão mobile-first

Stack: React + Vite + TypeScript + Tailwind + Framer Motion + Supabase + TanStack Query + Zod + date-fns.

## O que já funciona

- Schema + RLS + RPCs (disponibilidade, criar pedido, aprovar/recusar)
- Login admin (Supabase Auth)
- **Início:** resumo do dia, recebido/a receber, alertas, pedidos pendentes, próximas festas
- **Agenda:** filtros, busca, cards, detalhe, pagamentos parciais, status entregue/recolhido/cancelar
- **Nova / editar reserva:** itens, total automático editável, ajuste
- **Estoque:** CRUD, Total / Guardado / Em festas / Reservado + onde está
- **Pedidos online:** listar, aprovar (vira reserva), recusar
- **Financeiro:** indicadores do mês + tabela 6 meses
- **Ajustes:** WhatsApp, Pix, alertas, link público, logout
- **Página pública:** dados, datas, disponibilidade em tempo real, carrinho, envio via RPC

## Setup rápido

### 1. Supabase

1. Crie projeto em https://supabase.com  
2. SQL Editor → rode na ordem:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_rpc.sql`
3. Authentication → Providers → desative sign-ups públicos  
4. Authentication → Users → Add user (seu e-mail/senha de admin)

### 2. Frontend

```bash
git clone https://github.com/juliocesaraparecino1-debug/magickids.git
cd magickids/apps/web
cp .env.example .env.local
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

npm install
npm run dev
```

- Público: http://localhost:5173  
- Admin: http://localhost:5173/admin  

### 3. Netlify

- Base: `apps/web`
- Build: `npm run build`
- Publish: `dist`
- Env: mesmas variáveis do `.env.local`

## Fluxo de aceite (Fase 1 + 2)

1. Cadastre itens no Estoque  
2. Crie reserva no painel com entrada Pix → registre restante em dinheiro → status **Pago**  
3. Deixe uma festa passada com saldo → alerta urgente no Início  
4. Abra `/`, escolha data, peça itens → pedido aparece em Pedidos → Aprovar → vira reserva na Agenda  

## Design

Tokens do Documento Mestre + regras UI/UX Pro Max (44px touch, 16px inputs, safe-area, contraste, reduced-motion, bottom nav ≤6 itens).
