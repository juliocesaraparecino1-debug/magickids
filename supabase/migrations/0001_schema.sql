-- magicKIDS — Schema completo (seção 4 do Documento Mestre)

create extension if not exists "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

create table itens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null check (categoria in (
    'Inflável', 'Brinquedo', 'Decoração', 'Jogo de mesa', 'Mesa e cadeira', 'Outro'
  )),
  quantidade int not null default 0 check (quantidade >= 0),
  preco numeric(10,2) not null default 0 check (preco >= 0),
  ativo boolean not null default true,
  visivel_online boolean not null default true,
  foto_url text,
  criado_em timestamptz not null default now()
);

create table reservas (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text not null,
  cliente_telefone text,
  endereco text,
  data_festa date not null,
  data_retirada date not null check (data_retirada >= data_festa),
  hora_entrega time,
  hora_retirada time,
  status text not null default 'agendada' check (status in (
    'agendada', 'entregue', 'recolhida', 'cancelada'
  )),
  ajuste numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  observacoes text,
  origem text not null default 'painel' check (origem in ('painel', 'online')),
  criado_em timestamptz not null default now()
);

create table reserva_itens (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  item_id uuid not null references itens(id),
  quantidade int not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null
);

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  valor numeric(10,2) not null check (valor > 0),
  forma text not null check (forma in ('Pix', 'Dinheiro', 'Cartão')),
  pago_em date not null default current_date,
  observacao text,
  criado_em timestamptz not null default now()
);

create table pedidos_online (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  status text not null default 'pendente' check (status in (
    'pendente', 'aprovado', 'recusado'
  )),
  cliente_nome text not null check (char_length(cliente_nome) <= 120),
  cliente_telefone text not null check (char_length(cliente_telefone) <= 30),
  endereco text not null check (char_length(endereco) <= 250),
  data_festa date not null,
  data_retirada date not null check (data_retirada >= data_festa),
  hora_entrega time,
  hora_retirada time,
  itens jsonb not null,
  total numeric(10,2) not null,
  forma_pagamento text check (forma_pagamento in ('Pix', 'Dinheiro', 'Cartão')),
  observacoes text check (char_length(observacoes) <= 500),
  reserva_id uuid references reservas(id)
);

create table configuracoes (
  id int primary key default 1 check (id = 1),
  whatsapp text,
  chave_pix text,
  nome_empresa text not null default 'magicKIDS',
  antecedencia_alerta_entrega_h int not null default 24,
  antecedencia_alerta_retirada_h int not null default 6
);

insert into configuracoes (id) values (1);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_reservas_data_festa on reservas (data_festa);
create index idx_reservas_status on reservas (status);
create index idx_reservas_data_retirada on reservas (data_retirada);
create index idx_reserva_itens_reserva on reserva_itens (reserva_id);
create index idx_reserva_itens_item on reserva_itens (item_id);
create index idx_pagamentos_reserva on pagamentos (reserva_id);
create index idx_pedidos_online_status on pedidos_online (status);
create index idx_itens_ativo_visivel on itens (ativo, visivel_online);

-- ============================================================
-- VIEW: resumo de reservas
-- ============================================================

create or replace view v_reservas_resumo as
select
  r.*,
  coalesce(p.pago, 0)::numeric(10,2) as pago,
  (r.total - coalesce(p.pago, 0))::numeric(10,2) as falta,
  case
    when coalesce(p.pago, 0) >= r.total then 'Pago'
    when coalesce(p.pago, 0) > 0 then 'Parcial'
    else 'Não pago'
  end as situacao_pagamento
from reservas r
left join (
  select reserva_id, sum(valor) as pago
  from pagamentos
  group by reserva_id
) p on p.reserva_id = r.id;
