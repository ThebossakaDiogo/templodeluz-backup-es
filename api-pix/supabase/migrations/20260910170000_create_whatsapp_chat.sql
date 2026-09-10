-- Chat operacional isolado da telemetria legada whatsapp_conversations.
-- O profile_origin e validado novamente pelas Edge Functions de cada deployment.

create table if not exists public.whatsapp_chat_settings (
  profile_origin text primary key check (profile_origin in ('original', 'mirrored')),
  ai_enabled boolean not null default false,
  automation_enabled boolean not null default false,
  ai_system_prompt text not null default 'Responda em portugues do Brasil de forma acolhedora, objetiva e honesta. Nao invente informacoes, valores, links ou prazos. Encaminhe assuntos sensiveis para um atendente humano.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_chat_threads (
  id uuid primary key default gen_random_uuid(),
  profile_origin text not null check (profile_origin in ('original', 'mirrored')),
  customer_phone text not null check (customer_phone ~ '^[0-9]{8,16}$'),
  customer_name text,
  evolution_instance text,
  status text not null default 'open' check (status in ('open', 'resolved', 'opted_out')),
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message_preview text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_origin, customer_phone)
);

create table if not exists public.whatsapp_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.whatsapp_chat_threads(id) on delete cascade,
  profile_origin text not null check (profile_origin in ('original', 'mirrored')),
  provider_message_id text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  author_type text not null check (author_type in ('customer', 'admin', 'ai', 'system')),
  message_type text not null default 'text' check (message_type in ('text', 'image', 'video', 'audio', 'document')),
  body text not null default '',
  media_url text,
  delivery_status text not null default 'received' check (delivery_status in ('pending', 'received', 'sent', 'delivered', 'read', 'failed')),
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_chat_threads_profile_activity_idx
  on public.whatsapp_chat_threads (profile_origin, last_message_at desc nulls last);
create index if not exists whatsapp_chat_messages_thread_created_idx
  on public.whatsapp_chat_messages (thread_id, created_at asc);
create index if not exists whatsapp_chat_messages_profile_created_idx
  on public.whatsapp_chat_messages (profile_origin, created_at desc);

-- Campos de leitura do inbox e biblioteca privada de materiais.
alter table public.whatsapp_chat_threads
  add column if not exists customer_email text,
  add column if not exists ente_querido text,
  add column if not exists payment_status text check (payment_status in ('paid', 'pending', 'none')),
  add column if not exists last_message_content text,
  add column if not exists last_message_direction text check (last_message_direction in ('inbound', 'outbound', 'ai'));

alter table public.whatsapp_chat_messages
  add column if not exists content text,
  add column if not exists media_name text,
  add column if not exists failure_reason text,
  add column if not exists remote_message_id text unique;

create table if not exists public.whatsapp_chat_materials (
  id uuid primary key default gen_random_uuid(),
  profile_origin text not null check (profile_origin in ('original', 'mirrored')),
  name text not null,
  category text,
  description text,
  mime_type text not null,
  size_bytes integer not null check (size_bytes >= 0),
  storage_path text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_chat_ai_runs (
  id uuid primary key default gen_random_uuid(),
  profile_origin text not null check (profile_origin in ('original', 'mirrored')),
  thread_id uuid not null references public.whatsapp_chat_threads(id) on delete cascade,
  status text not null check (status in ('draft', 'sent', 'skipped', 'failed')),
  summary text,
  error text,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('whatsapp-chat-materials', 'whatsapp-chat-materials', false)
on conflict (id) do nothing;

create index if not exists whatsapp_chat_materials_profile_created_idx on public.whatsapp_chat_materials (profile_origin, created_at desc);
create index if not exists whatsapp_chat_ai_runs_thread_created_idx on public.whatsapp_chat_ai_runs (thread_id, created_at desc);

create or replace function public.whatsapp_chat_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists whatsapp_chat_settings_touch_updated_at on public.whatsapp_chat_settings;
create trigger whatsapp_chat_settings_touch_updated_at
  before update on public.whatsapp_chat_settings
  for each row execute function public.whatsapp_chat_touch_updated_at();

drop trigger if exists whatsapp_chat_threads_touch_updated_at on public.whatsapp_chat_threads;
create trigger whatsapp_chat_threads_touch_updated_at
  before update on public.whatsapp_chat_threads
  for each row execute function public.whatsapp_chat_touch_updated_at();

create or replace function public.whatsapp_chat_apply_message()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_thread_profile text;
begin
  select profile_origin into v_thread_profile
  from public.whatsapp_chat_threads
  where id = new.thread_id;

  if v_thread_profile is null or v_thread_profile <> new.profile_origin then
    raise exception 'WHATSAPP_CHAT_PROFILE_MISMATCH';
  end if;

  update public.whatsapp_chat_threads
  set last_message_preview = left(nullif(new.body, ''), 500),
      last_message_content = left(nullif(coalesce(new.content, new.body), ''), 500),
      last_message_direction = case when new.author_type = 'ai' then 'ai' else new.direction end,
      last_message_at = new.created_at,
      unread_count = case when new.direction = 'inbound' then unread_count + 1 else unread_count end
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists whatsapp_chat_messages_apply on public.whatsapp_chat_messages;
create trigger whatsapp_chat_messages_apply
  after insert on public.whatsapp_chat_messages
  for each row execute function public.whatsapp_chat_apply_message();

alter table public.whatsapp_chat_settings enable row level security;
alter table public.whatsapp_chat_threads enable row level security;
alter table public.whatsapp_chat_messages enable row level security;
alter table public.whatsapp_chat_materials enable row level security;
alter table public.whatsapp_chat_ai_runs enable row level security;

revoke all on table public.whatsapp_chat_settings, public.whatsapp_chat_threads, public.whatsapp_chat_messages, public.whatsapp_chat_materials, public.whatsapp_chat_ai_runs from public, anon, authenticated;
revoke all on function public.whatsapp_chat_touch_updated_at() from public, anon, authenticated;
revoke all on function public.whatsapp_chat_apply_message() from public, anon, authenticated;

insert into public.whatsapp_chat_settings (profile_origin)
values ('original'), ('mirrored')
on conflict (profile_origin) do nothing;
