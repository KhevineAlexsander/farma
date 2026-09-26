-- ==============================================================================
-- PEPTIDE IMPORTS FARMA - SCHEMA COMPLETO DO BANCO DE DADOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Copie e cole este script integralmente no SQL Editor do seu Supabase Dashboard:
-- https://supabase.com/dashboard/project/_/sql
-- Ele criará todas as tabelas estruturadas, índices, publicação Realtime,
-- permissões RLS e inserirá todo o catálogo oficial de produtos, cupons e configurações.
-- ==============================================================================

-- 1. EXTENSÕES ÚTEIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PRODUTOS (CATÁLOGO & ESTOQUE)
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

-- 3. TABELA DE PEDIDOS
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
  paid_amount NUMERIC(10, 2) DEFAULT NULL,
  remaining_amount NUMERIC(10, 2) DEFAULT NULL,
  due_date TEXT DEFAULT NULL,
  last_reminder_sent_at TIMESTAMPTZ DEFAULT NULL,
  reminders_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente',
  payment_method TEXT NOT NULL DEFAULT 'WhatsApp / PIX',
  tracking_code TEXT,
  cleared_manually_at TIMESTAMPTZ,
  cleared_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE CUPONS DE DESCONTO
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

-- 5. TABELA DE FUNCIONÁRIOS E EQUIPE
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

-- 6. TABELA DE TRANSAÇÕES FINANCEIRAS (LIVRO CAIXA & DRE)
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

-- 7. TABELA DE CONFIGURAÇÕES DA LOJA
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'config',
  store_name TEXT NOT NULL DEFAULT 'PEPTIDE IMPORTS FARMA',
  whatsapp_number TEXT NOT NULL DEFAULT '5511993456789',
  whatsapp_display TEXT NOT NULL DEFAULT '(11) 99345-6789',
  support_email TEXT NOT NULL DEFAULT 'contato@peptideimports.com.br',
  hero_badge TEXT NOT NULL DEFAULT 'PEPTÍDEOS IMPORTADOS COM LAUDO HPLC',
  hero_title TEXT NOT NULL DEFAULT 'PEPTÍDEOS',
  hero_subtitle TEXT NOT NULL DEFAULT 'IMPORTADOS',
  hero_tagline TEXT DEFAULT 'QUALIDADE • CONFIANÇA • RESULTADOS',
  hero_description TEXT DEFAULT 'Mais performance, saúde e bem-estar para a sua melhor versão.',
  announcement_bar TEXT NOT NULL DEFAULT 'Envio Imediato com Cadeia Fria para Todo o Brasil | Cupom PEPTIDE10 para 10% OFF',
  checkout_notice TEXT NOT NULL DEFAULT 'Finalize sua compra e envie o resumo detalhado direto para nosso WhatsApp oficial para liberação imediata!',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_address TEXT NOT NULL DEFAULT 'Av. Paulista, 1842 - Conjunto 114 (Edifício Horizon), Bela Vista, São Paulo - SP',
  pickup_estimated_time TEXT NOT NULL DEFAULT 'Pronto em 2 horas úteis (Seg a Sex das 09h às 18h)',
  coupons_enabled BOOLEAN NOT NULL DEFAULT true,
  site_url TEXT DEFAULT 'https://peptideimports.vercel.app',
  vercel_domain TEXT DEFAULT 'peptideimports.vercel.app',
  custom_domain_notes TEXT DEFAULT '',
  purchases_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_title TEXT DEFAULT 'Estamos Fechando o Caixa',
  suspension_message TEXT DEFAULT 'Estamos fechando o caixa no momento. Voltaremos em breve!',
  suspension_estimated_return TEXT DEFAULT 'Voltaremos em breve',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7.1. MIGRAÇÃO SEGURA (CASO AS TABELAS JÁ TENHAM SIDO CRIADAS ANTERIORMENTE)
-- ==============================================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS due_date TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reminders_count INTEGER DEFAULT 0;

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS site_url TEXT DEFAULT 'https://peptideimports.vercel.app';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS vercel_domain TEXT DEFAULT 'peptideimports.vercel.app';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS custom_domain_notes TEXT DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS purchases_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS suspension_title TEXT DEFAULT 'Estamos Fechando o Caixa';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS suspension_message TEXT DEFAULT 'Estamos fechando o caixa no momento. Voltaremos em breve!';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS suspension_estimated_return TEXT DEFAULT 'Voltaremos em breve';

-- 8. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_finances_date ON public.financial_transactions(date DESC);

-- 9. HABILITAR SUPABASE REALTIME EM TODAS AS TABELAS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'financial_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
  END IF;
END $$;

-- 10. POLÍTICAS DE ACESSO LIVRE / ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar duplicidade
DROP POLICY IF EXISTS "Public full access products" ON public.products;
DROP POLICY IF EXISTS "Public full access orders" ON public.orders;
DROP POLICY IF EXISTS "Public full access coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public full access employees" ON public.employees;
DROP POLICY IF EXISTS "Public full access financial_transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Public full access store_settings" ON public.store_settings;

CREATE POLICY "Public full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access financial_transactions" ON public.financial_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 11. CARGA INICIAL COMPLETA DE DADOS (PRODUTOS, CUPONS E CONFIGURAÇÕES)
-- ==============================================================================

-- A. Configurações da Loja
INSERT INTO public.store_settings (
  id, store_name, whatsapp_number, whatsapp_display, support_email,
  hero_badge, hero_title, hero_subtitle, hero_tagline, hero_description,
  announcement_bar, checkout_notice, delivery_fee, pickup_enabled,
  pickup_address, pickup_estimated_time, coupons_enabled, site_url, vercel_domain
)
VALUES (
  'config',
  'PEPTIDE IMPORTS FARMA',
  '5511993456789',
  '(11) 99345-6789',
  'contato@peptideimports.com.br',
  'PEPTÍDEOS IMPORTADOS COM LAUDO HPLC',
  'PEPTÍDEOS',
  'IMPORTADOS',
  'QUALIDADE • CONFIANÇA • RESULTADOS',
  'Mais performance, saúde e bem-estar para a sua melhor versão.',
  'Envio Imediato com Cadeia Fria para Todo o Brasil | Cupom PEPTIDE10 para 10% OFF',
  'Finalize sua compra e envie o resumo detalhado direto para nosso WhatsApp oficial para liberação imediata!',
  30.00,
  true,
  'Av. Paulista, 1842 - Conjunto 114 (Edifício Horizon), Bela Vista, São Paulo - SP',
  'Pronto em 2 horas úteis (Seg a Sex das 09h às 18h)',
  true,
  'https://peptideimports.vercel.app',
  'peptideimports.vercel.app'
)
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  whatsapp_number = EXCLUDED.whatsapp_number,
  whatsapp_display = EXCLUDED.whatsapp_display,
  delivery_fee = EXCLUDED.delivery_fee,
  updated_at = now();

-- B. Catálogo Completo de Produtos Oficiais
INSERT INTO public.products (id, name, dosage, category, description, benefits, price, original_price, cost_price, stock, cap_color, purity, storage, reconstitution, image_url, featured, is_promotion, promotion_discount)
VALUES
(
  'prod-ghkcu-100', 'GHK-CU', '100 MG', 'Beleza',
  'Tripeptídeo de cobre biológico de alta pureza. Estimula síntese de colágeno e elastina, acelera a regeneração celular e elasticidade da pele.',
  '["Regeneração celular profunda", "Rejuvenescimento e elasticidade", "Pele firme e redução de rugas"]'::jsonb,
  55.00, 75.00, 22.00, 50, '#0088FF', '99.7% HPLC',
  '2°C a 8°C (Refrigerado). Proteger da luz.', 'Reconstituir com 2ml a 3ml de Água Bacteriostática.',
  NULL, true, true, 26.00
),
(
  'prod-klow-80', 'KLOW', '80 MG', 'Emagrecimento',
  'Blend avançado de sinalizadores peptídicos bioativos para modulação de saciedade, controle de apetite e termogênese mitocondrial acelerada.',
  '["Emagrecimento acelerado", "Controle intenso do apetite", "Aumento da taxa metabólica"]'::jsonb,
  260.00, 320.00, 110.00, 35, '#16A34A', '99.5% HPLC',
  '2°C a 8°C (Refrigerado).', 'Reconstituir suavemente com diluente estéril sem agitação brusca.',
  NULL, true, true, 18.00
),
(
  'prod-glow-70', 'GLOW', '70 MG', 'Emagrecimento',
  'Complexo lipotrópico e peptídico formulado para aceleração metabólica basal, queima de gordura resistente e definição com proteção celular.',
  '["Queima de gordura localizada", "Acelera o metabolismo basal", "Definição e firmeza corporal"]'::jsonb,
  150.00, 180.00, 65.00, 40, '#EC4899', '99.6% HPLC',
  '2°C a 8°C após reconstituição.', 'Diluir em 3ml de água bacteriostática estéril.',
  NULL, true, false, 0.00
),
(
  'prod-motsc-40', 'MOTS-C', '40 MG', 'Saúde',
  'Peptídeo derivado da mitocôndria regulador da homeostase metabólica, otimização da sensibilidade insulínica e longevidade celular sistêmica.',
  '["Longevidade celular e mitocondrial", "Otimização da sensibilidade insulínica", "Mais vigor físico e disposição"]'::jsonb,
  170.00, 195.00, 75.00, 30, '#06B6D4', '99.8% HPLC',
  'Manter a 2°C a 8°C ou -20°C liofilizado.', 'Reconstituir lentamente com diluente estéril.',
  NULL, true, true, 12.00
),
(
  'prod-tesamorelin-10', 'TESAMORELIN', '10 MG', 'Desempenho',
  'Análogo potente do hormônio liberador de GH (GHRH). Indicado para redução de gordura visceral profunda e estímulo da secreção pulsátil de GH.',
  '["Redução de gordura visceral", "Estímulo natural de GH e IGF-1", "Melhora da densidade e sono reparador"]'::jsonb,
  165.00, 190.00, 70.00, 25, '#1D4ED8', '99.4% HPLC',
  '2°C a 8°C. Não congelar após reconstituído.', 'Reconstituir com 2ml de água estéril.',
  NULL, false, false, 0.00
),
(
  'prod-semax-10', 'SEMAX', '10 MG', 'Saúde',
  'Peptídeo nootrópico de ação neuroprotetora e cognitiva. Eleva expressão de BDNF no cérebro, aprimorando foco, memória operacional e reflexos.',
  '["Foco e clareza mental superior", "Memória e retenção acelerada", "Neuroproteção e neuroplasticidade"]'::jsonb,
  65.00, 85.00, 28.00, 45, '#EA580C', '99.9% HPLC',
  '2°C a 8°C (Refrigerado).', 'Solúvel em água bacteriostática ou solução estéril.',
  NULL, false, false, 0.00
),
(
  'prod-selank-10', 'SELANK', '10 MG', 'Saúde',
  'Heptapeptídeo regulador de serotonina e dopamina com potente efeito ansiolítico e estabilizador de humor sem provocar sonolência.',
  '["Alívio de ansiedade e estresse", "Equilíbrio emocional sem sedação", "Melhora do foco sob pressão"]'::jsonb,
  65.00, 85.00, 28.00, 45, '#2563EB', '99.8% HPLC',
  '2°C a 8°C.', 'Reconstituir com 2ml de água bacteriostática.',
  NULL, false, false, 0.00
),
(
  'prod-cagrilintide-10', 'CAGRILINTIDE', '10 MG', 'Emagrecimento',
  'Análogo sintético de amilina de longa ação. Age nos receptores de saciedade hipotalâmicos e desacelera o esvaziamento gástrico de forma sinérgica.',
  '["Supressão prolongada do apetite", "Aceleração da perda ponderal", "Controle de picos glicêmicos"]'::jsonb,
  150.00, 175.00, 62.00, 30, '#22C55E', '99.5% HPLC',
  '2°C a 8°C. Proteger da luz.', 'Reconstituir com diluente estéril adequado.',
  NULL, false, false, 0.00
),
(
  'prod-retratutida-60', 'RETRATUTIDA', '60 MG', 'Emagrecimento',
  'Triplo agonista inovador dos receptores GLP-1, GIP e Glucagon. A nova fronteira biotecnológica global em queima de gordura e reprogramação metabólica.',
  '["Triplo agonista GLP-1 / GIP / Glucagon", "Máxima redução de gordura corporal", "Aceleração metabólica sem precedentes"]'::jsonb,
  285.00, 340.00, 125.00, 35, '#DC2626', '99.7% HPLC',
  '2°C a 8°C (Refrigerado).', 'Reconstituir com 2ml a 3ml de água bacteriostática estéril.',
  NULL, true, true, 16.00
),
(
  'prod-epithalon-10', 'EPITHALON', '10 MG', 'Saúde',
  'Tetrapeptídeo epitalâmico ativador da enzima telomerase. Estimula a regeneração de tecidos, equilíbrio neuroendócrino e desaceleração do envelhecimento.',
  '["Ativação comprovada da telomerase", "Reversão de biomarcadores de idade", "Sono profundo e sincronização circadiana"]'::jsonb,
  60.00, 80.00, 25.00, 40, '#F59E0B', '99.6% HPLC',
  '2°C a 8°C.', 'Reconstituir com 2ml de diluente estéril.',
  NULL, false, false, 0.00
),
(
  'prod-tirze-60', 'TIRZE', '60 MG', 'Emagrecimento',
  'Duplo agonista dos receptores GIP e GLP-1 em apresentação concentrada de 60mg. Promove regulação metabólica avançada, controle de glicose e perda de gordura.',
  '["Duplo agonista GIP e GLP-1", "Redução profunda da compulsão alimentar", "Otimização lipídica e sensibilidade à insulina"]'::jsonb,
  160.00, 190.00, 68.00, 50, '#9333EA', '99.8% HPLC',
  '2°C a 8°C (Refrigerado). Proteger da radiação solar.', 'Reconstituir com cuidado sem agitação turbulenta.',
  NULL, true, true, 15.00
),
(
  'prod-botox-100', 'BOTOX', '100 UI', 'Beleza',
  'Toxina botulínica de padrão internacional e pureza máxima. Indicada para suavização estética de linhas de expressão dinâmicas e relaxamento muscular.',
  '["Alta pureza e estabilidade clínica", "Atenuação de rugas e linhas faciais", "Padrão internacional de qualidade"]'::jsonb,
  100.00, 130.00, 42.00, 35, '#94A3B8', '100 UI Liofilizado',
  'Manter a -5°C a -20°C ou refrigerado 2°C a 8°C.', 'Diluir em 2,5ml de soro fisiológico estéril conforme protocolo.',
  NULL, false, false, 0.00
),
(
  'prod-botox-allergan-100', 'BOTOX ALLERGAN', '100 U', 'Beleza',
  'Toxina Botulínica Tipo A Allergan Original (100 Unidades). Padrão ouro mundial em medicina estética e harmonização facial, pó liofilizado sob vácuo estéril com máxima estabilidade e pureza comprovada.',
  '["Allergan Original (Padrão Ouro)", "Máxima eficácia e durabilidade clínica", "Pó liofilizado a vácuo estéril (100 U)"]'::jsonb,
  300.00, 360.00, 150.00, 25, '#6B21A8', '100 U Original Allergan',
  '-5°C a -20°C ou 2°C a 8°C (Refrigerado).', 'Reconstituir com 2,5ml de soro fisiológico 0,9% estéril sem conservantes.',
  '/images/botox_allergan_100u.jpg', true, false, 0.00
),
(
  'prod-agua-bac-3', 'ÁGUA BAC', '3 MG', 'Saúde',
  'Água bacteriostática estéril para reconstituição de peptídeos, com 0,9% de álcool benzílico bacteriostático. Impede a proliferação bacteriana por semanas.',
  '["Pureza microbiológica estéril", "Preserva peptídeos na geladeira por 30+ dias", "Ampola/frasco de grau farmacêutico"]'::jsonb,
  20.00, 25.00, 6.00, 120, '#0891B2', 'Grau Farmacêutico USP',
  'Temperatura ambiente controlada ou 2°C a 8°C.', 'Pronta para uso na diluição de peptídeos.',
  NULL, false, false, 0.00
),
(
  'prod-acido-bac-10', 'ÁCIDO BAC', '10 MG', 'Saúde',
  'Solução bacteriostática de pH levemente ácido formulada especificamente para a dissolução imediata de peptídeos com solubilidade hidrofóbica e sensíveis.',
  '["Solubilização instantânea e transparente", "pH calibrado para máxima estabilidade", "Grau laboratorial de alta pureza"]'::jsonb,
  25.00, 32.00, 8.00, 90, '#7C3AED', 'Pureza Laboratorial',
  'Armazenar em local seco e fresco, protegido da luz.', 'Pronta para uso.',
  NULL, false, false, 0.00
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  dosage = EXCLUDED.dosage,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  cost_price = EXCLUDED.cost_price,
  stock = EXCLUDED.stock,
  cap_color = EXCLUDED.cap_color,
  purity = EXCLUDED.purity,
  storage = EXCLUDED.storage,
  reconstitution = EXCLUDED.reconstitution,
  image_url = EXCLUDED.image_url,
  featured = EXCLUDED.featured,
  is_promotion = EXCLUDED.is_promotion,
  promotion_discount = EXCLUDED.promotion_discount,
  updated_at = now();

-- C. Cupons de Desconto Oficiais
INSERT INTO public.coupons (id, code, type, value, min_order_amount, status, usage_count, max_usage, description)
VALUES
(
  'coup-1', 'PEPTIDE10', 'PERCENTAGE', 10.00, 150.00, 'Ativo', 42, 250,
  '10% de desconto em pedidos acima de R$ 150'
),
(
  'coup-2', 'PRIMEIRACOMPRA', 'PERCENTAGE', 15.00, 200.00, 'Ativo', 18, 100,
  '15% de boas-vindas para primeira compra acima de R$ 200'
),
(
  'coup-3', 'VIP50', 'FIXED', 50.00, 300.00, 'Ativo', 9, 50,
  'R$ 50,00 de desconto direto em compras acima de R$ 300'
)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  min_order_amount = EXCLUDED.min_order_amount,
  status = EXCLUDED.status,
  updated_at = now();

-- ==============================================================================
-- FIM DO SCRIPT - TABELAS, REALTIME E DADOS CARREGADOS COM SUCESSO NO SUPABASE!
-- ==============================================================================
