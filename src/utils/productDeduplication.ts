import { Product, CartItem, Order } from '../types';

/**
 * Normalizes text by removing accents, extra whitespace, and converting to uppercase.
 */
export function cleanString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/**
 * Normalizes dosage strings (e.g. "600MG" -> "600 MG", "50  MG" -> "50 MG", "3 mg" -> "3 MG").
 */
export function normalizeDosage(dosage: string): string {
  if (!dosage) return '';
  let d = cleanString(dosage);

  // Insert space between number and unit if stuck together (e.g. "600MG" -> "600 MG")
  d = d.replace(/(\d+)\s*([A-Z]+)/g, '$1 $2');

  // Normalize common units
  d = d.replace(/\bUI\b|\bU\b/g, (match) => match === 'U' ? 'UI' : match); // harmonize U / UI if desirable
  return d.trim();
}

/**
 * Canonical dictionary mapping known typos, transliterations and synonyms to official product names.
 */
const CANONICAL_NAME_ALIASES: Array<{ regex: RegExp; canonical: string }> = [
  // Retratutida / Retatrutide variations
  { regex: /^(RETATRUTIDE|RETRATUTIDE|RETATUTIDA|RETRATUTIDA|RETATRUTIDA|RETRATUTIDE|RETATRUTID|RETRATUTID)$/i, canonical: 'RETRATUTIDA' },

  // Epithalon / Epitalon / Ephitalon variations
  { regex: /^(EPITHALON|EPITALON|EPHITALON|EPHITHALON|EPITHALONE|EPITALONE)$/i, canonical: 'EPITHALON' },

  // MOTS-C / MOST-C variations
  { regex: /^(MOTS-C|MOST-C|MOTSC|MOSTC|MOTS\s*C|MOST\s*C)$/i, canonical: 'MOTS-C' },

  // Tirzepatida / Tirze variations
  { regex: /^(TIRZEPATIDA|TIRZEPATIDE|TIRZE|TIRZEPATID)$/i, canonical: 'TIRZEPATIDA' },

  // Água Acética variations
  { regex: /^(AGUA\s*ACETICA|AGUA\s*ACERTICA|AGUA\s*ACETICA\s*ESTERTIL|AGUA\s*ACERTICA)$/i, canonical: 'ÁGUA ACETICA' },

  // Água Bac / Bacteriostática variations
  { regex: /^(AGUA\s*BAC|AGUA\s*BACTERIOSTATICA|ACIDO\s*BAC|AGUA\s*BAC\s*10|AGUA\s*BAC\s*3)$/i, canonical: 'ÁGUA BAC' },

  // Botox variations (keep generic Botox and Botox Allergan distinct)
  { regex: /^(BOTOX\s*ALLERGAN|BOTOX\s*ALERGAN)$/i, canonical: 'BOTOX ALLERGAN' },
  { regex: /^(BOTOX)$/i, canonical: 'BOTOX' },

  // BPC-157 + TB-500 variations
  { regex: /^(BPC\s*157\s*\+\s*TB\s*500|BPC-157\s*\+\s*TB-500|BPC157\s*\+\s*TB500|BPC\s*\+\s*TB|BPC157\+TB500)$/i, canonical: 'BPC-157 + TB-500' },

  // CJC + Ipamorelin variations
  { regex: /^(CJC\s*\+\s*IPAMORELIN|CJC-1295\s*\+\s*IPAMORELIN|CJC1295\s*\+\s*IPAMORELIN|CJC\s*IPAMORELIN)$/i, canonical: 'CJC + IPAMORELIN' },

  // Cagrilintide variations
  { regex: /^(CAGRILINTIDE|CAGRILINTIDA|CAGRI)$/i, canonical: 'CAGRILINTIDE' },

  // Semaglutida variations
  { regex: /^(SEMAGLUTIDA|SEMAGLUTIDE|SEMA)$/i, canonical: 'SEMAGLUTIDA' },

  // AOD-9604 variations
  { regex: /^(AOD-9604|AOD9604|AOD\s*9604)$/i, canonical: 'AOD-9604' },

  // GHK-Cu variations
  { regex: /^(GHK-CU|GHKCU|GHK\s*CU|GHK\s*COPPER)$/i, canonical: 'GHK-CU' },

  // Tesamorelin variations
  { regex: /^(TESAMORELIN|TESAMORELINA|TESA)$/i, canonical: 'TESAMORELIN' },

  // Semax & Selank
  { regex: /^(SEMAX)$/i, canonical: 'SEMAX' },
  { regex: /^(SELANK)$/i, canonical: 'SELANK' },

  // Glutathione
  { regex: /^(GLUTATHIONE|GLUTATIONA|GLUTATHION)$/i, canonical: 'GLUTATHIONE' },
];

/**
 * Normalizes a product name to its canonical form using the alias dictionary.
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  const cleaned = cleanString(name);

  for (const alias of CANONICAL_NAME_ALIASES) {
    if (alias.regex.test(cleaned)) {
      return alias.canonical;
    }
  }

  return cleaned;
}

/**
 * Computes a standardized deduplication key for any product or cart item.
 * E.g.: "RETRATUTIDA_60_MG", "EPITHALON_10_MG".
 */
export function getProductDeduplicationKey(name: string, dosage?: string): string {
  const normName = normalizeProductName(name);
  const normDosage = normalizeDosage(dosage || '');
  return `${normName}_${normDosage}`.replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
}

/**
 * Finds the canonical product from the active catalog matching an item by ID,
 * or by canonical name + dosage, or by canonical name alone.
 */
export function findCanonicalCatalogProduct(
  item: { id?: string; name?: string; dosage?: string },
  catalogProducts: Product[]
): Product | undefined {
  if (!catalogProducts || catalogProducts.length === 0) return undefined;

  // 1. Direct ID match
  if (item.id) {
    const direct = catalogProducts.find((p) => p.id === item.id);
    if (direct) return direct;
  }

  const normName = normalizeProductName(item.name || '');
  const normDosage = normalizeDosage(item.dosage || '');

  // 2. Exact match on Canonical Name + Canonical Dosage
  if (normName && normDosage) {
    const exact = catalogProducts.find(
      (p) =>
        normalizeProductName(p.name) === normName &&
        normalizeDosage(p.dosage) === normDosage
    );
    if (exact) return exact;
  }

  // 3. Match on Canonical Name alone if dosage is not specified or catalog has unique match
  if (normName) {
    const sameNameMatches = catalogProducts.filter(
      (p) => normalizeProductName(p.name) === normName
    );
    if (sameNameMatches.length === 1) {
      return sameNameMatches[0];
    }
  }

  return undefined;
}

/**
 * Validates a new product against the existing catalog to prevent adding duplicates.
 */
export interface ProductValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  existingProduct?: Product;
  message?: string;
  suggestedName?: string;
  suggestedDosage?: string;
}

export function validateProductForCreation(
  productData: { name: string; dosage?: string; id?: string },
  existingProducts: Product[]
): ProductValidationResult {
  const name = (productData.name || '').trim();
  const dosage = (productData.dosage || '').trim();

  if (!name) {
    return {
      isValid: false,
      isDuplicate: false,
      message: 'O nome do produto é obrigatório.',
    };
  }

  const canonicalName = normalizeProductName(name);
  const canonicalDosage = normalizeDosage(dosage);
  const targetKey = getProductDeduplicationKey(canonicalName, canonicalDosage);

  // Search existing products (excluding the current one being edited if id is provided)
  const duplicate = existingProducts.find((p) => {
    if (productData.id && p.id === productData.id) return false;
    const existingKey = getProductDeduplicationKey(p.name, p.dosage);
    return existingKey === targetKey;
  });

  if (duplicate) {
    return {
      isValid: false,
      isDuplicate: true,
      existingProduct: duplicate,
      suggestedName: duplicate.name,
      suggestedDosage: duplicate.dosage,
      message: `Atenção: Já existe um produto cadastrado com a mesma especificação: "${duplicate.name}" (${duplicate.dosage || 'Sem dosagem'}) [Código: ${duplicate.id}]. Atualize o estoque ou edite o produto existente para evitar duplicidade.`,
    };
  }

  return {
    isValid: true,
    isDuplicate: false,
    suggestedName: canonicalName,
    suggestedDosage: canonicalDosage,
  };
}

/**
 * Sanitizes and deduplicates items inside an order:
 * 1. Binds each item to its canonical catalog product (if found).
 * 2. Unifies and sums quantities of repeated items within the same order.
 * 3. Formats prices and totals cleanly.
 */
export function sanitizeOrderItems(
  items: CartItem[],
  catalogProducts: Product[]
): CartItem[] {
  if (!items || items.length === 0) return [];

  const mergedMap = new Map<string, CartItem>();

  items.forEach((item) => {
    const rawProd = item.product || ({} as Product);
    const prodId = rawProd.id || (item as any).productId;
    const rawName = rawProd.name || (item as any).name || 'Produto';
    const rawDosage = rawProd.dosage || (item as any).dosage || '';

    // Find canonical catalog match
    const canonicalProd = findCanonicalCatalogProduct(
      { id: prodId, name: rawName, dosage: rawDosage },
      catalogProducts
    );

    const finalId = canonicalProd?.id || prodId || `custom-${Date.now()}`;
    const finalName = canonicalProd?.name || normalizeProductName(rawName);
    const finalDosage = canonicalProd?.dosage || normalizeDosage(rawDosage);
    const finalCategory = canonicalProd?.category || rawProd.category || 'Peptídeos';
    const finalPrice = Number(rawProd.price !== undefined ? rawProd.price : canonicalProd?.price || 0);

    // Grouping key: canonical catalog ID if exists, otherwise canonical deduplication key
    const dedupeKey = canonicalProd ? `CAT_${canonicalProd.id}` : getProductDeduplicationKey(finalName, finalDosage);

    const qty = Math.max(1, Number(item.quantity) || 1);

    if (mergedMap.has(dedupeKey)) {
      const existing = mergedMap.get(dedupeKey)!;
      existing.quantity += qty;
      // Preserve custom price if provided or average
    } else {
      const cleanItem: CartItem = {
        product: {
          ...rawProd,
          id: finalId,
          name: finalName,
          dosage: finalDosage,
          category: finalCategory,
          price: finalPrice,
          capColor: canonicalProd?.capColor || rawProd.capColor || '#0088FF',
          stock: canonicalProd?.stock !== undefined ? canonicalProd.stock : rawProd.stock,
        },
        quantity: qty,
      };
      mergedMap.set(dedupeKey, cleanItem);
    }
  });

  return Array.from(mergedMap.values());
}

export interface DeduplicationGroup {
  canonicalKey: string;
  canonicalName: string;
  canonicalDosage: string;
  suggestedName: string;
  suggestedDosage: string;
  primaryProduct: Product;
  duplicateProducts: Product[];
  products: Product[];
}

/**
 * Audits the entire catalog and orders list to identify:
 * - Duplicate or near-duplicate catalog products.
 * - Orders with divergent product references or internal duplicate items.
 */
export interface DeduplicationAuditReport {
  duplicateGroups: DeduplicationGroup[];
  duplicateCatalogGroups: DeduplicationGroup[];
  ordersWithDuplicateItems: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    duplicateCount: number;
  }>;
  totalCatalogDuplicates: number;
  totalOrderIssues: number;
  isClean: boolean;
}

export function auditDatabaseDeduplication(
  catalogProducts: Product[],
  orders: Order[]
): DeduplicationAuditReport {
  // 1. Group catalog products by canonical deduplication key
  const catalogKeyMap = new Map<string, Product[]>();

  (catalogProducts || []).forEach((p) => {
    if (!p) return;
    const key = getProductDeduplicationKey(p.name || '', p.dosage || '');
    if (!catalogKeyMap.has(key)) {
      catalogKeyMap.set(key, []);
    }
    catalogKeyMap.get(key)!.push(p);
  });

  const duplicateGroups: DeduplicationGroup[] = [];
  catalogKeyMap.forEach((prods, key) => {
    if (prods.length > 1) {
      // Pick best primary product (prefer official IDs or highest stock or lowest index)
      const primary = prods.find((p) => p.id?.startsWith('prod-official')) || prods[0];
      const duplicates = prods.filter((p) => p.id !== primary.id);
      const canonicalName = normalizeProductName(primary.name);
      const canonicalDosage = normalizeDosage(primary.dosage || '');

      duplicateGroups.push({
        canonicalKey: key,
        canonicalName,
        canonicalDosage,
        suggestedName: canonicalName,
        suggestedDosage: canonicalDosage,
        primaryProduct: primary,
        duplicateProducts: duplicates,
        products: prods,
      });
    }
  });

  // 2. Audit orders for duplicated items within the same order
  const ordersWithDuplicateItems: DeduplicationAuditReport['ordersWithDuplicateItems'] = [];

  (orders || []).forEach((ord) => {
    if (!ord) return;
    const items = ord.items || [];
    const seenKeys = new Set<string>();
    let duplicatesInOrder = 0;

    items.forEach((it) => {
      if (!it) return;
      const p = (it.product || {}) as Partial<Product>;
      const key = getProductDeduplicationKey(p.name || (it as any).name || '', p.dosage || (it as any).dosage || '');
      if (seenKeys.has(key)) {
        duplicatesInOrder++;
      } else {
        seenKeys.add(key);
      }
    });

    if (duplicatesInOrder > 0) {
      ordersWithDuplicateItems.push({
        orderId: ord.id || '',
        orderNumber: ord.orderNumber || '',
        customerName: ord.customer?.name || 'Cliente',
        duplicateCount: duplicatesInOrder,
      });
    }
  });

  const totalCatalogDuplicates = duplicateGroups.reduce((acc, g) => acc + (g.duplicateProducts.length), 0);
  const totalOrderIssues = ordersWithDuplicateItems.length;

  return {
    duplicateGroups,
    duplicateCatalogGroups: duplicateGroups,
    ordersWithDuplicateItems,
    totalCatalogDuplicates,
    totalOrderIssues,
    isClean: totalCatalogDuplicates === 0 && totalOrderIssues === 0,
  };
}

/**
 * Merges a group of duplicate products into a single authoritative canonical product.
 * Returns:
 * - updatedProducts: the cleaned catalog with duplicates merged and secondary items removed
 * - updatedOrders: orders whose items have been updated to point to the canonical product
 * - deletedProductIds: IDs of products that should be removed from database
 */
export function mergeDuplicateProductGroup(
  primaryProduct: Product,
  duplicateProductIds: string[],
  allProducts: Product[],
  allOrders: Order[]
): {
  updatedProducts: Product[];
  updatedOrders: Order[];
  deletedProductIds: string[];
} {
  const secondaryIdSet = new Set(duplicateProductIds.filter((id) => id !== primaryProduct.id));

  // Find all secondary products to sum stock
  let combinedStock = primaryProduct.stock || 0;
  allProducts.forEach((p) => {
    if (secondaryIdSet.has(p.id)) {
      if ((p.stock || 0) > 0) {
        combinedStock += p.stock;
      }
    }
  });

  const canonicalName = normalizeProductName(primaryProduct.name);
  const canonicalDosage = normalizeDosage(primaryProduct.dosage || '');

  const finalizedPrimary: Product = {
    ...primaryProduct,
    name: canonicalName,
    dosage: canonicalDosage,
    stock: combinedStock,
  };

  // Filter out secondary products and update primary
  const updatedProducts = allProducts
    .filter((p) => !secondaryIdSet.has(p.id))
    .map((p) => (p.id === primaryProduct.id ? finalizedPrimary : p));

  // Update orders: rebind any item with a secondary ID or divergent name to finalizedPrimary
  const updatedOrders = allOrders.map((ord) => {
    let hasChanges = false;
    const rawItems = ord.items || [];
    const cleanItems: CartItem[] = rawItems.map((it) => {
      const p = (it.product || {}) as Partial<Product>;
      const prodId = p.id || (it as any).productId;

      if (secondaryIdSet.has(prodId) || (prodId === primaryProduct.id && (p.name !== canonicalName || p.dosage !== canonicalDosage))) {
        hasChanges = true;
        return {
          ...it,
          product: {
            ...finalizedPrimary,
            ...(p as Record<string, any>),
            id: finalizedPrimary.id,
            name: finalizedPrimary.name,
            dosage: finalizedPrimary.dosage,
            category: finalizedPrimary.category,
          } as Product,
        };
      }
      return it;
    });

    if (hasChanges) {
      // Re-sanitize to combine any duplicate lines inside the same order
      return {
        ...ord,
        items: sanitizeOrderItems(cleanItems, updatedProducts),
      };
    }
    return ord;
  });

  return {
    updatedProducts,
    updatedOrders,
    deletedProductIds: Array.from(secondaryIdSet),
  };
}

