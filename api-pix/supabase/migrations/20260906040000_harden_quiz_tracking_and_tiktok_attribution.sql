-- Unifica a função de telemetria, elimina eventos duplicados e persiste a
-- atribuição necessária para o quiz espelhado do TikTok.

alter table public.quiz_funnel_leads
  add column if not exists sck text,
  add column if not exists ttclid text;

alter table public.pix_orders
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists src text,
  add column if not exists sck text,
  add column if not exists ttclid text;

delete from public.quiz_step_events older
using public.quiz_step_events newer
where older.session_id = newer.session_id
  and older.step_index = newer.step_index
  and older.step_name = newer.step_name
  and older.created_at < newer.created_at;

create unique index if not exists quiz_step_events_session_step_name_key
  on public.quiz_step_events (session_id, step_index, step_name);

drop function if exists public.track_quiz_progress(
  text, integer, text, text, text, text, text, text, text, text[], boolean,
  text, integer, text, text, text, text, text, text
);

drop function if exists public.track_quiz_progress(
  text, integer, text, text, text, text, text, text, text, text[], boolean,
  integer, text, text, integer, text, text, text, text, text, text
);

create function public.track_quiz_progress(
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
  p_src text default null,
  p_sck text default null,
  p_ttclid text default null
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
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck, ttclid,
    checkout_initiated, checkout_initiated_at, checkout_status,
    pix_generated, pix_generated_at,
    card_declined, card_declined_at, card_abandoned, card_abandoned_at,
    updated_at
  ) values (
    p_session_id, p_step_index, p_step_name, p_step_index,
    p_lead_name, p_lead_email, p_lead_phone, p_ente_querido, p_grau_parentesco,
    p_mensagem_preview, p_temas, p_completed, coalesce(p_payment_status, 'none'),
    coalesce(p_amount_cents, 0), p_time_spent_seconds,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_src, p_sck, p_ttclid,
    p_checkout_event = 'checkout_initiated', case when p_checkout_event = 'checkout_initiated' then now() end, p_checkout_event,
    p_checkout_event = 'pix_generated', case when p_checkout_event = 'pix_generated' then now() end,
    p_checkout_event = 'card_declined', case when p_checkout_event = 'card_declined' then now() end,
    p_checkout_event = 'card_abandoned', case when p_checkout_event = 'card_abandoned' then now() end,
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
    completed = p_completed or public.quiz_funnel_leads.completed,
    payment_status = coalesce(p_payment_status, public.quiz_funnel_leads.payment_status),
    last_amount_cents = case when coalesce(p_amount_cents, 0) > 0 then p_amount_cents else public.quiz_funnel_leads.last_amount_cents end,
    time_spent_seconds = greatest(coalesce(public.quiz_funnel_leads.time_spent_seconds, 0), coalesce(p_time_spent_seconds, 0)),
    checkout_initiated = p_checkout_event = 'checkout_initiated' or public.quiz_funnel_leads.checkout_initiated,
    checkout_initiated_at = case when p_checkout_event = 'checkout_initiated' then coalesce(public.quiz_funnel_leads.checkout_initiated_at, now()) else public.quiz_funnel_leads.checkout_initiated_at end,
    checkout_status = coalesce(p_checkout_event, public.quiz_funnel_leads.checkout_status),
    pix_generated = p_checkout_event = 'pix_generated' or public.quiz_funnel_leads.pix_generated,
    pix_generated_at = case when p_checkout_event = 'pix_generated' then coalesce(public.quiz_funnel_leads.pix_generated_at, now()) else public.quiz_funnel_leads.pix_generated_at end,
    card_declined = p_checkout_event = 'card_declined' or public.quiz_funnel_leads.card_declined,
    card_declined_at = case when p_checkout_event = 'card_declined' then coalesce(public.quiz_funnel_leads.card_declined_at, now()) else public.quiz_funnel_leads.card_declined_at end,
    card_abandoned = p_checkout_event = 'card_abandoned' or public.quiz_funnel_leads.card_abandoned,
    card_abandoned_at = case when p_checkout_event = 'card_abandoned' then coalesce(public.quiz_funnel_leads.card_abandoned_at, now()) else public.quiz_funnel_leads.card_abandoned_at end,
    utm_source = coalesce(p_utm_source, public.quiz_funnel_leads.utm_source),
    utm_medium = coalesce(p_utm_medium, public.quiz_funnel_leads.utm_medium),
    utm_campaign = coalesce(p_utm_campaign, public.quiz_funnel_leads.utm_campaign),
    utm_content = coalesce(p_utm_content, public.quiz_funnel_leads.utm_content),
    utm_term = coalesce(p_utm_term, public.quiz_funnel_leads.utm_term),
    src = coalesce(p_src, public.quiz_funnel_leads.src),
    sck = coalesce(p_sck, public.quiz_funnel_leads.sck),
    ttclid = coalesce(p_ttclid, public.quiz_funnel_leads.ttclid),
    updated_at = now()
  returning * into v_lead;

  insert into public.quiz_step_events (session_id, step_index, step_name)
  values (p_session_id, p_step_index, p_step_name)
  on conflict (session_id, step_index, step_name) do nothing;

  return jsonb_build_object('success', true, 'session_id', v_lead.session_id, 'step_index', v_lead.current_step_index);
end;
$$;
