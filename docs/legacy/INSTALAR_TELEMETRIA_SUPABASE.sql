-- ==============================================================================
-- TEMPLO DE LUZ: TELEMETRIA COMPLETA DE LEADS, TEMPO, QUIZ E CHECKOUT
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/opftmzegcvfyoinjfmcj/sql/new
-- ==============================================================================

-- 1. Tabela Principal de Leads e Sessões do Quiz
create table if not exists public.quiz_funnel_leads (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  lead_name text,
  lead_email text,
  lead_phone text,
  ente_querido text,
  grau_parentesco text,
  mensagem_preview text,
  temas_selecionados text[],
  current_step_index integer not null default 0,
  current_step_name text not null default 'intro',
  highest_step_index integer not null default 0,
  completed boolean not null default false,
  time_spent_seconds integer not null default 0,
  checkout_initiated boolean not null default false,
  checkout_initiated_at timestamptz,
  pix_generated boolean not null default false,
  pix_generated_at timestamptz,
  card_declined boolean not null default false,
  card_declined_at timestamptz,
  card_abandoned boolean not null default false,
  card_abandoned_at timestamptz,
  checkout_status text not null default 'in_progress',
  payment_status text not null default 'none' check (payment_status in ('none', 'waiting_payment', 'paid', 'failed')),
  last_amount_cents integer default 0,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  src text,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir adição das colunas caso a tabela já exista anteriormente
alter table public.quiz_funnel_leads add column if not exists time_spent_seconds integer not null default 0;
alter table public.quiz_funnel_leads add column if not exists checkout_initiated boolean not null default false;
alter table public.quiz_funnel_leads add column if not exists checkout_initiated_at timestamptz;
alter table public.quiz_funnel_leads add column if not exists pix_generated boolean not null default false;
alter table public.quiz_funnel_leads add column if not exists pix_generated_at timestamptz;
alter table public.quiz_funnel_leads add column if not exists card_declined boolean not null default false;
alter table public.quiz_funnel_leads add column if not exists card_declined_at timestamptz;
alter table public.quiz_funnel_leads add column if not exists card_abandoned boolean not null default false;
alter table public.quiz_funnel_leads add column if not exists card_abandoned_at timestamptz;
alter table public.quiz_funnel_leads add column if not exists checkout_status text not null default 'in_progress';

-- 2. Tabela de Histórico de Eventos Granulares (Passo a Passo e Checkouts)
create table if not exists public.quiz_step_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  step_index integer not null,
  step_name text not null,
  event_type text not null default 'step_view',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.quiz_step_events add column if not exists event_type text not null default 'step_view';

-- 3. Tabela de Conversas e Metrificação do WhatsApp
create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default 'Consulente',
  customer_phone text,
  customer_email text,
  ente_querido text,
  grau_parentesco text,
  payment_method text not null default 'pending' check (payment_method in ('pix', 'credit_card', 'pending', 'none')),
  payment_status text not null default 'pending' check (payment_status in ('paid', 'pending', 'none')),
  amount_cents integer not null default 0,
  source_page text not null default 'escrever_carta',
  message_preview text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

-- 4. Índices para Alta Performance
create index if not exists idx_quiz_funnel_leads_created_at on public.quiz_funnel_leads(created_at desc);
create index if not exists idx_quiz_funnel_leads_step on public.quiz_funnel_leads(current_step_index);
create index if not exists idx_quiz_funnel_leads_payment_status on public.quiz_funnel_leads(payment_status);
create index if not exists idx_quiz_funnel_leads_checkout on public.quiz_funnel_leads(checkout_status);
create index if not exists idx_quiz_step_events_session on public.quiz_step_events(session_id);
create index if not exists idx_quiz_step_events_step on public.quiz_step_events(step_index);
create index if not exists idx_whatsapp_conversations_created_at on public.whatsapp_conversations(created_at desc);

-- 5. Habilitar Segurança RLS
alter table public.quiz_funnel_leads enable row level security;
alter table public.quiz_step_events enable row level security;
alter table public.whatsapp_conversations enable row level security;

-- 6. Políticas de RLS Permissivas para Telemetria
drop policy if exists "Anon can insert/update quiz funnel leads" on public.quiz_funnel_leads;
create policy "Anon can insert/update quiz funnel leads"
on public.quiz_funnel_leads for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anon can insert step events" on public.quiz_step_events;
create policy "Anon can insert step events"
on public.quiz_step_events for insert to anon, authenticated
with check (true);

drop policy if exists "Consulentes criam whatsapp_conversations" on public.whatsapp_conversations;
create policy "Consulentes criam whatsapp_conversations"
on public.whatsapp_conversations for insert to anon, authenticated
with check (true);

drop policy if exists "Leitura whatsapp_conversations" on public.whatsapp_conversations;
create policy "Leitura whatsapp_conversations"
on public.whatsapp_conversations for select to anon, authenticated
using (true);

-- 7. Função RPC Avançada de Telemetria (Grava Nome, Tempo, Etapa e Eventos de Checkout)
create or replace function public.track_quiz_progress(
  p_session_id text,
  p_step_index integer,
  p_step_name text,
  p_lead_name text default null,
  p_lead_email text default null,
  p_lead_phone text default null,
  p_ente_querido text default null,
  p_grau_parentesco text default null,
  p_mensagem_preview text default null,
  p_temas text[] default null,
  p_completed boolean default false,
  p_time_spent_seconds integer default null,
  p_checkout_event text default null,
  p_payment_status text default null,
  p_amount_cents integer default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null,
  p_utm_term text default null,
  p_src text default null
) returns jsonb language plpgsql security definer as $$
declare
  v_lead_id uuid;
  v_is_checkout_init boolean := false;
  v_is_pix_gen boolean := false;
  v_is_card_dec boolean := false;
  v_is_card_abn boolean := false;
  v_checkout_status text := 'in_progress';
begin
  -- Interpreta o evento de checkout
  if p_checkout_event = 'checkout_initiated' or p_step_index >= 8 then
    v_is_checkout_init := true;
    v_checkout_status := 'checkout_initiated';
  end if;

  if p_checkout_event = 'pix_generated' then
    v_is_pix_gen := true;
    v_checkout_status := 'pix_generated';
  end if;

  if p_checkout_event = 'card_declined' then
    v_is_card_dec := true;
    v_checkout_status := 'card_declined';
  end if;

  if p_checkout_event = 'card_abandoned' then
    v_is_card_abn := true;
    v_checkout_status := 'card_abandoned';
  end if;

  if p_payment_status = 'paid' then
    v_checkout_status := 'paid';
  end if;

  -- Upsert do Lead / Sessão
  insert into public.quiz_funnel_leads (
    session_id,
    lead_name,
    lead_email,
    lead_phone,
    ente_querido,
    grau_parentesco,
    mensagem_preview,
    temas_selecionados,
    current_step_index,
    current_step_name,
    highest_step_index,
    completed,
    time_spent_seconds,
    checkout_initiated,
    checkout_initiated_at,
    pix_generated,
    pix_generated_at,
    card_declined,
    card_declined_at,
    card_abandoned,
    card_abandoned_at,
    checkout_status,
    payment_status,
    last_amount_cents,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    src,
    updated_at
  ) values (
    p_session_id,
    p_lead_name,
    p_lead_email,
    p_lead_phone,
    p_ente_querido,
    p_grau_parentesco,
    p_mensagem_preview,
    p_temas,
    p_step_index,
    p_step_name,
    p_step_index,
    p_completed,
    coalesce(p_time_spent_seconds, 0),
    v_is_checkout_init,
    case when v_is_checkout_init then now() else null end,
    v_is_pix_gen,
    case when v_is_pix_gen then now() else null end,
    v_is_card_dec,
    case when v_is_card_dec then now() else null end,
    v_is_card_abn,
    case when v_is_card_abn then now() else null end,
    v_checkout_status,
    coalesce(p_payment_status, 'none'),
    coalesce(p_amount_cents, 0),
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_utm_content,
    p_utm_term,
    p_src,
    now()
  )
  on conflict (session_id) do update set
    lead_name = coalesce(excluded.lead_name, quiz_funnel_leads.lead_name),
    lead_email = coalesce(excluded.lead_email, quiz_funnel_leads.lead_email),
    lead_phone = coalesce(excluded.lead_phone, quiz_funnel_leads.lead_phone),
    ente_querido = coalesce(excluded.ente_querido, quiz_funnel_leads.ente_querido),
    grau_parentesco = coalesce(excluded.grau_parentesco, quiz_funnel_leads.grau_parentesco),
    mensagem_preview = coalesce(excluded.mensagem_preview, quiz_funnel_leads.mensagem_preview),
    temas_selecionados = coalesce(excluded.temas_selecionados, quiz_funnel_leads.temas_selecionados),
    current_step_index = excluded.current_step_index,
    current_step_name = excluded.current_step_name,
    highest_step_index = greatest(quiz_funnel_leads.highest_step_index, excluded.highest_step_index),
    completed = quiz_funnel_leads.completed or excluded.completed,
    time_spent_seconds = greatest(quiz_funnel_leads.time_spent_seconds, coalesce(excluded.time_spent_seconds, 0)),
    checkout_initiated = quiz_funnel_leads.checkout_initiated or excluded.checkout_initiated,
    checkout_initiated_at = coalesce(quiz_funnel_leads.checkout_initiated_at, excluded.checkout_initiated_at),
    pix_generated = quiz_funnel_leads.pix_generated or excluded.pix_generated,
    pix_generated_at = coalesce(quiz_funnel_leads.pix_generated_at, excluded.pix_generated_at),
    card_declined = quiz_funnel_leads.card_declined or excluded.card_declined,
    card_declined_at = coalesce(quiz_funnel_leads.card_declined_at, excluded.card_declined_at),
    card_abandoned = quiz_funnel_leads.card_abandoned or excluded.card_abandoned,
    card_abandoned_at = coalesce(quiz_funnel_leads.card_abandoned_at, excluded.card_abandoned_at),
    checkout_status = case
      when excluded.payment_status = 'paid' or quiz_funnel_leads.payment_status = 'paid' then 'paid'
      when excluded.checkout_status <> 'in_progress' then excluded.checkout_status
      else quiz_funnel_leads.checkout_status
    end,
    payment_status = case
      when excluded.payment_status is not null and excluded.payment_status <> 'none' then excluded.payment_status
      else quiz_funnel_leads.payment_status
    end,
    last_amount_cents = case
      when coalesce(excluded.last_amount_cents, 0) > 0 then excluded.last_amount_cents
      else quiz_funnel_leads.last_amount_cents
    end,
    updated_at = now()
  returning id into v_lead_id;

  -- Registra no histórico de eventos de funil
  insert into public.quiz_step_events (
    session_id,
    step_index,
    step_name,
    event_type,
    metadata
  ) values (
    p_session_id,
    p_step_index,
    p_step_name,
    coalesce(p_checkout_event, 'step_view'),
    jsonb_build_object(
      'lead_name', p_lead_name,
      'ente_querido', p_ente_querido,
      'time_spent_seconds', p_time_spent_seconds,
      'checkout_event', p_checkout_event,
      'payment_status', p_payment_status,
      'amount_cents', p_amount_cents
    )
  );

  return jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'session_id', p_session_id,
    'step_index', p_step_index
  );
end;
$$;

-- 6. Garantir permissões de leitura para o Dashboard OD METRICS na tabela pix_orders
grant select on public.pix_orders to anon, authenticated;
drop policy if exists "Permitir leitura anon e auth pix_orders" on public.pix_orders;
create policy "Permitir leitura anon e auth pix_orders"
  on public.pix_orders
  for select
  to anon, authenticated
  using (true);

-- 7. Ativar publicação Realtime para atualização instantânea no Sininho e Gráficos
do $$
begin
  alter publication supabase_realtime add table public.pix_orders;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.quiz_funnel_leads;
exception when others then null;
end $$;

-- 8. Enriquecimento da Tabela pix_orders e Reconciliação Total de Dados
alter table public.pix_orders add column if not exists session_id text;
alter table public.pix_orders add column if not exists customer_phone text;
alter table public.pix_orders add column if not exists customer_email text;
alter table public.pix_orders add column if not exists ente_querido text;
alter table public.pix_orders add column if not exists grau_parentesco text;
alter table public.pix_orders add column if not exists utm_source text;
alter table public.pix_orders add column if not exists utm_medium text;
alter table public.pix_orders add column if not exists utm_campaign text;
alter table public.pix_orders add column if not exists utm_content text;
alter table public.pix_orders add column if not exists utm_term text;
alter table public.pix_orders add column if not exists src text;

create index if not exists idx_pix_orders_session on public.pix_orders(session_id);
create index if not exists idx_pix_orders_phone on public.pix_orders(customer_phone);

-- 9. Trigger Automático: Propaga Pagamento de pix_orders para quiz_funnel_leads e whatsapp_conversations
create or replace function public.fn_sync_pix_order_to_leads()
returns trigger language plpgsql security definer as $$
declare
  v_phone_digits text;
begin
  if new.status = 'paid' and (old.status is null or old.status <> 'paid') then
    v_phone_digits := regexp_replace(coalesce(new.customer_phone, ''), '\D', '', 'g');

    -- Atualiza Lead por session_id ou por telefone limpo
    if new.session_id is not null and new.session_id <> '' then
      update public.quiz_funnel_leads
      set
        payment_status = 'paid',
        checkout_status = 'paid',
        last_amount_cents = coalesce(new.amount_cents, last_amount_cents),
        lead_name = coalesce(new.customer_name, lead_name),
        lead_phone = coalesce(v_phone_digits, lead_phone),
        ente_querido = coalesce(new.ente_querido, ente_querido),
        grau_parentesco = coalesce(new.grau_parentesco, grau_parentesco),
        updated_at = now()
      where session_id = new.session_id;
    elsif length(v_phone_digits) >= 8 then
      update public.quiz_funnel_leads
      set
        payment_status = 'paid',
        checkout_status = 'paid',
        last_amount_cents = coalesce(new.amount_cents, last_amount_cents),
        lead_name = coalesce(new.customer_name, lead_name),
        ente_querido = coalesce(new.ente_querido, ente_querido),
        grau_parentesco = coalesce(new.grau_parentesco, grau_parentesco),
        updated_at = now()
      where regexp_replace(coalesce(lead_phone, ''), '\D', '', 'g') = v_phone_digits;
    end if;

    -- Atualiza WhatsApp por telefone
    if length(v_phone_digits) >= 8 then
      update public.whatsapp_conversations
      set
        payment_status = 'paid',
        payment_method = 'pix',
        amount_cents = coalesce(new.amount_cents, amount_cents)
      where regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g') = v_phone_digits;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_pix_order_to_leads on public.pix_orders;
create trigger trg_sync_pix_order_to_leads
after insert or update of status on public.pix_orders
for each row execute function public.fn_sync_pix_order_to_leads();

