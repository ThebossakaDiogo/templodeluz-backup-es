-- =============================================================
-- MIGRAÇÃO: Criação da tabela de pedidos (orders)
-- Projeto: Quiz Tarot da Milena
-- =============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id                  BIGSERIAL PRIMARY KEY,
  external_id         TEXT UNIQUE NOT NULL,
  transaction_id      TEXT,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  amount              NUMERIC(10,2),
  payment_method      TEXT DEFAULT 'PIX',
  name                TEXT,
  phone               TEXT,
  email               TEXT,
  document            TEXT,
  ente                TEXT,
  letter              TEXT,
  package_title       TEXT,
  package_description TEXT,
  package             JSONB,
  tracking            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS orders_external_id_idx    ON public.orders (external_id);
CREATE INDEX IF NOT EXISTS orders_transaction_id_idx ON public.orders (transaction_id);
CREATE INDEX IF NOT EXISTS orders_status_idx         ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx     ON public.orders (created_at DESC);

-- Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política: service_role tem acesso total (para as APIs do servidor)
DROP POLICY IF EXISTS "service_role_all" ON public.orders;
CREATE POLICY "service_role_all" ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
