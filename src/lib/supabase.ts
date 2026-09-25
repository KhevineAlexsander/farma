import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order, Coupon, Employee, FinancialTransaction, StoreSettings } from '../types';

// Load Supabase credentials from environment or localStorage override
const getEnvOrStorage = (envKey: string, storageKey: string, fallback = ''): string => {
  try {
    const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  } catch {}
  
  try {
    // @ts-ignore
    const fromEnv = import.meta.env?.[envKey];
    if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();
  } catch {}

  return fallback;
};

export const SUPABASE_URL = getEnvOrStorage('VITE_SUPABASE_URL', 'peptide_supabase_url', '');
export const SUPABASE_ANON_KEY = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'peptide_supabase_anon_key', '');

let clientInstance: SupabaseClient | null = null;

export const setSupabaseCredentials = (url: string, key: string) => {
  try {
    if (url.trim()) {
      localStorage.setItem('peptide_supabase_url', url.trim());
    } else {
      localStorage.removeItem('peptide_supabase_url');
    }
    if (key.trim()) {
      localStorage.setItem('peptide_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('peptide_supabase_anon_key');
    }
    clientInstance = null; // Reset cached client instance
  } catch (e) {
    console.error('Error storing supabase credentials:', e);
  }
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL', 'peptide_supabase_url', '');
  const key = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'peptide_supabase_anon_key', '');

  if (!url || !key) {
    return null;
  }

  if (!clientInstance || clientInstance['supabaseUrl'] !== url) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return null;
    }
  }

  return clientInstance;
};

export const isSupabaseConfigured = (): boolean => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL', 'peptide_supabase_url', '');
  const key = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'peptide_supabase_anon_key', '');
  return Boolean(url && key && url.startsWith('http'));
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; tablesCount?: number }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'URL ou Anon Key do Supabase não configurados.' };
  }

  try {
    const { data, error } = await client.from('products').select('id').limit(1);
    if (error) {
      return { success: false, message: `Erro ao consultar tabela products: ${error.message}` };
    }
    return { success: true, message: 'Conexão com Supabase efetuada com sucesso! Tabelas acessíveis.' };
  } catch (err: any) {
    return { success: false, message: `Falha na conexão: ${err?.message || 'Erro desconhecido'}` };
  }
};

// ==========================================
// DATA MAPPERS (CamelCase <-> SnakeCase)
// ==========================================

export const mapProductToDB = (p: Product) => ({
  id: p.id,
  name: p.name,
  dosage: p.dosage,
  category: p.category,
  description: p.description,
  benefits: p.benefits || [],
  price: p.price,
  original_price: p.originalPrice ?? null,
  cost_price: p.costPrice ?? 0,
  stock: p.stock ?? 0,
  cap_color: p.capColor || '#06b6d4',
  purity: p.purity || '99.4% HPLC',
  storage: p.storage || '2°C a 8°C (Refrigerado)',
  reconstitution: p.reconstitution || 'Água bacteriostática (2ml a 3ml)',
  image_url: p.imageUrl || null,
  featured: Boolean(p.featured),
  is_promotion: Boolean(p.isPromotion),
  promotion_discount: p.promotionDiscount ?? 0,
  updated_at: new Date().toISOString(),
});

export const mapDBToProduct = (d: any): Product => ({
  id: d.id,
  name: d.name,
  dosage: d.dosage,
  category: d.category,
  description: d.description,
  benefits: Array.isArray(d.benefits) ? d.benefits : [],
  price: Number(d.price),
  originalPrice: d.original_price != null ? Number(d.original_price) : undefined,
  costPrice: Number(d.cost_price ?? 0),
  stock: Number(d.stock ?? 0),
  capColor: d.cap_color || '#06b6d4',
  purity: d.purity || '99.4% HPLC',
  storage: d.storage || '2°C a 8°C (Refrigerado)',
  reconstitution: d.reconstitution || 'Água bacteriostática (2ml a 3ml)',
  imageUrl: d.image_url || undefined,
  featured: Boolean(d.featured),
  isPromotion: Boolean(d.is_promotion),
  promotionDiscount: d.promotion_discount != null ? Number(d.promotion_discount) : undefined,
});

export const mapOrderToDB = (o: Order) => {
  return {
    id: o.id,
    order_number: o.orderNumber,
    customer: o.customer,
    address: o.address,
    items: o.items || [],
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    total: o.total,
    paid_amount: o.paidAmount != null ? o.paidAmount : null,
    remaining_amount: o.remainingAmount != null ? o.remainingAmount : null,
    due_date: o.dueDate || null,
    last_reminder_sent_at: o.lastReminderSentAt || null,
    reminders_count: o.remindersCount != null ? o.remindersCount : 0,
    status: o.status,
    payment_method: o.paymentMethod,
    tracking_code: o.trackingCode || null,
    cleared_manually_at: o.clearedManuallyAt || null,
    cleared_by: o.clearedBy || null,
    notes: o.notes || null,
    created_at: o.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const mapDBToOrder = (d: any): Order => {
  const o: Order = {
    id: d.id,
    orderNumber: d.order_number || d.orderNumber,
    customer: d.customer,
    address: d.address,
    items: d.items || [],
    subtotal: Number(d.subtotal || 0),
    shipping: Number(d.shipping ?? 0),
    discount: Number(d.discount ?? 0),
    total: Number(d.total || 0),
    status: d.status || 'Pendente',
    paymentMethod: d.payment_method || d.paymentMethod || 'A Combinar',
    createdAt: d.created_at || d.createdAt || new Date().toISOString(),
  };

  if (d.paid_amount != null || d.paidAmount != null) {
    o.paidAmount = Number(d.paid_amount != null ? d.paid_amount : d.paidAmount);
  }
  if (d.remaining_amount != null || d.remainingAmount != null) {
    o.remainingAmount = Number(d.remaining_amount != null ? d.remaining_amount : d.remainingAmount);
  }
  if (d.due_date || d.dueDate) {
    o.dueDate = d.due_date || d.dueDate;
  }
  if (d.last_reminder_sent_at || d.lastReminderSentAt) {
    o.lastReminderSentAt = d.last_reminder_sent_at || d.lastReminderSentAt;
  }
  if (d.reminders_count != null || d.remindersCount != null) {
    o.remindersCount = Number(d.reminders_count != null ? d.reminders_count : d.remindersCount);
  }
  if (d.tracking_code || d.trackingCode) {
    o.trackingCode = d.tracking_code || d.trackingCode;
  }
  if (d.cleared_manually_at || d.clearedManuallyAt) {
    o.clearedManuallyAt = d.cleared_manually_at || d.clearedManuallyAt;
  }
  if (d.cleared_by || d.clearedBy) {
    o.clearedBy = d.cleared_by || d.clearedBy;
  }
  if (d.notes) {
    o.notes = d.notes;
  }

  return o;
};

export const mapCouponToDB = (c: Coupon) => ({
  id: c.id,
  code: c.code,
  type: c.type,
  value: c.value,
  min_order_amount: c.minOrderAmount ?? 0,
  status: c.status,
  usage_count: c.usageCount ?? 0,
  max_usage: c.maxUsage ?? null,
  expires_at: c.expiresAt ?? null,
  description: c.description || null,
  updated_at: new Date().toISOString(),
});

export const mapDBToCoupon = (d: any): Coupon => ({
  id: d.id,
  code: d.code,
  type: d.type,
  value: Number(d.value),
  minOrderAmount: d.min_order_amount != null ? Number(d.min_order_amount) : undefined,
  status: d.status,
  usageCount: Number(d.usage_count ?? 0),
  maxUsage: d.max_usage != null ? Number(d.max_usage) : undefined,
  expiresAt: d.expires_at || undefined,
  description: d.description || undefined,
});

export const mapEmployeeToDB = (e: Employee) => ({
  id: e.id,
  name: e.name,
  email: e.email,
  phone: e.phone,
  password: e.password || null,
  role: e.role,
  status: e.status,
  permissions: e.permissions,
  created_at: e.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const mapDBToEmployee = (d: any): Employee => ({
  id: d.id,
  name: d.name,
  email: d.email,
  phone: d.phone,
  password: d.password || undefined,
  role: d.role,
  status: d.status,
  permissions: d.permissions,
  createdAt: d.created_at,
});

export const mapFinToDB = (t: FinancialTransaction) => ({
  id: t.id,
  date: t.date,
  type: t.type,
  description: t.description,
  category: t.category,
  amount: t.amount,
  order_id: t.orderId || null,
});

export const mapDBToFin = (d: any): FinancialTransaction => ({
  id: d.id,
  date: d.date,
  type: d.type,
  description: d.description,
  category: d.category,
  amount: Number(d.amount),
  orderId: d.order_id || undefined,
});

export const mapSettingsToDB = (s: StoreSettings) => ({
  id: 'config',
  store_name: s.storeName,
  whatsapp_number: s.whatsappNumber,
  whatsapp_display: s.whatsappDisplay,
  support_email: s.supportEmail,
  hero_badge: s.heroBadge,
  hero_title: s.heroTitle,
  hero_subtitle: s.heroSubtitle,
  hero_tagline: s.heroTagline || null,
  hero_description: s.heroDescription || null,
  announcement_bar: s.announcementBar,
  checkout_notice: s.checkoutNotice,
  delivery_fee: s.deliveryFee,
  pickup_enabled: s.pickupEnabled,
  pickup_address: s.pickupAddress,
  pickup_estimated_time: s.pickupEstimatedTime,
  coupons_enabled: s.couponsEnabled ?? true,
  site_url: s.siteUrl || 'https://peptideimports.vercel.app',
  vercel_domain: s.vercelDomain || 'peptideimports.vercel.app',
  custom_domain_notes: s.customDomainNotes || '',
  purchases_suspended: s.purchasesSuspended ?? false,
  suspension_title: s.suspensionTitle || 'Estamos Fechando o Caixa',
  suspension_message: s.suspensionMessage || 'Estamos fechando o caixa no momento. Voltaremos em breve!',
  suspension_estimated_return: s.suspensionEstimatedReturn || 'Voltaremos em breve',
  updated_at: new Date().toISOString(),
});

export const mapDBToSettings = (d: any): Partial<StoreSettings> => ({
  storeName: d.store_name,
  whatsappNumber: d.whatsapp_number,
  whatsappDisplay: d.whatsapp_display,
  supportEmail: d.support_email,
  heroBadge: d.hero_badge,
  heroTitle: d.hero_title,
  heroSubtitle: d.hero_subtitle,
  heroTagline: d.hero_tagline || undefined,
  heroDescription: d.hero_description || undefined,
  announcementBar: d.announcement_bar,
  checkoutNotice: d.checkout_notice,
  deliveryFee: d.delivery_fee != null ? Number(d.delivery_fee) : 35,
  pickupEnabled: Boolean(d.pickup_enabled),
  pickupAddress: d.pickup_address,
  pickupEstimatedTime: d.pickup_estimated_time,
  couponsEnabled: d.coupons_enabled ?? true,
  siteUrl: d.site_url || 'https://peptideimports.vercel.app',
  vercelDomain: d.vercel_domain || 'peptideimports.vercel.app',
  customDomainNotes: d.custom_domain_notes || '',
  purchasesSuspended: Boolean(d.purchases_suspended),
  suspensionTitle: d.suspension_title || 'Estamos Fechando o Caixa',
  suspensionMessage: d.suspension_message || 'Estamos fechando o caixa no momento. Voltaremos em breve!',
  suspensionEstimatedReturn: d.suspension_estimated_return || 'Voltaremos em breve',
});
