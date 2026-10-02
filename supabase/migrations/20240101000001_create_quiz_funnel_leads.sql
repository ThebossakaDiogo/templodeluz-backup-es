-- =============================================================
-- MIGRAÇÃO: Criação da tabela de leads do quiz (quiz_funnel_leads)
-- Projeto: Quiz Tarot da Milena
-- =============================================================

CREATE TABLE IF NOT EXISTS public.quiz_funnel_leads (
  id           BIGSERIAL PRIMARY KEY,
  session_id   TEXT UNIQUE NOT NULL,
  nome         TEXT,
  ente         TEXT,
  relacao      TEXT,
  intencao     TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  utm_content  TEXT,
  utm_term     TEXT,
  referrer     TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS quiz_funnel_leads_session_id_idx ON public.quiz_funnel_leads (session_id);
CREATE INDEX IF NOT EXISTS quiz_funnel_leads_created_at_idx ON public.quiz_funnel_leads (created_at DESC);

-- Row Level Security
ALTER TABLE public.quiz_funnel_leads ENABLE ROW LEVEL SECURITY;

-- Política: service_role tem acesso total
DROP POLICY IF EXISTS "service_role_quiz_leads_all" ON public.quiz_funnel_leads;
CREATE POLICY "service_role_quiz_leads_all" ON public.quiz_funnel_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política: permitir inserção anônima direta caso necessário
DROP POLICY IF EXISTS "anon_insert_quiz_leads" ON public.quiz_funnel_leads;
CREATE POLICY "anon_insert_quiz_leads" ON public.quiz_funnel_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);
