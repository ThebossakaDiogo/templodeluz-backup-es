-- Alinha o schema de telemetria do quiz com o frontend.
-- Adiciona colunas de checkout/tempo e recria track_quiz_progress com 21 params.

alter table public.quiz_funnel_leads
  add column if not exists time_spent_seconds integer,
  add column if not exists checkout_initiated boolean,
  add column if not exists checkout_initiated_at timestamptz,
  add column if not exists checkout_status text,
  add column if not exists pix_generated boolean,
  add column if not exists pix_generated_at timestamptz,
  add column if not exists card_declined boolean,
  add column if not exists card_declined_at timestamptz,
  add column if not exists card_abandoned boolean,
  add column if not exists card_abandoned_at timestamptz;

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
    session_id, current_step_index, current_step_name, highest_step_index,
    lead_name, lead_email, lead_phone, ente_querido, grau_parentesco,
    mensagem_preview, temas_selecionados, completed, payment_status,
    last_amount_cents, time_spent_seconds,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, src,
    checkout_initiated, checkout_initiated_at, checkout_status,
    pix_generated, pix_generated_at,
    updated_at
  ) values (
    p_session_id, p_step_index, p_step_name, p_step_index,
    p_lead_name, p_lead_email, p_lead_phone, p_ente_querido, p_grau_parentesco,
    p_mensagem_preview, p_temas, p_completed, coalesce(p_payment_status, 'none'),
    coalesce(p_amount_cents, 0), p_time_spent_seconds,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_src,
    case when p_checkout_event = 'checkout_initiated' then true else null end,
    case when p_checkout_event = 'checkout_initiated' then now() else null end,
    p_checkout_event,
    case when p_checkout_event = 'pix_generated' then true else null end,
    case when p_checkout_event = 'pix_generated' then now() else null end,
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
    time_spent_seconds = coalesce(p_time_spent_seconds, public.quiz_funnel_leads.time_spent_seconds),
    checkout_initiated = case when p_checkout_event = 'checkout_initiated' then true else public.quiz_funnel_leads.checkout_initiated end,
    checkout_initiated_at = case when p_checkout_event = 'checkout_initiated' then coalesce(public.quiz_funnel_leads.checkout_initiated_at, now()) else public.quiz_funnel_leads.checkout_initiated_at end,
    checkout_status = coalesce(p_checkout_event, public.quiz_funnel_leads.checkout_status),
    pix_generated = case when p_checkout_event = 'pix_generated' then true else public.quiz_funnel_leads.pix_generated end,
    pix_generated_at = case when p_checkout_event = 'pix_generated' then coalesce(public.quiz_funnel_leads.pix_generated_at, now()) else public.quiz_funnel_leads.pix_generated_at end,
    utm_source = coalesce(p_utm_source, public.quiz_funnel_leads.utm_source),
    utm_medium = coalesce(p_utm_medium, public.quiz_funnel_leads.utm_medium),
    utm_campaign = coalesce(p_utm_campaign, public.quiz_funnel_leads.utm_campaign),
    utm_content = coalesce(p_utm_content, public.quiz_funnel_leads.utm_content),
    utm_term = coalesce(p_utm_term, public.quiz_funnel_leads.utm_term),
    src = coalesce(p_src, public.quiz_funnel_leads.src),
    updated_at = now()
  returning * into v_lead;

  insert into public.quiz_step_events (session_id, step_index, step_name)
  values (p_session_id, p_step_index, p_step_name);

  return jsonb_build_object('success', true, 'session_id', v_lead.session_id, 'step_index', v_lead.current_step_index);
end;
$$;
