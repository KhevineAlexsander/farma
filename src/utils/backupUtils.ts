import { Product, Order, StoreSettings, FinancialTransaction } from '../types';
import { isBlacklistedOrder } from '../context/AppContext';

export interface BackupDataPayload {
  version: string;
  system: string;
  timestamp: string;
  dateFormatted: string;
  source: string;
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalPaidRevenue: number;
    paidOrdersCount: number;
    pendingOrdersCount: number;
  };
  products: Product[];
  orders: Order[];
  storeSettings?: Partial<StoreSettings>;
  financialTransactions?: FinancialTransaction[];
  metadata?: {
    appName: string;
    generatedAt: string;
    exportedBy?: string;
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  payload?: BackupDataPayload;
  summary?: {
    productsCount: number;
    ordersCount: number;
    totalRevenue: number;
    timestamp?: string;
    productsSample: string[];
    ordersSample: string[];
  };
}

/**
 * Normalizes and cleans undefined or non-serializable fields for JSON and Firestore storage
 */
export function cleanObjectForStorage<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanObjectForStorage(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanObjectForStorage(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Compiles all current products and orders into a structured backup payload
 */
export function generateBackupPayload(
  products: Product[],
  orders: Order[],
  options?: {
    storeSettings?: StoreSettings;
    financialTransactions?: FinancialTransaction[];
    userEmail?: string;
  }
): BackupDataPayload {
  const now = new Date();
  const dateFormatted = now.toLocaleString('pt-BR');

  // Filter out any blacklisted corrupt orders
  const sanitizedOrders = (orders || [])
    .filter((o) => !isBlacklistedOrder(o))
    .map((o) => cleanObjectForStorage(o));

  const sanitizedProducts = (products || []).map((p) => cleanObjectForStorage(p));

  const totalRevenue = sanitizedOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const totalPaidRevenue = sanitizedOrders.reduce((acc, o) => {
    const paid = o.paidAmount !== undefined ? Number(o.paidAmount) : (o.status === 'Pago' || o.status === 'Entregue' || o.status === 'Enviado' ? Number(o.total) || 0 : 0);
    return acc + paid;
  }, 0);

  const paidOrdersCount = sanitizedOrders.filter(
    (o) => o.status === 'Pago' || o.status === 'Entregue' || o.status === 'Enviado'
  ).length;

  const pendingOrdersCount = sanitizedOrders.length - paidOrdersCount;

  return {
    version: '2.0',
    system: 'PEPTIDE IMPORTS FARMA ERP',
    timestamp: now.toISOString(),
    dateFormatted,
    source: 'ADMIN_DASHBOARD_BACKUP',
    stats: {
      totalProducts: sanitizedProducts.length,
      totalOrders: sanitizedOrders.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalPaidRevenue: Number(totalPaidRevenue.toFixed(2)),
      paidOrdersCount,
      pendingOrdersCount,
    },
    products: sanitizedProducts,
    orders: sanitizedOrders,
    storeSettings: options?.storeSettings ? cleanObjectForStorage(options.storeSettings) : undefined,
    financialTransactions: options?.financialTransactions ? cleanObjectForStorage(options.financialTransactions) : undefined,
    metadata: {
      appName: 'Peptide Imports Farma',
      generatedAt: dateFormatted,
      exportedBy: options?.userEmail || 'Administrador Master',
    },
  };
}

/**
 * Triggers browser download of backup payload as formatted .json file
 */
export function downloadBackupFile(
  payload: BackupDataPayload,
  customPrefix = 'backup_peptide_produtos_pedidos'
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}h${pad(now.getMinutes())}`;
  const filename = `${customPrefix}_${datePart}_${timePart}.json`;

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Validates, checks structure and parses an imported backup JSON file or string
 */
export function parseAndValidateBackupJson(rawText: string): BackupValidationResult {
  if (!rawText || !rawText.trim()) {
    return { isValid: false, error: 'O arquivo de backup está vazio.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch (err: any) {
    return {
      isValid: false,
      error: `Formato JSON inválido. Verifique se o arquivo não está corrompido: ${err?.message || ''}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { isValid: false, error: 'O conteúdo do arquivo não é um objeto JSON válido.' };
  }

  // Support directly array of products/orders or the full BackupDataPayload structure
  let extractedProducts: Product[] = [];
  let extractedOrders: Order[] = [];

  if (Array.isArray(parsed.products)) {
    extractedProducts = parsed.products;
  } else if (Array.isArray(parsed) && parsed.length > 0 && ('price' in parsed[0] || 'dosage' in parsed[0])) {
    extractedProducts = parsed;
  }

  if (Array.isArray(parsed.orders)) {
    extractedOrders = parsed.orders;
  } else if (Array.isArray(parsed) && parsed.length > 0 && ('orderNumber' in parsed[0] || 'customer' in parsed[0])) {
    extractedOrders = parsed;
  }

  if (extractedProducts.length === 0 && extractedOrders.length === 0) {
    return {
      isValid: false,
      error: 'Nenhum produto ou pedido válido foi localizado dentro deste arquivo JSON.',
    };
  }

  // Sanitize and filter products
  const sanitizedProducts: Product[] = extractedProducts
    .filter((p) => p && typeof p === 'object' && (p.name || p.id))
    .map((p, index) => ({
      id: String(p.id || `prod-restored-${index + 1}`),
      name: String(p.name || 'PRODUTO').toUpperCase().trim(),
      dosage: String(p.dosage || '10 MG').toUpperCase().trim(),
      category: String(p.category || 'Geral'),
      description: String(p.description || ''),
      benefits: Array.isArray(p.benefits) ? p.benefits : ['Laudo laboratorial HPLC certificado', 'Alta pureza molecular'],
      price: Number(p.price) || 0,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      costPrice: Number(p.costPrice) || 0,
      stock: Number(p.stock) >= 0 ? Number(p.stock) : 25,
      capColor: String(p.capColor || '#0088FF'),
      purity: String(p.purity || '99.5% HPLC'),
      storage: String(p.storage || '2°C a 8°C (Refrigerado)'),
      reconstitution: String(p.reconstitution || 'Reconstituir com água bacteriostática estéril'),
      imageUrl: p.imageUrl || undefined,
      featured: Boolean(p.featured),
      isPromotion: Boolean(p.isPromotion),
      promotionDiscount: p.promotionDiscount ? Number(p.promotionDiscount) : undefined,
    }));

  // Sanitize and filter orders (strictly filtering blacklisted ones)
  const sanitizedOrders: Order[] = extractedOrders
    .filter((o) => o && typeof o === 'object' && (o.id || o.orderNumber) && !isBlacklistedOrder(o))
    .map((o, index) => {
      const isPaid = o.status === 'Pago' || o.status === 'Entregue' || o.status === 'Enviado';
      const total = Number(o.total) || 0;
      const parsedPaid = o.paidAmount !== undefined ? Number(o.paidAmount) : (isPaid ? total : 0);
      const remaining = o.remainingAmount !== undefined ? Number(o.remainingAmount) : Math.max(0, total - parsedPaid);

      return {
        id: String(o.id || `ord-restored-${Date.now()}-${index}`),
        orderNumber: String(o.orderNumber || `#PI-${7000 + index}`).trim(),
        createdAt: String(o.createdAt || new Date().toISOString()),
        customer: {
          name: String(o.customer?.name || 'Cliente Restauração').trim(),
          email: String(o.customer?.email || 'contato@cliente.com').trim(),
          phone: String(o.customer?.phone || '').trim(),
          cpf: o.customer?.cpf ? String(o.customer.cpf).trim() : undefined,
        },
        address: {
          street: String(o.address?.street || 'Balcão / Retirada').trim(),
          number: String(o.address?.number || 'S/N').trim(),
          complement: o.address?.complement ? String(o.address.complement).trim() : undefined,
          neighborhood: String(o.address?.neighborhood || 'Centro').trim(),
          city: String(o.address?.city || 'São Paulo').trim(),
          state: String(o.address?.state || 'SP').trim(),
          zipCode: String(o.address?.zipCode || '01000-000').trim(),
        },
        items: Array.isArray(o.items) && o.items.length > 0 ? o.items : [],
        subtotal: Number(o.subtotal) || total,
        shipping: Number(o.shipping) || 0,
        discount: Number(o.discount) || 0,
        total,
        paidAmount: parsedPaid,
        remainingAmount: remaining,
        dueDate: o.dueDate ? String(o.dueDate) : undefined,
        lastReminderSentAt: o.lastReminderSentAt ? String(o.lastReminderSentAt) : undefined,
        remindersCount: Number(o.remindersCount) || 0,
        status: o.status || 'Pendente',
        paymentMethod: o.paymentMethod || 'PIX',
        trackingCode: o.trackingCode ? String(o.trackingCode) : undefined,
        clearedManuallyAt: o.clearedManuallyAt ? String(o.clearedManuallyAt) : undefined,
        clearedBy: o.clearedBy ? String(o.clearedBy) : undefined,
        notes: o.notes ? String(o.notes) : undefined,
        updatedAt: o.updatedAt ? String(o.updatedAt) : new Date().toISOString(),
      };
    });

  const totalRevenue = sanitizedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const payload: BackupDataPayload = {
    version: parsed.version || '2.0',
    system: parsed.system || 'PEPTIDE IMPORTS FARMA ERP',
    timestamp: parsed.timestamp || new Date().toISOString(),
    dateFormatted: parsed.dateFormatted || new Date().toLocaleString('pt-BR'),
    source: parsed.source || 'RESTORED_BACKUP_FILE',
    stats: {
      totalProducts: sanitizedProducts.length,
      totalOrders: sanitizedOrders.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalPaidRevenue: sanitizedOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0),
      paidOrdersCount: sanitizedOrders.filter((o) => o.status === 'Pago' || o.status === 'Entregue').length,
      pendingOrdersCount: sanitizedOrders.filter((o) => o.status === 'Pendente' || o.status === 'Pago Parcial').length,
    },
    products: sanitizedProducts,
    orders: sanitizedOrders,
    storeSettings: parsed.storeSettings,
    financialTransactions: parsed.financialTransactions,
    metadata: parsed.metadata,
  };

  const productsSample = sanitizedProducts.slice(0, 5).map((p) => `${p.name} (${p.dosage || '10 MG'})`);
  const ordersSample = sanitizedOrders.slice(0, 5).map((o) => `${o.orderNumber} - ${o.customer?.name || 'Cliente'} (R$ ${o.total.toFixed(2)})`);

  return {
    isValid: true,
    payload,
    summary: {
      productsCount: sanitizedProducts.length,
      ordersCount: sanitizedOrders.length,
      totalRevenue,
      timestamp: payload.dateFormatted,
      productsSample,
      ordersSample,
    },
  };
}
