-- magicKIDS — Row Level Security

alter table itens enable row level security;
alter table reservas enable row level security;
alter table reserva_itens enable row level security;
alter table pagamentos enable row level security;
alter table pedidos_online enable row level security;
alter table configuracoes enable row level security;

-- authenticated (admin) = acesso total
create policy "admin_all_itens" on itens for all to authenticated using (true) with check (true);
create policy "admin_all_reservas" on reservas for all to authenticated using (true) with check (true);
create policy "admin_all_reserva_itens" on reserva_itens for all to authenticated using (true) with check (true);
create policy "admin_all_pagamentos" on pagamentos for all to authenticated using (true) with check (true);
create policy "admin_all_pedidos_online" on pedidos_online for all to authenticated using (true) with check (true);
create policy "admin_all_configuracoes" on configuracoes for all to authenticated using (true) with check (true);

-- anon: sem acesso direto (só RPCs security definer)
