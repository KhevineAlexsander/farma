-- ==============================================================================
-- PEPTIDE IMPORTS FARMA - SCHEMA COMPLETO DO BANCO DE DADOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard/project/_/sql)
-- para criar todas as tabelas, índices, políticas de segurança (RLS) e dados iniciais.
-- ==============================================================================

-- 1. TABELA DE PRODUTOS (CATÁLOGO & ESTOQUE)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 0,
  cap_color TEXT NOT NULL DEFAULT '#06b6d4',
  purity TEXT NOT NULL DEFAULT '99.4% HPLC',
  storage TEXT NOT NULL DEFAULT '2°C a 8°C (Refrigerado)',
  reconstitution TEXT NOT NULL DEFAULT 'Água bacteriostática (2ml a 3ml)',
  image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_promotion BOOLEAN NOT NULL DEFAULT false,
  promotion_discount NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer JSONB NOT NULL,
  address JSONB NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  payment_method TEXT NOT NULL DEFAULT 'WhatsApp / A Combinar',
  tracking_code TEXT,
  cleared_manually_at TIMESTAMPTZ,
  cleared_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA DE CUPONS DE DESCONTO
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'PERCENTAGE',
  value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Ativo',
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_usage INTEGER,
  expires_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE FUNCIONÁRIOS E EQUIPE
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'Atendente de Vendas',
  status TEXT NOT NULL DEFAULT 'Ativo',
  permissions JSONB NOT NULL DEFAULT '{"canManageProducts": true, "canManageOrders": true, "canManageFinances": false, "canManageStaff": false, "canManageSettings": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABELA DE TRANSAÇÕES FINANCEIRAS (LIVRO CAIXA & DRE)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL, -- 'ENTRADA' ou 'SAIDA'
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABELA DE CONFIGURAÇÕES DA LOJA
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'config',
  store_name TEXT NOT NULL DEFAULT 'PEPTIDE IMPORTS FARMA',
  whatsapp_number TEXT NOT NULL DEFAULT '5511993456789',
  whatsapp_display TEXT NOT NULL DEFAULT '(11) 99345-6789',
  support_email TEXT NOT NULL DEFAULT 'atendimento@peptideimports.com.br',
  hero_badge TEXT NOT NULL DEFAULT 'PEPTÍDEOS ULTRA-PUROS COM LAUDO HPLC',
  hero_title TEXT NOT NULL DEFAULT 'Excelência Farmacêutica em Peptídeos Bioidênticos',
  hero_subtitle TEXT NOT NULL DEFAULT 'Importação direta dos melhores laboratórios dos EUA e Europa com entrega expressa refrigerada.',
  hero_tagline TEXT DEFAULT 'Pureza >99.4% certificada por HPLC e espectrometria de massa.',
  hero_description TEXT DEFAULT 'Garantia absoluta de conservação de cadeia fria e rastreamento ponto a ponto.',
  announcement_bar TEXT NOT NULL DEFAULT '🚀 FRETE EXPRESSO REFRIGERADO PARA TODO O BRASIL | CUPOM: PEPTIDE10',
  checkout_notice TEXT NOT NULL DEFAULT 'Atendimento consultivo e finalização de envio via WhatsApp com suporte farmacêutico.',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 35.00,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_address TEXT NOT NULL DEFAULT 'Av. Paulista, 1842 - Conjunto 114 (Edifício Horizon), Bela Vista, São Paulo - SP',
  pickup_estimated_time TEXT NOT NULL DEFAULT 'Pronto em 2 horas úteis (Seg a Sex das 09h às 18h)',
  coupons_enabled BOOLEAN NOT NULL DEFAULT true,
  site_url TEXT DEFAULT 'https://peptideimports.vercel.app',
  vercel_domain TEXT DEFAULT 'peptideimports.vercel.app',
  custom_domain_notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- HABILITAR SUPABASE REALTIME EM TODAS AS TABELAS
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- ==============================================================================
-- POLÍTICAS DE ACESSO LIVRE / ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura e escrita pela chave anônima (anon)
CREATE POLICY "Public full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access financial_transactions" ON public.financial_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- CARGA INICIAL DE CONFIGURAÇÕES (UPSERT INICIAL)
-- ==============================================================================
INSERT INTO public.store_settings (id, store_name, whatsapp_number, whatsapp_display, support_email, hero_badge, hero_title, hero_subtitle, announcement_bar, checkout_notice, delivery_fee, pickup_enabled, pickup_address, pickup_estimated_time, coupons_enabled, site_url, vercel_domain)
VALUES (
  'config',
  'PEPTIDE IMPORTS FARMA',
  '5511993456789',
  '(11) 99345-6789',
  'atendimento@peptideimports.com.br',
  'PEPTÍDEOS ULTRA-PUROS COM LAUDO HPLC',
  'Excelência Farmacêutica em Peptídeos Bioidênticos',
  'Importação direta dos melhores laboratórios dos EUA e Europa com entrega expressa refrigerada.',
  '🚀 FRETE EXPRESSO REFRIGERADO PARA TODO O BRASIL | CUPOM: PEPTIDE10',
  'Atendimento consultivo e finalização de envio via WhatsApp com suporte farmacêutico.',
  35.00,
  true,
  'Av. Paulista, 1842 - Conjunto 114 (Edifício Horizon), Bela Vista, São Paulo - SP',
  'Pronto em 2 horas úteis (Seg a Sex das 09h às 18h)',
  true,
  'https://peptideimports.vercel.app',
  'peptideimports.vercel.app'
)
ON CONFLICT (id) DO NOTHING;
