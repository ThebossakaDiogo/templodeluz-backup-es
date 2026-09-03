-- ==============================================================================
-- Migration: Tabela de Metrificação de Mensagens no WhatsApp
-- Data: 03/09/2026
-- ==============================================================================

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default 'Consulente',
  customer_phone text,
  customer_email text,
  ente_querido text,
  grau_parentesco text,
  payment_method text not null default 'pending'
    check (payment_method in ('pix', 'credit_card', 'pending', 'none')),
  payment_status text not null default 'pending'
    check (payment_status in ('paid', 'pending', 'none')),
  amount_cents integer not null default 0,
  source_page text not null default 'escrever_carta',
  message_preview text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

-- Habilita RLS
alter table public.whatsapp_conversations enable row level security;

-- Consulentes criam eventos ao clicar no botao do WhatsApp
create policy "Consulentes criam whatsapp_conversations"
  on public.whatsapp_conversations
  for insert
  to anon, authenticated
  with check (true);

-- Apenas os administradores da whitelist visualizam as conversas
create policy "Admins autorizados visualizam whatsapp_conversations"
  on public.whatsapp_conversations
  for select
  to authenticated, anon
  using (
    auth.jwt() ->> 'email' in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
    or current_setting('request.jwt.claim.email', true) in ('thebossakadiogo@gmail.com', 'otaviov.quinalia@gmail.com')
  );
