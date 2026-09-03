-- ==============================================================================
-- Migration: Políticas RLS Blindadas para Administradores OD METRICS
-- Data: 03/09/2026
-- Admins Autorizados: thebossakadiogo@gmail.com, otaviov.quinalia@gmail.com
-- ==============================================================================

-- 1. Habilita RLS nas tabelas essenciais (caso ainda não estejam)
alter table public.pix_orders enable row level security;
alter table public.quiz_funnel_leads enable row level security;

-- 2. Remove políticas antigas conflitantes (idempotência)
drop policy if exists "Permitir leitura anonima pix_orders" on public.pix_orders;
drop policy if exists "Admins autorizados visualizam pix_orders" on public.pix_orders;
drop policy if exists "Admins autorizados atualizam pix_orders" on public.pix_orders;
drop policy if exists "Consulentes criam pix_orders" on public.pix_orders;

drop policy if exists "Permitir leitura anonima quiz_funnel_leads" on public.quiz_funnel_leads;
drop policy if exists "Admins autorizados visualizam leads" on public.quiz_funnel_leads;
drop policy if exists "Consulentes criam leads" on public.quiz_funnel_leads;
drop policy if exists "Consulentes atualizam progresso lead" on public.quiz_funnel_leads;

-- 3. Políticas para a tabela pix_orders
-- 3.1 Consulentes anônimos podem registrar pedidos/cobranças no checkout
create policy "Consulentes criam pix_orders"
  on public.pix_orders
  for insert
  to anon, authenticated
  with check (true);

-- 3.2 Apenas os dois administradores da whitelist podem LER todos os pedidos no painel OD METRICS
create policy "Admins autorizados visualizam pix_orders"
  on public.pix_orders
  for select
  to authenticated, anon
  using (
    auth.jwt() ->> 'email' in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
    or current_setting('request.jwt.claim.email', true) in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
  );

-- 3.3 Apenas os administradores podem atualizar pedidos manualmente
create policy "Admins autorizados atualizam pix_orders"
  on public.pix_orders
  for update
  to authenticated
  using (
    auth.jwt() ->> 'email' in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
  )
  with check (
    auth.jwt() ->> 'email' in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
  );

-- 4. Políticas para a tabela quiz_funnel_leads
-- 4.1 Consulentes gravam seu progresso e telemetria anônima no funil
create policy "Consulentes criam leads"
  on public.quiz_funnel_leads
  for insert
  to anon, authenticated
  with check (true);

create policy "Consulentes atualizam progresso lead"
  on public.quiz_funnel_leads
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- 4.2 Apenas os dois administradores autorizados podem ler todos os leads e funil
create policy "Admins autorizados visualizam leads"
  on public.quiz_funnel_leads
  for select
  to authenticated, anon
  using (
    auth.jwt() ->> 'email' in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
    or current_setting('request.jwt.claim.email', true) in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
  );
