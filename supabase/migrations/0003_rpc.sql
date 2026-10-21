-- magicKIDS — RPCs (security definer)

create or replace function disponibilidade(p_ini date, p_fim date)
returns table (
  item_id uuid,
  nome text,
  categoria text,
  preco numeric,
  foto_url text,
  disponivel int
)
language sql
security definer
set search_path = public
as $$
  select
    i.id as item_id,
    i.nome,
    i.categoria,
    i.preco,
    i.foto_url,
    greatest(
      0,
      i.quantidade - coalesce((
        select sum(ri.quantidade)
        from reserva_itens ri
        join reservas r on r.id = ri.reserva_id
        where ri.item_id = i.id
          and r.status in ('agendada', 'entregue')
          and r.data_festa <= p_fim
          and r.data_retirada >= p_ini
      ), 0)
    )::int as disponivel
  from itens i
  where i.ativo = true
    and i.visivel_online = true
  order by i.categoria, i.nome;
$$;

create or replace function criar_pedido_online(
  p_cliente_nome text,
  p_cliente_telefone text,
  p_endereco text,
  p_data_festa date,
  p_data_retirada date,
  p_hora_entrega time default null,
  p_hora_retirada time default null,
  p_itens jsonb default '[]'::jsonb,
  p_forma_pagamento text default null,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(10,2) := 0;
  v_item record;
  v_preco numeric(10,2);
  v_disponivel int;
  v_pedido_id uuid;
  v_telefone_limpo text;
begin
  if p_cliente_nome is null or char_length(trim(p_cliente_nome)) < 2 then
    raise exception 'Nome inválido';
  end if;
  if char_length(p_cliente_nome) > 120 then
    raise exception 'Nome muito longo';
  end if;

  v_telefone_limpo := regexp_replace(coalesce(p_cliente_telefone, ''), '\D', '', 'g');
  if char_length(v_telefone_limpo) < 10 then
    raise exception 'Telefone inválido';
  end if;

  if p_endereco is null or char_length(trim(p_endereco)) < 5 then
    raise exception 'Endereço inválido';
  end if;
  if char_length(p_endereco) > 250 then
    raise exception 'Endereço muito longo';
  end if;

  if p_data_festa is null or p_data_festa < current_date then
    raise exception 'Data da festa inválida';
  end if;
  if p_data_retirada is null or p_data_retirada < p_data_festa then
    raise exception 'Data de retirada inválida';
  end if;

  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'Selecione pelo menos um item';
  end if;

  if p_forma_pagamento is not null and p_forma_pagamento not in ('Pix', 'Dinheiro', 'Cartão') then
    raise exception 'Forma de pagamento inválida';
  end if;

  if p_observacoes is not null and char_length(p_observacoes) > 500 then
    raise exception 'Observações muito longas';
  end if;

  if (
    select count(*)
    from pedidos_online
    where cliente_telefone = p_cliente_telefone
      and criado_em > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Muitos pedidos recentes. Tente novamente mais tarde.';
  end if;

  for v_item in
    select
      (elem->>'item_id')::uuid as item_id,
      (elem->>'quantidade')::int as quantidade
    from jsonb_array_elements(p_itens) as elem
  loop
    if v_item.quantidade is null or v_item.quantidade <= 0 then
      raise exception 'Quantidade inválida';
    end if;

    select i.preco,
      greatest(0, i.quantidade - coalesce((
        select sum(ri.quantidade)
        from reserva_itens ri
        join reservas r on r.id = ri.reserva_id
        where ri.item_id = i.id
          and r.status in ('agendada', 'entregue')
          and r.data_festa <= p_data_retirada
          and r.data_retirada >= p_data_festa
      ), 0))
    into v_preco, v_disponivel
    from itens i
    where i.id = v_item.item_id
      and i.ativo = true
      and i.visivel_online = true;

    if not found then
      raise exception 'Item não encontrado ou indisponível';
    end if;

    if v_item.quantidade > v_disponivel then
      raise exception 'Estoque insuficiente para um ou mais itens neste período';
    end if;

    v_total := v_total + (v_preco * v_item.quantidade);
  end loop;

  insert into pedidos_online (
    cliente_nome, cliente_telefone, endereco,
    data_festa, data_retirada, hora_entrega, hora_retirada,
    itens, total, forma_pagamento, observacoes
  ) values (
    trim(p_cliente_nome), p_cliente_telefone, trim(p_endereco),
    p_data_festa, p_data_retirada, p_hora_entrega, p_hora_retirada,
    p_itens, v_total, p_forma_pagamento, p_observacoes
  )
  returning id into v_pedido_id;

  return v_pedido_id;
end;
$$;

create or replace function aprovar_pedido(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos_online%rowtype;
  v_reserva_id uuid;
  v_item record;
  v_preco numeric(10,2);
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Não autorizado';
  end if;

  select * into v_pedido from pedidos_online where id = p_id for update;

  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if v_pedido.status <> 'pendente' then
    raise exception 'Pedido já processado';
  end if;

  insert into reservas (
    cliente_nome, cliente_telefone, endereco,
    data_festa, data_retirada, hora_entrega, hora_retirada,
    total, observacoes, origem, status
  ) values (
    v_pedido.cliente_nome,
    v_pedido.cliente_telefone,
    v_pedido.endereco,
    v_pedido.data_festa,
    v_pedido.data_retirada,
    v_pedido.hora_entrega,
    v_pedido.hora_retirada,
    v_pedido.total,
    coalesce(v_pedido.observacoes, '') ||
      case when v_pedido.forma_pagamento is not null
           then E'\n[Forma preferida: ' || v_pedido.forma_pagamento || ']'
           else '' end,
    'online',
    'agendada'
  )
  returning id into v_reserva_id;

  for v_item in
    select
      (elem->>'item_id')::uuid as item_id,
      (elem->>'quantidade')::int as quantidade
    from jsonb_array_elements(v_pedido.itens) as elem
  loop
    select preco into v_preco from itens where id = v_item.item_id;
    insert into reserva_itens (reserva_id, item_id, quantidade, preco_unitario)
    values (v_reserva_id, v_item.item_id, v_item.quantidade, coalesce(v_preco, 0));
  end loop;

  update pedidos_online
  set status = 'aprovado', reserva_id = v_reserva_id
  where id = p_id;

  return v_reserva_id;
end;
$$;

create or replace function recusar_pedido(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Não autorizado';
  end if;

  update pedidos_online
  set status = 'recusado'
  where id = p_id and status = 'pendente';

  if not found then
    raise exception 'Pedido não encontrado ou já processado';
  end if;
end;
$$;

grant execute on function disponibilidade(date, date) to anon, authenticated;
grant execute on function criar_pedido_online(text, text, text, date, date, time, time, jsonb, text, text) to anon, authenticated;
grant execute on function aprovar_pedido(uuid) to authenticated;
grant execute on function recusar_pedido(uuid) to authenticated;
