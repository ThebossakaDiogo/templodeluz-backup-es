alter table public.quiz_funnel_leads
  add column if not exists checkout_opened boolean not null default false,
  add column if not exists checkout_opened_at timestamptz,
  add column if not exists checkout_form_started boolean not null default false,
  add column if not exists checkout_form_started_at timestamptz;

create or replace function public.capture_checkout_stage_flags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.checkout_status in ('checkout_opened', 'checkout_initiated') then
    new.checkout_opened := true;
    new.checkout_opened_at := coalesce(new.checkout_opened_at, now());
  elsif new.checkout_status = 'checkout_form_started' then
    new.checkout_form_started := true;
    new.checkout_form_started_at := coalesce(new.checkout_form_started_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists quiz_funnel_leads_capture_checkout_stage_flags on public.quiz_funnel_leads;
create trigger quiz_funnel_leads_capture_checkout_stage_flags
before insert or update of checkout_status on public.quiz_funnel_leads
for each row execute function public.capture_checkout_stage_flags();
