-- Tabela para rastreamento de leads e progresso de cada sessão do Quiz do Templo de Luz
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

-- Tabela de histórico de eventos de transição de etapas no funil (para análise de drop-off)
create table if not exists public.quiz_step_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  step_index integer not null,
  step_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices para consultas de alta performance na dashboard
create index if not exists idx_quiz_funnel_leads_created_at on public.quiz_funnel_leads(created_at desc);
create index if not exists idx_quiz_funnel_leads_step on public.quiz_funnel_leads(current_step_index);
create index if not exists idx_quiz_funnel_leads_payment_status on public.quiz_funnel_leads(payment_status);
create index if not exists idx_quiz_step_events_session on public.quiz_step_events(session_id);
create index if not exists idx_quiz_step_events_step on public.quiz_step_events(step_index);

-- Habilitar RLS
alter table public.quiz_funnel_leads enable row level security;
alter table public.quiz_step_events enable row level security;

-- Políticas de RLS: Qualquer visitante pode registrar ou atualizar sua própria sessão do quiz
create policy "Anon can insert/update quiz funnel leads"
on public.quiz_funnel_leads for all to anon, authenticated
using (true)
with check (true);

create policy "Anon can insert step events"
on public.quiz_step_events for insert to anon, authenticated
with check (true);

create policy "Service role has full access to quiz tables"
on public.quiz_funnel_leads for all to service_role
using (true) with check (true);

create policy "Service role has full access to step events"
on public.quiz_step_events for all to service_role
using (true) with check (true);

-- Função RPC para ingestão rápida de telemetria da sessão
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
  p_payment_status text default null,
  p_amount_cents integer default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null,
  p_utm_term text default null,
  p_src text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.quiz_funnel_leads%rowtype;
begin
  insert into public.quiz_funnel_leads (
    session_id,
    current_step_index,
    current_step_name,
    highest_step_index,
    lead_name,
    lead_email,
    lead_phone,
    ente_querido,
    grau_parentesco,
    mensagem_preview,
    temas_selecionados,
    completed,
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
    p_step_index,
    p_step_name,
    p_step_index,
    p_lead_name,
    p_lead_email,
    p_lead_phone,
    p_ente_querido,
    p_grau_parentesco,
    p_mensagem_preview,
    p_temas,
    p_completed,
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
    current_step_index = p_step_index,
    current_step_name = p_step_name,
    highest_step_index = greatest(public.quiz_funnel_leads.highest_step_index, p_step_index),
    lead_name = coalesce(p_lead_name, public.quiz_funnel_leads.lead_name),
    lead_email = coalesce(p_lead_email, public.quiz_funnel_leads.lead_email),
    lead_phone = coalesce(p_lead_phone, public.quiz_funnel_leads.lead_phone),
    ente_querido = coalesce(p_ente_querido, public.quiz_funnel_leads.ente_querido),
    grau_parentesco = coalesce(p_grau_parentesco, public.quiz_funnel_leads.grau_parentesco),
    mensagem_preview = coalesce(p_mensagem_preview, public.quiz_funnel_leads.mensagem_preview),
    temas_selecionados = coalesce(p_temas, public.quiz_funnel_leads.temas_selecionados),
    completed = case when p_completed then true else public.quiz_funnel_leads.completed end,
    payment_status = coalesce(p_payment_status, public.quiz_funnel_leads.payment_status),
    last_amount_cents = case when p_amount_cents is not null and p_amount_cents > 0 then p_amount_cents else public.quiz_funnel_leads.last_amount_cents end,
    utm_source = coalesce(p_utm_source, public.quiz_funnel_leads.utm_source),
    utm_medium = coalesce(p_utm_medium, public.quiz_funnel_leads.utm_medium),
    utm_campaign = coalesce(p_utm_campaign, public.quiz_funnel_leads.utm_campaign),
    utm_content = coalesce(p_utm_content, public.quiz_funnel_leads.utm_content),
    utm_term = coalesce(p_utm_term, public.quiz_funnel_leads.utm_term),
    src = coalesce(p_src, public.quiz_funnel_leads.src),
    updated_at = now()
  returning * into v_lead;

  -- Registra evento de step
  insert into public.quiz_step_events (session_id, step_index, step_name)
  values (p_session_id, p_step_index, p_step_name);

  return jsonb_build_object('success', true, 'session_id', v_lead.session_id, 'step_index', v_lead.current_step_index);
end;
$$;
