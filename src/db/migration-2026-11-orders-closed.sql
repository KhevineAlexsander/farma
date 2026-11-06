-- Migration: colunas e tabela usadas pelo código que não existem em supabase-schema.sql.
-- Sem elas, o Supabase rejeita o INSERT/UPSERT inteiro do pedido ("Could not find the
-- 'closed_at' column of 'orders' in the schema cache") e os pedidos só ficam no Firestore.
-- Rode no Supabase: Dashboard > SQL Editor > New query > colar > Run. É seguro rodar mais de uma vez.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS closed_at TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS closed_session_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS closed_session_name TEXT;

-- Tabela de pedidos fechados (caixa), mesma estrutura de orders.
CREATE TABLE IF NOT EXISTS public.closed_orders (LIKE public.orders INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
ALTER TABLE public.closed_orders DROP CONSTRAINT IF EXISTS closed_orders_pkey;
ALTER TABLE public.closed_orders ADD PRIMARY KEY (id);

ALTER TABLE public.closed_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access closed_orders" ON public.closed_orders;
CREATE POLICY "Public full access closed_orders" ON public.closed_orders FOR ALL USING (true) WITH CHECK (true);

-- Força o PostgREST a recarregar o schema (senão o erro de coluna continua até o cache expirar).
NOTIFY pgrst, 'reload schema';
