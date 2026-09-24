import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem, Order, FinancialTransaction, User, ProductCategory, OrderStatus, Address, Employee, StoreSettings, Coupon, ProductRequest } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_TRANSACTIONS, CURRENT_CLIENT_USER, ADMIN_USER, INITIAL_EMPLOYEES, INITIAL_SETTINGS, INITIAL_COUPONS } from '../data/mockData';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  mapProductToDB,
  mapDBToProduct,
  mapOrderToDB,
  mapDBToOrder,
  mapCouponToDB,
  mapDBToCoupon,
  mapEmployeeToDB,
  mapDBToEmployee,
  mapFinToDB,
  mapDBToFin,
  mapSettingsToDB,
  mapDBToSettings,
} from '../lib/supabase';
import {
  db,
  auth,
  googleProvider,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  signInWithPopup,
  signOut,
} from '../lib/firebase';
import {
  validateProductForCreation,
  sanitizeOrderItems,
  normalizeProductName,
  normalizeDosage,
  mergeDuplicateProductGroup,
  auditDatabaseDeduplication,
  DeduplicationAuditReport,
} from '../utils/productDeduplication';

/**
 * Recursively cleans an object to remove any keys with 'undefined' values,
 * which Firestore rejects when calling setDoc or updateDoc.
 */
function cleanUndefinedForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanUndefinedForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

interface AppContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductPromotion: (id: string, isPromotion?: boolean, discount?: number) => void;
  toggleProductFeatured: (id: string) => void;
  syncOfficialCatalog: () => Promise<void>;
  executeCatalogDeduplication: (
    primaryProductId: string,
    duplicateProductIds: string[]
  ) => Promise<{ success: boolean; message: string }>;
  auditDeduplication: () => DeduplicationAuditReport;

  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  currentUser: User | null;
  loginUser: (email: string, role?: 'CLIENTE' | 'ADMIN') => boolean;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  loginStaffOrAdmin: (email: string, password: string) => { success: boolean; message: string; role?: 'ADMIN' | 'CLIENTE'; employee?: Employee };
  logoutUser: () => void;
  switchUserRole: (role: 'CLIENTE' | 'ADMIN') => void;
  updateUserProfile: (data: Partial<User>) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;

  orders: Order[];
  createOrder: (orderData: {
    customer: { name: string; email: string; phone: string; cpf?: string };
    address: Address;
    paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar';
    discount?: number;
    shipping?: number;
    notes?: string;
    couponCode?: string;
  }) => Order;
  createManualOrder: (orderData: {
    customer: { name: string; email?: string; phone: string; cpf?: string };
    address?: Partial<Address>;
    items: CartItem[];
    subtotal?: number;
    shipping?: number;
    discount?: number;
    paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar';
    status?: OrderStatus;
    notes?: string;
    clearedBy?: string;
  }) => Promise<Order>;
  updateOrder: (orderId: string, updatedData: Partial<Order>) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingCode?: string) => void;
  clearOrderManually: (orderId: string, status: OrderStatus, clearedBy: string, notes?: string, paidAmount?: number, remainingAmount?: number) => void;
  deleteOrder: (orderId: string) => Promise<boolean>;
  clearAllOrders: () => Promise<void>;
  clearAllFinances: () => Promise<void>;
  refreshSalesData: (silent?: boolean) => Promise<{ success: boolean; count: number }>;

  financialTransactions: FinancialTransaction[];
  addFinancialTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
  deleteFinancialTransaction: (id: string) => Promise<void>;

  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  clearAllEmployees: () => Promise<void>;

  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponStatus: (id: string) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  applyCouponCode: (code: string, currentSubtotal?: number) => { success: boolean; message: string; discount: number; coupon?: Coupon };
  removeCoupon: () => void;
  couponDiscount: number;

  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  toggleStorePurchasesSuspension: (targetSuspended?: boolean, customMessage?: string, customTitle?: string) => Promise<boolean>;
  deliveryFee: number;

  // Supabase & Database State
  isSupabaseActive: boolean;
  supabaseConfigured: boolean;

  // Real-time Cloud Save & Publish Methods for all tabs
  saveAllProductsToCloud: () => Promise<boolean>;
  saveAllOrdersToCloud: () => Promise<boolean>;
  saveAllFinancesToCloud: () => Promise<boolean>;
  saveAllEmployeesToCloud: () => Promise<boolean>;
  saveAllCouponsToCloud: () => Promise<boolean>;
  saveAllSettingsToCloud: (customSettings?: Partial<StoreSettings>) => Promise<boolean>;
  saveEverythingToCloud: () => Promise<boolean>;

  selectedCategory: ProductCategory;
  setSelectedCategory: (cat: ProductCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  selectedProductDetail: Product | null;
  setSelectedProductDetail: (product: Product | null) => void;

  // Product Requests (Pedidos de cadastro pelo dono)
  productRequests: ProductRequest[];
  addProductRequest: (request: Omit<ProductRequest, 'id' | 'createdAt' | 'status'> & { status?: 'Pendente' | 'Aprovado' }) => Promise<ProductRequest>;
  approveProductRequest: (requestId: string) => Promise<Product | null>;
  deleteProductRequest: (requestId: string) => Promise<boolean>;
  getProductRequestShareUrl: () => string;

  currentView: 'store' | 'admin' | 'my-account' | 'checkout' | 'guide' | 'product-request';
  setCurrentView: (view: 'store' | 'admin' | 'my-account' | 'checkout' | 'guide' | 'product-request') => void;

  activeNav: string;
  setActiveNav: (nav: string) => void;

  infoModal: 'about' | 'security' | 'contact' | null;
  setInfoModal: (modal: 'about' | 'security' | 'contact' | null) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Products State ---
  const [products, setProducts] = useState<Product[]>(() => {
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('peptide_products', JSON.stringify(products));
  }, [products]);

  // --- Cart State ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('peptide_cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) => item && item.product && typeof item.product.price === 'number'
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('peptide_cart', JSON.stringify(cart));
  }, [cart]);

  // --- User & Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('peptide_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email?.toLowerCase() === 'khevineoliveira@gmail.com' && parsed?.role === 'ADMIN') {
          return { ...parsed, isMaster: true };
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Security: Brute-force prevention and login rate-limiting refs
  const failedAttemptsRef = useRef<number>(0);
  const lockoutUntilRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('peptide_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('peptide_user');
    }
  }, [currentUser]);

  // --- Supabase & Database Config State ---
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(() => isSupabaseConfigured());
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(() => isSupabaseConfigured());

  // --- Real-time Sync (Supabase PostgreSQL + Firestore Fallback) ---
  useEffect(() => {
    let supabaseChannel: any = null;
    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured()) {
      setIsSupabaseActive(true);
      setSupabaseConfigured(true);

      // 1. Initial Fetch from Supabase
      const fetchSupabaseData = async () => {
        try {
          // Fetch Products
          const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
          if (!prodErr && prodData) {
            if (prodData.length === 0) {
              // Auto-seed initial products to Supabase
              const dbProds = INITIAL_PRODUCTS.map(mapProductToDB);
              await supabase.from('products').insert(dbProds);
            } else {
              const mapped = prodData.map(mapDBToProduct);
              setProducts(mapped);
              localStorage.setItem('peptide_products', JSON.stringify(mapped));
            }
          }

          // Fetch Employees
          const { data: empData, error: empErr } = await supabase.from('employees').select('*');
          if (!empErr && empData) {
            if (empData.length === 0) {
              const dbEmps = INITIAL_EMPLOYEES.map(mapEmployeeToDB);
              await supabase.from('employees').insert(dbEmps);
            } else {
              const mapped = empData.map(mapDBToEmployee);
              setEmployees(mapped);
              localStorage.setItem('peptide_employees', JSON.stringify(mapped));
            }
          }

          // Fetch Coupons
          const { data: coupData, error: coupErr } = await supabase.from('coupons').select('*');
          if (!coupErr && coupData) {
            if (coupData.length === 0) {
              const dbCoups = INITIAL_COUPONS.map(mapCouponToDB);
              await supabase.from('coupons').insert(dbCoups);
            } else {
              const mapped = coupData.map(mapDBToCoupon);
              setCoupons(mapped);
              localStorage.setItem('peptide_coupons', JSON.stringify(mapped));
            }
          }

          // Fetch Store Settings
          const { data: settData, error: settErr } = await supabase.from('store_settings').select('*').eq('id', 'config').maybeSingle();
          if (!settErr && settData) {
            const mapped = mapDBToSettings(settData);
            setStoreSettings((prev) => ({
              ...INITIAL_SETTINGS,
              ...prev,
              ...mapped,
              purchasesSuspended: settData.purchases_suspended !== undefined && settData.purchases_suspended !== null
                ? Boolean(settData.purchases_suspended)
                : Boolean(prev.purchasesSuspended),
            }));
          } else if (!settData) {
            await supabase.from('store_settings').upsert(mapSettingsToDB(INITIAL_SETTINGS));
          }

          // Fetch Orders (Always merge with Firestore/Local to prevent losing orders)
          const { data: ordData, error: ordErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (!ordErr && ordData) {
            const mapped = ordData.map(mapDBToOrder);
            setOrders((prev) => {
              const orderMap = new Map<string, Order>();
              // 1. Keep all current orders (e.g. 53 from Firestore or localStorage)
              prev.forEach((o) => {
                const k = o.id || o.orderNumber;
                if (k) orderMap.set(k, o);
              });
              // 2. Merge with Supabase orders
              mapped.forEach((o) => {
                const k = o.id || o.orderNumber;
                if (k) {
                  const existing = orderMap.get(k);
                  orderMap.set(k, { ...existing, ...o });
                }
              });
              const merged = Array.from(orderMap.values());
              merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              localStorage.setItem('peptide_orders', JSON.stringify(merged));

              // 3. Auto-sync: if Firestore has more orders than Supabase, immediately upload missing orders to Supabase
              if (merged.length > mapped.length) {
                const missingForSupabase = merged
                  .filter((o) => !mapped.some((so) => (so.id && so.id === o.id) || (so.orderNumber && so.orderNumber === o.orderNumber)))
                  .map(mapOrderToDB);
                if (missingForSupabase.length > 0) {
                  supabase.from('orders').upsert(missingForSupabase).then(({ error: upErr }) => {
                    if (upErr) console.warn('Supabase missing orders replication note:', upErr.message);
                    else console.log(`Auto-replicated ${missingForSupabase.length} missing orders to Supabase!`);
                  });
                }
              }

              return merged;
            });
          }

          // Fetch Financial Transactions (Always merge to prevent truncating history)
          const { data: finData, error: finErr } = await supabase.from('financial_transactions').select('*').order('date', { ascending: false });
          if (!finErr && finData) {
            const mapped = finData.map(mapDBToFin);
            setFinancialTransactions((prev) => {
              const finMap = new Map<string, FinancialTransaction>();
              prev.forEach((t) => finMap.set(t.id, t));
              mapped.forEach((t) => {
                const existing = finMap.get(t.id);
                finMap.set(t.id, { ...existing, ...t });
              });
              const merged = Array.from(finMap.values());
              merged.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
              localStorage.setItem('peptide_finances', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (e) {
          console.log('Error initializing Supabase sync:', e);
        }
      };

      fetchSupabaseData();

      // 2. Real-time Subscriptions with Supabase Channels
      try {
        supabaseChannel = supabase
          .channel('peptide_realtime_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
            const { data } = await supabase.from('products').select('*');
            if (data && data.length > 0) {
              const mapped = data.map(mapDBToProduct);
              setProducts(mapped);
              localStorage.setItem('peptide_products', JSON.stringify(mapped));
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
            const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (data) {
              const mapped = data.map(mapDBToOrder);
              setOrders((prev) => {
                const orderMap = new Map<string, Order>();
                prev.forEach((o) => {
                  const k = o.id || o.orderNumber;
                  if (k) orderMap.set(k, o);
                });
                mapped.forEach((o) => {
                  const k = o.id || o.orderNumber;
                  if (k) {
                    const existing = orderMap.get(k);
                    orderMap.set(k, { ...existing, ...o });
                  }
                });
                const merged = Array.from(orderMap.values());
                merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                localStorage.setItem('peptide_orders', JSON.stringify(merged));
                return merged;
              });
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, async () => {
            const { data } = await supabase.from('coupons').select('*');
            if (data) {
              const mapped = data.map(mapDBToCoupon);
              setCoupons(mapped);
              localStorage.setItem('peptide_coupons', JSON.stringify(mapped));
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, async () => {
            const { data } = await supabase.from('employees').select('*');
            if (data) {
              const mapped = data.map(mapDBToEmployee);
              setEmployees(mapped);
              localStorage.setItem('peptide_employees', JSON.stringify(mapped));
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, async () => {
            const { data } = await supabase.from('financial_transactions').select('*').order('date', { ascending: false });
            if (data) {
              const mapped = data.map(mapDBToFin);
              setFinancialTransactions(mapped);
              localStorage.setItem('peptide_finances', JSON.stringify(mapped));
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, async () => {
            const { data } = await supabase.from('store_settings').select('*').eq('id', 'config').maybeSingle();
            if (data) {
              const mapped = mapDBToSettings(data);
              setStoreSettings((prev) => ({ ...prev, ...mapped }));
            }
          })
          .subscribe();
      } catch (err) {
        console.log('Supabase realtime error:', err);
      }
    }

    // 3. Firestore fallback sync (keeping backup active)
    let unsubProducts: any;
    let unsubEmployees: any;
    let unsubCoupons: any;
    let unsubSettings: any;
    let unsubOrders: any;
    let unsubFinances: any;
    let unsubProductRequests: any;

    try {
      unsubProductRequests = onSnapshot(collection(db, 'productRequests'), (snapshot) => {
        if (!snapshot.empty) {
          const list: ProductRequest[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as ProductRequest), id: d.id }));
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setProductRequests(list);
          localStorage.setItem('peptide_product_requests', JSON.stringify(list));
        }
      }, () => {});
      unsubProducts = onSnapshot(collection(db, 'products'), async (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Product), id: d.id }));
          setProducts((prev) => (isSupabaseConfigured() && prev.length > 0 ? prev : list));
          localStorage.setItem('peptide_products', JSON.stringify(list));
        }
      }, () => {});

      unsubEmployees = onSnapshot(collection(db, 'employees'), async (snapshot) => {
        if (!snapshot.empty) {
          const list: Employee[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Employee), id: d.id }));
          setEmployees((prev) => (isSupabaseConfigured() && prev.length > 0 ? prev : list));
          localStorage.setItem('peptide_employees', JSON.stringify(list));
        }
      }, () => {});

      unsubCoupons = onSnapshot(collection(db, 'coupons'), async (snapshot) => {
        if (!snapshot.empty) {
          const list: Coupon[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Coupon), id: d.id }));
          setCoupons((prev) => (isSupabaseConfigured() && prev.length > 0 ? prev : list));
          localStorage.setItem('peptide_coupons', JSON.stringify(list));
        }
      }, () => {});

      // Direct initial hydration of settings from Firebase Firestore
      getDoc(doc(db, 'settings', 'config'))
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as StoreSettings;
            setStoreSettings((prev) => {
              const merged: StoreSettings = {
                ...INITIAL_SETTINGS,
                ...prev,
                ...data,
                purchasesSuspended: data.purchasesSuspended !== undefined ? Boolean(data.purchasesSuspended) : Boolean(prev.purchasesSuspended),
                suspensionTitle: data.suspensionTitle || prev.suspensionTitle || INITIAL_SETTINGS.suspensionTitle,
                suspensionMessage: data.suspensionMessage || prev.suspensionMessage || INITIAL_SETTINGS.suspensionMessage,
                suspensionEstimatedReturn: data.suspensionEstimatedReturn || prev.suspensionEstimatedReturn || INITIAL_SETTINGS.suspensionEstimatedReturn,
                deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : prev.deliveryFee,
              };
              localStorage.setItem('peptide_settings', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => {});

      unsubSettings = onSnapshot(doc(db, 'settings', 'config'), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StoreSettings;
          setStoreSettings((prev) => {
            const merged: StoreSettings = {
              ...INITIAL_SETTINGS,
              ...prev,
              ...data,
              purchasesSuspended: data.purchasesSuspended !== undefined ? Boolean(data.purchasesSuspended) : Boolean(prev.purchasesSuspended),
              suspensionTitle: data.suspensionTitle || prev.suspensionTitle || INITIAL_SETTINGS.suspensionTitle,
              suspensionMessage: data.suspensionMessage || prev.suspensionMessage || INITIAL_SETTINGS.suspensionMessage,
              suspensionEstimatedReturn: data.suspensionEstimatedReturn || prev.suspensionEstimatedReturn || INITIAL_SETTINGS.suspensionEstimatedReturn,
              deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : prev.deliveryFee,
            };
            localStorage.setItem('peptide_settings', JSON.stringify(merged));
            return merged;
          });
        } else {
          try {
            const current = localStorage.getItem('peptide_settings');
            const toSave = current ? JSON.parse(current) : INITIAL_SETTINGS;
            await setDoc(doc(db, 'settings', 'config'), cleanUndefinedForFirestore(toSave), { merge: true });
          } catch (e) {
            console.log('Error initializing settings in Firestore:', e);
          }
        }
      }, () => {});

      unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Order[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Order), id: d.id }));
          
          setOrders((prev) => {
            const orderMap = new Map<string, Order>();
            // Keep all current orders
            prev.forEach((o) => {
              const k = o.id || o.orderNumber;
              if (k) orderMap.set(k, o);
            });
            // Merge with Firestore orders
            list.forEach((o) => {
              const k = o.id || o.orderNumber;
              if (k) {
                const existing = orderMap.get(k);
                orderMap.set(k, { ...existing, ...o });
              }
            });
            const merged = Array.from(orderMap.values());
            merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            localStorage.setItem('peptide_orders', JSON.stringify(merged));

            // If Supabase is active, ensure any missing orders from Firestore are synced into Supabase
            const supabaseClient = getSupabaseClient();
            if (supabaseClient && isSupabaseConfigured() && merged.length > 0) {
              const dbOrders = merged.map(mapOrderToDB);
              supabaseClient.from('orders').upsert(dbOrders).then(({ error: upErr }) => {
                if (upErr) console.warn('Supabase auto-replicate note:', upErr.message);
              });
            }

            return merged;
          });
        }
      }, (error) => {
        console.warn('Firestore orders sync note:', error);
      });

      unsubFinances = onSnapshot(collection(db, 'financialTransactions'), (snapshot) => {
        if (!snapshot.empty) {
          const list: FinancialTransaction[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as FinancialTransaction), id: d.id }));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setFinancialTransactions((prev) => (isSupabaseConfigured() && prev.length > 0 ? prev : list));
          localStorage.setItem('peptide_finances', JSON.stringify(list));
        }
      }, () => {});
    } catch (err) {
      console.log('Firestore realtime listeners fallback mode:', err);
    }

    return () => {
      if (supabaseChannel) {
        supabase?.removeChannel(supabaseChannel);
      }
      unsubProducts?.();
      unsubEmployees?.();
      unsubCoupons?.();
      unsubSettings?.();
      unsubOrders?.();
      unsubFinances?.();
      unsubProductRequests?.();
    };
  }, [currentUser?.role]);

  // --- Orders State (Real Data connected to Firestore, starting from zero) ---
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('peptide_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('peptide_orders', JSON.stringify(orders));
  }, [orders]);

  // --- Financial State (Real Data connected to Firestore, starting from zero) ---
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('peptide_finances');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('peptide_finances', JSON.stringify(financialTransactions));
  }, [financialTransactions]);


  // --- Employees / Staff State ---
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('peptide_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove old mock/demo employees
          const cleaned = parsed.filter(
            (e: Employee) => {
              if (!e) return false;
              const empId = e.id || '';
              const empEmail = (e.email || '').toLowerCase();
              return (
                !['emp-1', 'emp-2', 'emp-3'].includes(empId) &&
                !['juliana@peptideimports.com.br', 'rafael.estoque@peptideimports.com.br', 'beatriz.vendas@peptideimports.com.br'].includes(empEmail)
              );
            }
          );
          return cleaned;
        }
      } catch {
        return [];
      }
    }
    return INITIAL_EMPLOYEES;
  });

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      localStorage.setItem('peptide_employees', JSON.stringify(employees));
    }
  }, [employees, currentUser?.role]);

  // --- Store Settings State ---
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('peptide_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          deliveryFee: typeof parsed.deliveryFee === 'number' ? parsed.deliveryFee : INITIAL_SETTINGS.deliveryFee,
        };
      } catch {
        return INITIAL_SETTINGS;
      }
    }
    return INITIAL_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('peptide_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // --- Coupons State ---
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('peptide_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    localStorage.setItem('peptide_coupons', JSON.stringify(coupons));
  }, [coupons]);

  // --- Product Requests State (Solicitações de Cadastro de Produtos pelo Dono) ---
  const [productRequests, setProductRequests] = useState<ProductRequest[]>(() => {
    const saved = localStorage.getItem('peptide_product_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('peptide_product_requests', JSON.stringify(productRequests));
  }, [productRequests]);

  // --- Navigation & UI State ---
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'my-account' | 'checkout' | 'guide' | 'product-request'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = (params.get('page') || params.get('view') || params.get('p') || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      if (
        page === 'solicitar-produto' ||
        page === 'cadastro-produto' ||
        page === 'pedido-cadastro' ||
        page === 'cadastrar-produto' ||
        hash.includes('solicitar-produto') ||
        hash.includes('cadastro-produto')
      ) {
        return 'product-request';
      }
    }
    return 'store';
  });

  // URL query parameters and hash routing listener
  useEffect(() => {
    const handleUrlRouting = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const page = (params.get('page') || params.get('view') || params.get('p') || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();

      if (
        page === 'solicitar-produto' ||
        page === 'cadastro-produto' ||
        page === 'pedido-cadastro' ||
        page === 'cadastrar-produto' ||
        hash.includes('solicitar-produto') ||
        hash.includes('cadastro-produto')
      ) {
        setCurrentView('product-request');
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
    };
  }, []);

  const getProductRequestShareUrl = (): string => {
    if (typeof window === 'undefined') return '?page=cadastro-produto';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?page=cadastro-produto`;
  };

  const [activeNav, setActiveNav] = useState('Início');
  const [infoModal, setInfoModal] = useState<'about' | 'security' | 'contact' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // --- Store Settings Update ---
  const updateStoreSettings = async (newSettings: Partial<StoreSettings>) => {
    let updated: StoreSettings = INITIAL_SETTINGS;
    setStoreSettings((prev) => {
      updated = {
        ...prev,
        ...newSettings,
        deliveryFee: typeof newSettings.deliveryFee === 'number' ? newSettings.deliveryFee : prev.deliveryFee,
      };
      localStorage.setItem('peptide_settings', JSON.stringify(updated));
      return updated;
    });
    showToast('Configurações da loja atualizadas com sucesso!');

    try {
      await setDoc(doc(db, 'settings', 'config'), cleanUndefinedForFirestore(updated), { merge: true });
    } catch (e) {
      console.log('Error saving settings to Firestore:', e);
    }
  };

  // --- Employee Management ---
  const addEmployee = async (empData: Omit<Employee, 'id' | 'createdAt'>) => {
    const empId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...empData,
      id: empId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) => {
      const updated = [newEmp, ...prev];
      localStorage.setItem('peptide_employees', JSON.stringify(updated));
      return updated;
    });
    showToast(`Funcionário(a) "${newEmp.name}" cadastrado(a) com sucesso!`);
    
    // Save to Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('employees').upsert(mapEmployeeToDB(newEmp));
      }
    } catch (e) {
      console.log('Error saving employee to Supabase:', e);
    }

    // Save to Firestore fallback
    try {
      await setDoc(doc(db, 'employees', empId), cleanUndefinedForFirestore(newEmp));
    } catch (e) {
      console.log('Error saving employee to Firestore:', e);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    let updatedEmployee: Employee | undefined;
    setEmployees((prev) => {
      const updated = prev.map((emp) => {
        if (emp.id === id) {
          updatedEmployee = { ...emp, ...updates };
          return updatedEmployee;
        }
        return emp;
      });
      localStorage.setItem('peptide_employees', JSON.stringify(updated));
      return updated;
    });

    // If currently logged in user is this employee, update their state in real-time
    if (
      currentUser &&
      (currentUser.id === id ||
        (currentUser.email &&
          updates.email &&
          currentUser.email.toLowerCase().trim() === updates.email.toLowerCase().trim()))
    ) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: updates.name ?? prev.name,
          phone: updates.phone ?? prev.phone,
          staffRole: updates.role ?? prev.staffRole,
          permissions: updates.permissions ?? prev.permissions,
        };
      });
    }

    showToast('Dados do funcionário atualizados!');

    // Update in Supabase
    if (updatedEmployee) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('employees').upsert(mapEmployeeToDB(updatedEmployee));
        }
      } catch (e) {
        console.log('Error updating employee in Supabase:', e);
      }
    }

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'employees', id), cleanUndefinedForFirestore(updates));
    } catch (e) {
      console.log('Error updating employee in Firestore:', e);
    }
  };

  const deleteEmployee = async (id: string) => {
    setEmployees((prev) => {
      const updated = prev.filter((emp) => emp.id !== id);
      localStorage.setItem('peptide_employees', JSON.stringify(updated));
      return updated;
    });
    showToast('Funcionário removido com sucesso.');

    // Remove from Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('employees').delete().eq('id', id);
      }
    } catch (e) {
      console.log('Error deleting employee from Supabase:', e);
    }

    // Remove from Firestore
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (e) {
      console.log('Error deleting employee from Firestore:', e);
    }
  };

  const clearAllEmployees = async () => {
    const toDeleteIds = employees.map((e) => e.id);
    setEmployees([]);
    localStorage.removeItem('peptide_employees');
    showToast('Todos os usuários de equipe foram removidos com sucesso.');

    // Clear from Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('employees').delete().neq('id', '');
      }
    } catch (e) {
      console.log('Error clearing employees from Supabase:', e);
    }

    for (const empId of toDeleteIds) {
      try {
        await deleteDoc(doc(db, 'employees', empId));
      } catch (e) {
        console.log('Error clearing employee from Firestore:', e);
      }
    }
  };

  // --- Coupon Management & Validation ---
  const addCoupon = async (couponData: Omit<Coupon, 'id' | 'usageCount'>) => {
    const newId = `coup-${Date.now()}`;
    const newCoupon: Coupon = {
      ...couponData,
      id: newId,
      usageCount: 0,
      code: couponData.code.trim().toUpperCase(),
    };
    setCoupons((prev) => {
      const updated = [newCoupon, ...prev];
      localStorage.setItem('peptide_coupons', JSON.stringify(updated));
      return updated;
    });
    showToast(`Cupom "${newCoupon.code}" criado com sucesso!`);

    // Save to Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('coupons').upsert(mapCouponToDB(newCoupon));
      }
    } catch (e) {
      console.log('Error adding coupon to Supabase:', e);
    }

    try {
      await setDoc(doc(db, 'coupons', newId), cleanUndefinedForFirestore(newCoupon));
    } catch (e) {
      console.log('Error adding coupon to Firestore:', e);
    }
  };

  const updateCoupon = async (id: string, updates: Partial<Coupon>) => {
    let updatedList: Coupon[] = [];
    setCoupons((prev) => {
      updatedList = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              code: updates.code ? updates.code.trim().toUpperCase() : c.code,
            }
          : c
      );
      localStorage.setItem('peptide_coupons', JSON.stringify(updatedList));
      return updatedList;
    });
    showToast('Cupom atualizado com sucesso!');

    const target = updatedList.find((c) => c.id === id);
    if (target) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('coupons').upsert(mapCouponToDB(target));
        }
      } catch (e) {
        console.log('Error updating coupon in Supabase:', e);
      }

      try {
        await setDoc(doc(db, 'coupons', id), target, { merge: true });
      } catch (e) {
        console.log('Error updating coupon in Firestore:', e);
      }
    }
  };

  const deleteCoupon = async (id: string) => {
    setCoupons((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem('peptide_coupons', JSON.stringify(updated));
      return updated;
    });
    if (appliedCoupon?.id === id) {
      setAppliedCoupon(null);
    }
    showToast('Cupom removido do sistema.');

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('coupons').delete().eq('id', id);
      }
    } catch (e) {
      console.log('Error deleting coupon from Supabase:', e);
    }

    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (e) {
      console.log('Error deleting coupon from Firestore:', e);
    }
  };

  const toggleCouponStatus = async (id: string) => {
    let target: Coupon | undefined;
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'Ativo' ? 'Inativo' : 'Ativo';
          target = { ...c, status: nextStatus };
          return target;
        }
        return c;
      })
    );
    showToast('Status do cupom alterado!');

    if (target) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('coupons').upsert(mapCouponToDB(target));
        }
      } catch (e) {
        console.log('Error toggling coupon in Supabase:', e);
      }

      try {
        await setDoc(doc(db, 'coupons', id), cleanUndefinedForFirestore(target), { merge: true });
      } catch (e) {
        console.log('Error toggling coupon status in Firestore:', e);
      }
    }
  };

  const applyCouponCode = (
    code: string,
    currentSubtotal?: number
  ): { success: boolean; message: string; discount: number; coupon?: Coupon } => {
    const cleanCode = code.trim().toUpperCase();
    const subtotal = currentSubtotal !== undefined ? currentSubtotal : cartTotal;

    const found = coupons.find((c) => c.code === cleanCode);
    if (!found) {
      return { success: false, message: 'Cupom não encontrado ou inválido.', discount: 0 };
    }

    if (found.status !== 'Ativo') {
      return { success: false, message: 'Este cupom está desativado no momento.', discount: 0 };
    }

    if (found.maxUsage && found.usageCount >= found.maxUsage) {
      return { success: false, message: 'Este cupom já atingiu o limite máximo de utilizações.', discount: 0 };
    }

    if (found.expiresAt) {
      const expiry = new Date(found.expiresAt);
      if (new Date() > expiry) {
        return { success: false, message: 'Este cupom já expirou.', discount: 0 };
      }
    }

    if (found.minOrderAmount && subtotal < found.minOrderAmount) {
      return {
        success: false,
        message: `Valor mínimo para este cupom é de R$ ${(found.minOrderAmount || 0).toFixed(2).replace('.', ',')}.`,
        discount: 0,
      };
    }

    let calculatedDiscount = 0;
    if (found.type === 'PERCENTAGE') {
      calculatedDiscount = (subtotal * (found.value || 0)) / 100;
    } else {
      calculatedDiscount = Math.min(subtotal, found.value || 0);
    }

    setAppliedCoupon(found);
    showToast(`Cupom "${found.code}" aplicado com sucesso!`);
    return {
      success: true,
      message: `Cupom ${found.code} aplicado (-${found.type === 'PERCENTAGE' ? `${found.value}%` : `R$ ${(found.value || 0).toFixed(2).replace('.', ',')}`})!`,
      discount: calculatedDiscount,
      coupon: found,
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupom removido.');
  };

  // --- Product CRUD & Promotion Toggles ---
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    // Proactive anti-duplication validation
    const validation = validateProductForCreation(productData, products);
    if (!validation.isValid && validation.isDuplicate) {
      const msg = validation.message || 'Produto com mesma especificação já cadastrado no catálogo!';
      showToast(msg);
      return;
    }

    const canonicalName = validation.suggestedName || normalizeProductName(productData.name);
    const canonicalDosage = validation.suggestedDosage || normalizeDosage(productData.dosage || '');

    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      name: canonicalName,
      dosage: canonicalDosage,
      id: newId,
    };
    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('peptide_products', JSON.stringify(updated));
      return updated;
    });
    showToast(`Produto "${newProduct.name}" (${newProduct.dosage || 'Padrão'}) cadastrado com sucesso!`);

    // Save to Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('products').upsert(mapProductToDB(newProduct));
      }
    } catch (e) {
      console.log('Error adding product to Supabase:', e);
    }

    try {
      await setDoc(doc(db, 'products', newId), cleanUndefinedForFirestore(newProduct));
    } catch (e) {
      console.log('Error adding product to Firestore:', e);
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const cleanedFields = { ...updatedFields };
    if (cleanedFields.name) {
      cleanedFields.name = normalizeProductName(cleanedFields.name);
    }
    if (cleanedFields.dosage !== undefined) {
      cleanedFields.dosage = normalizeDosage(cleanedFields.dosage);
    }

    let updatedList: Product[] = [];
    setProducts((prev) => {
      updatedList = prev.map((p) => (p.id === id ? { ...p, ...cleanedFields } : p));
      localStorage.setItem('peptide_products', JSON.stringify(updatedList));
      return updatedList;
    });
    showToast('Produto atualizado com sucesso!');

    const target = updatedList.find(p => p.id === id);
    if (target) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('products').upsert(mapProductToDB(target));
        }
      } catch (e) {
        console.log('Error updating product in Supabase:', e);
      }

      try {
        await setDoc(doc(db, 'products', id), target, { merge: true });
      } catch (e) {
        console.log('Error updating product in Firestore:', e);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem('peptide_products', JSON.stringify(updated));
      return updated;
    });
    showToast('Produto removido do catálogo.');

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('products').delete().eq('id', id);
      }
    } catch (e) {
      console.log('Error deleting product from Supabase:', e);
    }

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.log('Error deleting product from Firestore:', e);
    }
  };

  const toggleProductPromotion = async (id: string, isPromotion?: boolean, discount = 15) => {
    let target: Product | undefined;
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const nextPromo = isPromotion !== undefined ? isPromotion : !p.isPromotion;
          const origPrice = p.originalPrice || (nextPromo ? Math.round(p.price * 1.25) : undefined);
          target = {
            ...p,
            isPromotion: nextPromo,
            originalPrice: origPrice,
            promotionDiscount: nextPromo ? (p.promotionDiscount || discount) : undefined,
          };
          return target;
        }
        return p;
      });
      localStorage.setItem('peptide_products', JSON.stringify(updated));
      return updated;
    });
    showToast('Status de promoção atualizado!');

    if (target) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('products').upsert(mapProductToDB(target));
        }
      } catch (e) {
        console.log('Error updating promotion in Supabase:', e);
      }

      try {
        await setDoc(doc(db, 'products', id), cleanUndefinedForFirestore(target), { merge: true });
      } catch (e) {
        console.log('Error updating promotion in Firestore:', e);
      }
    }
  };

  const toggleProductFeatured = async (id: string) => {
    let target: Product | undefined;
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const nextFeatured = !p.featured;
          target = { ...p, featured: nextFeatured };
          return target;
        }
        return p;
      });
      localStorage.setItem('peptide_products', JSON.stringify(updated));
      return updated;
    });
    showToast('Status de destaque atualizado!');

    if (target) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('products').upsert(mapProductToDB(target));
        }
      } catch (e) {
        console.log('Error updating featured in Supabase:', e);
      }

      try {
        await setDoc(doc(db, 'products', id), cleanUndefinedForFirestore(target), { merge: true });
      } catch (e) {
        console.log('Error updating featured in Firestore:', e);
      }
    }
  };

  const syncOfficialCatalog = async () => {
    try {
      showToast('Sincronizando catálogo oficial com o banco de dados...');
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbProds = INITIAL_PRODUCTS.map(mapProductToDB);
        await supabase.from('products').upsert(dbProds);
      }
      for (const product of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', product.id), cleanUndefinedForFirestore(product), { merge: true });
      }
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('peptide_products', JSON.stringify(INITIAL_PRODUCTS));
      showToast(`Catálogo oficial (${INITIAL_PRODUCTS.length} produtos) gravado no banco de dados com sucesso!`);
    } catch (err) {
      console.error('Erro ao sincronizar catálogo:', err);
      showToast('Erro ao sincronizar com banco de dados.');
    }
  };

  // --- Bulk Cloud Sync / Push Methods for all Admin Tabs ---
  const saveAllProductsToCloud = async (): Promise<boolean> => {
    try {
      showToast('Salvando catálogo de produtos no banco de dados...');
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbProds = products.map(mapProductToDB);
        await supabase.from('products').upsert(dbProds);
      }
      for (const p of products) {
        await setDoc(doc(db, 'products', p.id), cleanUndefinedForFirestore(p), { merge: true });
      }
      localStorage.setItem('peptide_products', JSON.stringify(products));
      showToast(`Todos os ${products.length} produtos foram salvos no banco e atualizados no site!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar produtos:', err);
      showToast('Erro ao salvar produtos no banco de dados.');
      return false;
    }
  };

  // --- Product Requests (Pedidos de Cadastro de Produto pelo Dono) ---
  const addProductRequest = async (
    requestData: Omit<ProductRequest, 'id' | 'createdAt' | 'status'> & { status?: 'Pendente' | 'Aprovado' }
  ): Promise<ProductRequest> => {
    const newId = `req-${Date.now()}`;
    const newReq: ProductRequest = {
      ...requestData,
      id: newId,
      status: requestData.status || 'Pendente',
      createdAt: new Date().toISOString(),
      requesterName: currentUser?.name || 'Proprietário da Loja',
      requesterEmail: currentUser?.email || 'proprietario@peptideimports.com.br',
    };

    setProductRequests((prev) => {
      const updated = [newReq, ...prev];
      localStorage.setItem('peptide_product_requests', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'productRequests', newId), cleanUndefinedForFirestore(newReq));
    } catch (e) {
      console.log('Error saving product request to Firestore:', e);
    }

    showToast('Pedido de cadastro de produto enviado com sucesso!');
    return newReq;
  };

  const approveProductRequest = async (requestId: string): Promise<Product | null> => {
    const target = productRequests.find((r) => r.id === requestId);
    if (!target) {
      showToast('Pedido de cadastro não encontrado.');
      return null;
    }

    // Convert request into live Product
    const newProductData: Omit<Product, 'id'> = {
      name: target.name.trim().toUpperCase(),
      dosage: target.dosage.trim().toUpperCase(),
      category: target.category as any,
      price: target.price,
      costPrice: target.costPrice,
      stock: target.stock || 25,
      capColor: target.capColor || ((target.category || '').toLowerCase().includes('emagrecimento') ? '#22C55E' : '#0088FF'),
      description: target.description,
      benefits: ['Laudo laboratorial HPLC certificado', 'Alta pureza e biodisponibilidade', 'Rastreabilidade garantida'],
      purity: '99.5% HPLC',
      storage: '2°C a 8°C (Refrigerado)',
      reconstitution: 'Reconstituir com água bacteriostática estéril',
      imageUrl: target.imageUrl || undefined,
      featured: false,
      isPromotion: false,
    };

    await addProduct(newProductData);

    // Update request status to 'Aprovado'
    const updatedStatus: Partial<ProductRequest> = {
      status: 'Aprovado',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser?.name || 'Administrador Master',
    };

    setProductRequests((prev) => {
      const updated = prev.map((r) => (r.id === requestId ? { ...r, ...updatedStatus } : r));
      localStorage.setItem('peptide_product_requests', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'productRequests', requestId), cleanUndefinedForFirestore(updatedStatus), { merge: true });
    } catch (e) {
      console.log('Error updating product request in Firestore:', e);
    }

    showToast(`Produto "${target.name}" aprovado e cadastrado na loja virtual!`);
    return null;
  };

  const deleteProductRequest = async (requestId: string): Promise<boolean> => {
    setProductRequests((prev) => {
      const updated = prev.filter((r) => r.id !== requestId);
      localStorage.setItem('peptide_product_requests', JSON.stringify(updated));
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'productRequests', requestId));
    } catch (e) {
      console.log('Error deleting product request from Firestore:', e);
    }

    showToast('Pedido de cadastro removido.');
    return true;
  };

  const refreshSalesData = useCallback(async (silent = false): Promise<{ success: boolean; count: number }> => {
    try {
      if (!silent) {
        showToast('Atualizando dados de vendas em tempo real...');
      }
      const orderMap = new Map<string, Order>();
      let fetchedProducts: Product[] = [];

      // 1. Fetch from Firestore (Source of Truth with all 53 real orders)
      try {
        const snap = await getDocs(collection(db, 'orders'));
        if (!snap.empty) {
          snap.forEach((d) => {
            const o = { ...(d.data() as Order), id: d.id };
            const k = o.id || o.orderNumber;
            if (k) orderMap.set(k, o);
          });
        }
      } catch (fireErr) {
        console.log('Firestore fetchSalesData notice:', fireErr);
      }

      // 2. Fetch from Supabase (if configured) and merge
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data: ordData, error: ordErr } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          if (!ordErr && ordData) {
            const mapped = ordData.map(mapDBToOrder);
            mapped.forEach((o) => {
              const k = o.id || o.orderNumber;
              if (k) {
                const existing = orderMap.get(k);
                orderMap.set(k, { ...existing, ...o });
              }
            });
          }

          const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
          if (!prodErr && prodData && prodData.length > 0) {
            fetchedProducts = prodData.map(mapDBToProduct);
          }
        } catch (supErr) {
          console.log('Supabase fetchSalesData notice:', supErr);
        }
      }

      // 3. Final combined orders list
      const finalOrders = Array.from(orderMap.values());
      finalOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (finalOrders.length > 0) {
        setOrders(finalOrders);
        localStorage.setItem('peptide_orders', JSON.stringify(finalOrders));

        // Replicate any missing orders to Supabase if Supabase is active
        if (supabase && isSupabaseConfigured()) {
          const dbOrders = finalOrders.map(mapOrderToDB);
          supabase.from('orders').upsert(dbOrders).then(({ error: upErr }) => {
            if (!upErr) console.log(`Synced ${dbOrders.length} orders to Supabase.`);
          });
        }
      }

      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
        localStorage.setItem('peptide_products', JSON.stringify(fetchedProducts));
      }

      if (!silent) {
        showToast(`Relatório de vendas 100% atualizado! Total: ${finalOrders.length} pedidos.`);
      }

      return { success: true, count: finalOrders.length };
    } catch (err) {
      console.error('Erro ao atualizar dados de vendas:', err);
      if (!silent) {
        showToast('Erro ao atualizar dados de vendas.');
      }
      return { success: false, count: 0 };
    }
  }, []);

  const saveAllOrdersToCloud = async (): Promise<boolean> => {
    try {
      showToast('Sincronizando pedidos com o banco de dados...');
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbOrders = orders.map(mapOrderToDB);
        await supabase.from('orders').upsert(dbOrders);
      }
      for (const o of orders) {
        await setDoc(doc(db, 'orders', o.id), cleanUndefinedForFirestore(o), { merge: true });
      }
      localStorage.setItem('peptide_orders', JSON.stringify(orders));
      showToast(`Todos os ${orders.length} pedidos foram sincronizados no banco de dados!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar pedidos:', err);
      showToast('Erro ao salvar pedidos no banco de dados.');
      return false;
    }
  };

  const saveAllFinancesToCloud = async (): Promise<boolean> => {
    try {
      showToast('Salvando lançamentos contábeis no banco...');
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbFins = financialTransactions.map(mapFinToDB);
        await supabase.from('financial_transactions').upsert(dbFins);
      }
      for (const tx of financialTransactions) {
        await setDoc(doc(db, 'financialTransactions', tx.id), cleanUndefinedForFirestore(tx), { merge: true });
      }
      localStorage.setItem('peptide_finances', JSON.stringify(financialTransactions));
      showToast(`Livro caixa (${financialTransactions.length} lançamentos) salvo no banco!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar financeiro:', err);
      showToast('Erro ao salvar financeiro no banco de dados.');
      return false;
    }
  };

  const saveAllEmployeesToCloud = async (): Promise<boolean> => {
    try {
      showToast('Salvando equipe e permissões no banco...');
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbEmps = employees.map(mapEmployeeToDB);
        await supabase.from('employees').upsert(dbEmps);
      }
      for (const emp of employees) {
        await setDoc(doc(db, 'employees', emp.id), cleanUndefinedForFirestore(emp), { merge: true });
      }
      localStorage.setItem('peptide_employees', JSON.stringify(employees));
      showToast(`Equipe (${employees.length} colaboradores) salva no banco de dados!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar equipe:', err);
      showToast('Erro ao salvar equipe no banco de dados.');
      return false;
    }
  };

  const saveAllCouponsToCloud = async (): Promise<boolean> => {
    try {
      showToast('Salvando cupons de desconto no banco...');
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbCoups = coupons.map(mapCouponToDB);
        await supabase.from('coupons').upsert(dbCoups);
      }
      for (const coup of coupons) {
        await setDoc(doc(db, 'coupons', coup.id), cleanUndefinedForFirestore(coup), { merge: true });
      }
      localStorage.setItem('peptide_coupons', JSON.stringify(coupons));
      showToast(`Cupons (${coupons.length} ativos) salvos e sincronizados com a loja!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar cupons:', err);
      showToast('Erro ao salvar cupons no banco de dados.');
      return false;
    }
  };

  const toggleStorePurchasesSuspension = async (
    targetSuspended?: boolean,
    customMessage?: string,
    customTitle?: string
  ): Promise<boolean> => {
    try {
      const nextState = targetSuspended !== undefined ? targetSuspended : !storeSettings.purchasesSuspended;
      const updated: StoreSettings = {
        ...storeSettings,
        purchasesSuspended: nextState,
        ...(customMessage ? { suspensionMessage: customMessage } : {}),
        ...(customTitle ? { suspensionTitle: customTitle } : {}),
      };

      setStoreSettings(updated);
      localStorage.setItem('peptide_settings', JSON.stringify(updated));

      // 1. Primary write to Firebase Firestore
      await setDoc(doc(db, 'settings', 'config'), cleanUndefinedForFirestore(updated), { merge: true });

      // 2. Secondary write to Supabase if configured
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('store_settings').upsert(mapSettingsToDB(updated));
      }

      if (nextState) {
        showToast('⏸️ Caixa em Fechamento: Compras suspensas e fixadas no Firebase Firestore!');
      } else {
        showToast('🟢 Loja Reaberta: Compras liberadas e sincronizadas no Firebase!');
      }
      return true;
    } catch (err) {
      console.error('Erro ao alterar status de suspensão de compras:', err);
      showToast('Erro ao atualizar status do caixa no Firebase.');
      return false;
    }
  };

  const saveAllSettingsToCloud = async (customSettings?: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const merged: StoreSettings = {
        ...storeSettings,
        ...(customSettings || {}),
        purchasesSuspended: customSettings?.purchasesSuspended !== undefined 
          ? Boolean(customSettings.purchasesSuspended) 
          : Boolean(storeSettings.purchasesSuspended),
      };
      setStoreSettings(merged);
      localStorage.setItem('peptide_settings', JSON.stringify(merged));

      // 1. Primary write to Firebase Firestore
      await setDoc(doc(db, 'settings', 'config'), cleanUndefinedForFirestore(merged), { merge: true });

      // 2. Secondary write to Supabase if configured
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('store_settings').upsert(mapSettingsToDB(merged));
      }
      showToast('Configurações salvas e sincronizadas no Firebase Firestore!');
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      showToast('Erro ao salvar configurações no Firebase.');
      return false;
    }
  };

  const saveEverythingToCloud = async (): Promise<boolean> => {
    try {
      showToast('Sincronizando todas as abas e subindo para o banco de dados...');
      await Promise.all([
        saveAllProductsToCloud(),
        saveAllOrdersToCloud(),
        saveAllFinancesToCloud(),
        saveAllEmployeesToCloud(),
        saveAllCouponsToCloud(),
        saveAllSettingsToCloud(),
      ]);
      showToast('Todas as alterações de todas as abas foram salvas no banco e atualizadas no site!');
      return true;
    } catch (err) {
      console.error('Erro no salvamento geral:', err);
      showToast('Erro ao salvar tudo no banco de dados.');
      return false;
    }
  };

  const auditDeduplication = (): DeduplicationAuditReport => {
    return auditDatabaseDeduplication(products, orders);
  };

  const executeCatalogDeduplication = async (
    primaryProductId: string,
    duplicateProductIds: string[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const primary = products.find((p) => p.id === primaryProductId);
      if (!primary) {
        return { success: false, message: 'Produto principal não encontrado no catálogo.' };
      }

      showToast('Unificando produtos duplicados e sincronizando pedidos...');

      const { updatedProducts, updatedOrders, deletedProductIds } = mergeDuplicateProductGroup(
        primary,
        duplicateProductIds,
        products,
        orders
      );

      // 1. Update in-memory and local state
      setProducts(updatedProducts);
      localStorage.setItem('peptide_products', JSON.stringify(updatedProducts));

      setOrders(updatedOrders);
      localStorage.setItem('peptide_orders', JSON.stringify(updatedOrders));

      // 2. Sync to Supabase
      const supabase = getSupabaseClient();
      if (supabase) {
        const primaryUpdated = updatedProducts.find((p) => p.id === primary.id) || primary;
        await supabase.from('products').upsert(mapProductToDB(primaryUpdated));
        if (deletedProductIds.length > 0) {
          await supabase.from('products').delete().in('id', deletedProductIds);
        }
      }

      // 3. Sync to Firestore
      const primaryUpdated = updatedProducts.find((p) => p.id === primary.id) || primary;
      await setDoc(doc(db, 'products', primary.id), cleanUndefinedForFirestore(primaryUpdated), { merge: true });
      for (const delId of deletedProductIds) {
        await deleteDoc(doc(db, 'products', delId));
      }

      // 4. Update impacted orders in DB
      for (const ord of updatedOrders) {
        const originalOrd = orders.find((o) => o.id === ord.id);
        if (JSON.stringify(originalOrd?.items) !== JSON.stringify(ord.items)) {
          if (supabase) {
            await supabase.from('orders').upsert(mapOrderToDB(ord));
          }
          await setDoc(doc(db, 'orders', ord.id), cleanUndefinedForFirestore(ord), { merge: true });
        }
      }

      showToast(`Duplicidades unificadas com sucesso! ${deletedProductIds.length} produto(s) duplicado(s) removido(s) e catálogo padronizado.`);
      return { success: true, message: 'Unificação concluída com sucesso!' };
    } catch (err: any) {
      console.error('Erro na unificação de duplicidades:', err);
      showToast('Erro ao unificar duplicidades.');
      return { success: false, message: err?.message || 'Erro ao unificar.' };
    }
  };

  // --- Cart Actions ---
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`${product.name} ${product.dosage} adicionado ao carrinho!`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
  const rawCartTotal = (cart || []).reduce(
    (acc, item) => acc + (item.product?.price || 0) * (item.quantity || 1),
    0
  );
  const cartTotal = Number((rawCartTotal || 0).toFixed(2));

  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'PERCENTAGE'
      ? Number((((cartTotal * (appliedCoupon.value || 0)) / 100) || 0).toFixed(2))
      : Number((Math.min(cartTotal, appliedCoupon.value || 0) || 0).toFixed(2))
    : 0;

  const deliveryFee = typeof storeSettings.deliveryFee === 'number' ? storeSettings.deliveryFee : 30.00;

  // --- Auth & Role Switching ---
  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      let loggedUser: User;
      const isMasterAdminEmail = fbUser.email?.toLowerCase().trim() === 'khevineoliveira@gmail.com';

      if (userSnap.exists()) {
        loggedUser = userSnap.data() as User;
        if (isMasterAdminEmail) {
          loggedUser.role = 'ADMIN';
          loggedUser.staffRole = 'Administrador Master';
          loggedUser.isMaster = true;
          await setDoc(userDocRef, cleanUndefinedForFirestore(loggedUser), { merge: true });
        }
      } else {
        loggedUser = {
          id: fbUser.uid,
          name: fbUser.displayName || (isMasterAdminEmail ? 'Khevine Oliveira' : fbUser.email?.split('@')[0] || 'Cliente'),
          email: fbUser.email || '',
          role: isMasterAdminEmail ? 'ADMIN' : 'CLIENTE',
          staffRole: isMasterAdminEmail ? 'Administrador Master' : undefined,
          isMaster: isMasterAdminEmail,
          phone: fbUser.phoneNumber || '(11) 99999-0000',
          photoURL: fbUser.photoURL || undefined,
          addresses: [
            {
              street: 'Av. Paulista',
              number: '1000',
              neighborhood: 'Bela Vista',
              city: 'São Paulo',
              state: 'SP',
              zipCode: '01310-100',
            },
          ],
        };
        await setDoc(userDocRef, cleanUndefinedForFirestore(loggedUser));
      }
      
      setCurrentUser(loggedUser);
      if (isMasterAdminEmail) {
        setCurrentView('admin');
        showToast(`Bem-vindo, Khevine Oliveira (Administrador Master)!`);
      } else {
        setCurrentView('store');
        showToast(`Bem-vindo(a), ${loggedUser.name}!`);
      }
      return { success: true };
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const errMsg = err instanceof Error ? err.message : 'Falha na autenticação com o Google';
      return { success: false, message: errMsg };
    }
  };

  const loginStaffOrAdmin = (
    emailInput: string,
    passwordInput: string
  ): { success: boolean; message: string; role?: 'ADMIN' | 'CLIENTE'; employee?: Employee } => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Brute-force protection: check active lockout
    const now = Date.now();
    if (lockoutUntilRef.current && now < lockoutUntilRef.current) {
      const waitSeconds = Math.ceil((lockoutUntilRef.current - now) / 1000);
      return {
        success: false,
        message: `Muitas tentativas incorretas. Por motivos de segurança, aguarde ${waitSeconds} segundos.`,
      };
    }

    // Check if master admin (khevineoliveira@gmail.com with password Aa88176895)
    const isMasterUser =
      cleanEmail === 'khevineoliveira@gmail.com' &&
      (cleanPass === 'Aa88176895' || cleanPass === 'aa88176895');

    if (isMasterUser) {
      failedAttemptsRef.current = 0;
      lockoutUntilRef.current = null;

      const masterUser: User = {
        ...ADMIN_USER,
        isMaster: true,
      };
      setCurrentUser(masterUser);
      setCurrentView('admin');
      showToast('Bem-vindo ao Painel Administrador Master ERP!');
      return { success: true, message: 'Acesso concedido ao Painel Administrativo Master.', role: 'ADMIN' };
    }

    // Check against registered employees in the system
    const emp = employees.find(
      (e) => e.email && e.email.toLowerCase().trim() === cleanEmail && e.status === 'Ativo'
    );

    if (emp) {
      // Validate password (default or custom)
      const validPass = emp.password || 'pep@2026';
      if (cleanPass === validPass) {
        failedAttemptsRef.current = 0;
        lockoutUntilRef.current = null;

        const staffUser: User = {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: 'ADMIN',
          phone: emp.phone,
          staffRole: emp.role,
          isMaster: false,
          addresses: [],
          permissions: emp.permissions,
        };
        setCurrentUser(staffUser);
        setCurrentView('admin');
        showToast(`Bem-vindo(a), ${emp.name} (${emp.role})!`);
        return { success: true, message: `Acesso liberado como ${emp.role}.`, role: 'ADMIN', employee: emp };
      }
    }

    // Increment failed attempts and trigger lockout if limit reached
    failedAttemptsRef.current += 1;
    if (failedAttemptsRef.current >= 5) {
      lockoutUntilRef.current = now + 60000; // 60-second cooldown
      failedAttemptsRef.current = 0;
      return {
        success: false,
        message: 'Muitas tentativas consecutivas incorretas. Sistema temporariamente bloqueado por 60 segundos.',
      };
    }

    // Generic OWASP authentication failure message to prevent username harvesting
    return {
      success: false,
      message: 'Credenciais inválidas. Verifique seu e-mail corporativo e senha cadastrada.',
    };
  };

  const loginUser = (email: string, role: 'CLIENTE' | 'ADMIN' = 'CLIENTE') => {
    // Only grant ADMIN if user is verified as master admin email
    if (role === 'ADMIN' && email.trim().toLowerCase() === 'khevineoliveira@gmail.com') {
      setCurrentUser(ADMIN_USER);
      showToast('Bem-vindo ao Painel Administrador ERP!');
    } else {
      setCurrentUser({
        ...CURRENT_CLIENT_USER,
        email,
      });
      showToast('Login realizado com sucesso!');
    }
    return true;
  };

  const logoutUser = () => {
    try {
      signOut(auth);
    } catch {
      // ignore
    }
    // Clean sensitive cached administrative data from local storage
    localStorage.removeItem('peptide_employees');
    localStorage.removeItem('peptide_finances');
    setCurrentUser(null);
    setCurrentView('store');
    showToast('Você saiu da sua conta.');
  };

  const switchUserRole = (role: 'CLIENTE' | 'ADMIN') => {
    if (role === 'ADMIN') {
      // Security: Only allow switching to ADMIN if currently already verified as ADMIN or master
      if (currentUser?.role === 'ADMIN' || currentUser?.isMaster) {
        setCurrentView('admin');
        showToast('Alternado para: Painel Administrador');
      } else {
        showToast('Acesso restrito. Faça login com credenciais de Administrador.');
      }
    } else {
      setCurrentUser((prev) => prev ? { ...prev, role: 'CLIENTE' } : CURRENT_CLIENT_USER);
      if (currentView === 'admin') setCurrentView('store');
      showToast('Alternado para visualização de Cliente');
    }
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      ...data,
    });
    showToast('Dados cadastrais atualizados!');
  };

  // --- Orders & Finances ---
  const createOrder = (orderData: {
    customer: { name: string; email: string; phone: string; cpf?: string };
    address: Address;
    paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar';
    discount?: number;
    shipping?: number;
    notes?: string;
    couponCode?: string;
  }): Order => {
    const subtotal = Number((cartTotal || 0).toFixed(2));
    const shipping = Number((orderData.shipping !== undefined ? (orderData.shipping || 0) : (deliveryFee || 0)).toFixed(2));
    const discount = Number((orderData.discount !== undefined ? (orderData.discount || 0) : (couponDiscount || 0)).toFixed(2));
    const total = Number(Math.max(0, subtotal + shipping - discount).toFixed(2));

    const sanitizedItems = sanitizeOrderItems([...cart], products);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#PI-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customer: orderData.customer,
      address: orderData.address,
      items: sanitizedItems,
      subtotal,
      shipping,
      discount,
      total,
      status: 'Pendente',
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes,
    };

    const supabase = getSupabaseClient();

    // Save order
    setOrders((prev) => [newOrder, ...prev]);

    // Save order to Supabase
    if (supabase) {
      supabase.from('orders').insert(mapOrderToDB(newOrder)).then();
    }

    // Save to Firestore fallback
    try {
      setDoc(doc(db, 'orders', newOrder.id), cleanUndefinedForFirestore(newOrder));
    } catch (e) {
      console.log('Error saving order to Firestore:', e);
    }

    // If coupon was applied, increment its usage and sync
    if (orderData.couponCode || appliedCoupon) {
      const codeToUpdate = (orderData.couponCode || appliedCoupon?.code)?.toUpperCase();
      if (codeToUpdate) {
        const matchedCoupon = coupons.find((c) => c.code === codeToUpdate);
        if (matchedCoupon) {
          const newUsage = (matchedCoupon.usageCount || 0) + 1;
          setCoupons((prev) =>
            prev.map((c) =>
              c.code === codeToUpdate ? { ...c, usageCount: newUsage } : c
            )
          );
          if (supabase) {
            supabase.from('coupons').update({ usage_count: newUsage }).eq('id', matchedCoupon.id).then();
          }
          try {
            setDoc(doc(db, 'coupons', matchedCoupon.id), cleanUndefinedForFirestore({ usageCount: newUsage }), { merge: true });
          } catch (e) {
            console.log('Error updating coupon usage in Firestore:', e);
          }
        }
      }
      setAppliedCoupon(null);
    }

    // Financial entry
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'ENTRADA',
      description: `Venda ${newOrder.orderNumber} (${newOrder.paymentMethod})`,
      category: 'Venda de Produtos',
      amount: newOrder.total,
      orderId: newOrder.id,
    };
    setFinancialTransactions((prev) => [newTx, ...prev]);

    if (supabase) {
      supabase.from('financial_transactions').insert(mapFinToDB(newTx)).then();
    }

    try {
      setDoc(doc(db, 'financialTransactions', newTx.id), cleanUndefinedForFirestore(newTx));
    } catch (e) {
      console.log('Error saving transaction in Firestore:', e);
    }

    clearCart();
    return newOrder;
  };

  const createManualOrder = async (orderData: {
    customer: { name: string; email?: string; phone: string; cpf?: string };
    address?: Partial<Address>;
    items: CartItem[];
    subtotal?: number;
    shipping?: number;
    discount?: number;
    paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar';
    status?: OrderStatus;
    notes?: string;
    clearedBy?: string;
  }): Promise<Order> => {
    const sanitizedItems = sanitizeOrderItems(orderData.items || [], products);
    const computedSubtotal = orderData.subtotal !== undefined
      ? orderData.subtotal
      : sanitizedItems.reduce((acc, it) => acc + (it.product?.price || 0) * (it.quantity || 1), 0);
    const shipping = Number((orderData.shipping || 0).toFixed(2));
    const discount = Number((orderData.discount || 0).toFixed(2));
    const total = Number(Math.max(0, computedSubtotal + shipping - discount).toFixed(2));
    const currentStatus: OrderStatus = orderData.status || 'Pago';
    const isPaid = currentStatus === 'Pago' || currentStatus === 'Entregue' || currentStatus === 'Em Separação' || currentStatus === 'Enviado';
    const operator = orderData.clearedBy || currentUser?.name || 'Administrador Master';

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#PI-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customer: {
        name: orderData.customer.name.trim(),
        email: (orderData.customer.email || '').trim() || 'cliente.direto@peptideimports.com.br',
        phone: (orderData.customer.phone || '').trim(),
        cpf: (orderData.customer.cpf || '').trim() || undefined,
      },
      address: {
        street: orderData.address?.street?.trim() || 'Balcão / A Combinar',
        number: orderData.address?.number?.trim() || 'S/N',
        complement: orderData.address?.complement?.trim() || '',
        neighborhood: orderData.address?.neighborhood?.trim() || 'Centro',
        city: orderData.address?.city?.trim() || 'São Paulo',
        state: orderData.address?.state?.trim() || 'SP',
        zipCode: orderData.address?.zipCode?.trim() || '01000-000',
      },
      items: sanitizedItems,
      subtotal: Number(computedSubtotal.toFixed(2)),
      shipping,
      discount,
      total,
      status: currentStatus,
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes || 'Pedido manual registrado via painel ERP.',
      clearedManuallyAt: isPaid ? new Date().toLocaleString('pt-BR') : undefined,
      clearedBy: isPaid ? operator : undefined,
    };

    // Update orders in state and localStorage
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem('peptide_orders', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving orders to localStorage:', e);
      }
      return updated;
    });

    // Decrement stock for ordered items
    if (orderData.items && orderData.items.length > 0) {
      setProducts((prevProducts) => {
        const updatedProds = prevProducts.map((p) => {
          const matchedItem = orderData.items.find((it) => it.product?.id === p.id);
          if (matchedItem) {
            const newStock = Math.max(0, (p.stock || 0) - (matchedItem.quantity || 1));
            return { ...p, stock: newStock };
          }
          return p;
        });
        try {
          localStorage.setItem('peptide_products', JSON.stringify(updatedProds));
        } catch {}
        return updatedProds;
      });
    }

    // Save to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('orders').insert(mapOrderToDB(newOrder)).then();
    }

    // Save to Firestore
    try {
      await setDoc(doc(db, 'orders', newOrder.id), cleanUndefinedForFirestore(newOrder));
    } catch (e) {
      console.log('Error saving manual order in Firestore:', e);
    }

    // Create linked financial transaction
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'ENTRADA',
      description: `Venda ${newOrder.orderNumber} (${newOrder.paymentMethod}) - Pedido Manual`,
      category: 'Venda de Produtos',
      amount: newOrder.total,
      orderId: newOrder.id,
    };

    setFinancialTransactions((prev) => {
      const updated = [newTx, ...prev];
      try {
        localStorage.setItem('peptide_finances', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (supabase) {
      supabase.from('financial_transactions').insert(mapFinToDB(newTx)).then();
    }

    try {
      await setDoc(doc(db, 'financialTransactions', newTx.id), cleanUndefinedForFirestore(newTx));
    } catch (e) {
      console.log('Error saving transaction for manual order in Firestore:', e);
    }

    showToast(`Pedido manual ${newOrder.orderNumber} (R$ ${newOrder.total.toFixed(2).replace('.', ',')}) registrado com sucesso!`);
    return newOrder;
  };

  const updateOrder = async (orderId: string, updatedData: Partial<Order>): Promise<boolean> => {
    const isoTimestamp = new Date().toISOString();
    let updatedOrderObj: Order | null = null;

    setOrders((prev) => {
      const updatedList = prev.map((order) => {
        if (order.id === orderId) {
          const sanitizedItems =
            updatedData.items !== undefined
              ? sanitizeOrderItems(updatedData.items, products)
              : order.items;

          const computedSubtotal =
            updatedData.subtotal !== undefined
              ? updatedData.subtotal
              : updatedData.items !== undefined
              ? (sanitizedItems || []).reduce((acc, it) => acc + (it.product?.price || 0) * (it.quantity || 1), 0)
              : order.subtotal;

          const shipping = updatedData.shipping !== undefined ? Number(updatedData.shipping) : (order.shipping || 0);
          const discount = updatedData.discount !== undefined ? Number(updatedData.discount) : (order.discount || 0);
          const total =
            updatedData.total !== undefined
              ? Number(updatedData.total)
              : Number(Math.max(0, computedSubtotal + shipping - discount).toFixed(2));

          updatedOrderObj = {
            ...order,
            ...updatedData,
            customer: {
              ...order.customer,
              ...(updatedData.customer || {}),
            },
            address: {
              ...order.address,
              ...(updatedData.address || {}),
            },
            items: sanitizedItems,
            subtotal: Number(computedSubtotal.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            total: Number(total.toFixed(2)),
            updatedAt: isoTimestamp,
          };
          return updatedOrderObj;
        }
        return order;
      });

      try {
        localStorage.setItem('peptide_orders', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Error saving orders to localStorage:', e);
      }
      return updatedList;
    });

    if (!updatedOrderObj) return false;
    const finalOrder = updatedOrderObj as Order;

    // Save to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase
        .from('orders')
        .upsert(mapOrderToDB(finalOrder))
        .then((res) => {
          if (res.error) console.log('Supabase order update info:', res.error.message);
        });
    }

    // Save to Firestore
    try {
      await setDoc(doc(db, 'orders', orderId), cleanUndefinedForFirestore(finalOrder), { merge: true });
    } catch (e) {
      console.log('Error updating order in Firestore:', e);
    }

    // Update linked financial transaction if existing
    setFinancialTransactions((prev) => {
      const updatedFinances = prev.map((tx) => {
        if (tx.orderId === orderId) {
          return {
            ...tx,
            amount: finalOrder.total,
            description: `Venda ${finalOrder.orderNumber} (${finalOrder.paymentMethod}) - Pedido Atualizado`,
          };
        }
        return tx;
      });
      try {
        localStorage.setItem('peptide_finances', JSON.stringify(updatedFinances));
      } catch {}
      return updatedFinances;
    });

    if (supabase) {
      supabase
        .from('financial_transactions')
        .update({
          amount: finalOrder.total,
          description: `Venda ${finalOrder.orderNumber} (${finalOrder.paymentMethod}) - Pedido Atualizado`,
        })
        .eq('order_id', orderId)
        .then();
    }

    try {
      const finQuery = query(collection(db, 'financialTransactions'), where('orderId', '==', orderId));
      const finSnap = await getDocs(finQuery);
      finSnap.forEach(async (d) => {
        try {
          await updateDoc(doc(db, 'financialTransactions', d.id), {
            amount: finalOrder.total,
            description: `Venda ${finalOrder.orderNumber} (${finalOrder.paymentMethod}) - Pedido Atualizado`,
          });
        } catch {}
      });
    } catch (e) {
      console.log('Error updating linked financial transaction in Firestore:', e);
    }

    showToast(`Pedido ${finalOrder.orderNumber} atualizado com sucesso!`);
    return true;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingCode?: string) => {
    const isoTimestamp = new Date().toISOString();
    let updatedList: Order[] = [];
    setOrders((prev) => {
      updatedList = prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status,
            trackingCode: trackingCode !== undefined ? trackingCode : order.trackingCode,
          };
        }
        return order;
      });
      try {
        localStorage.setItem('peptide_orders', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Error saving orders to localStorage:', e);
      }
      return updatedList;
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      const dbUpdate: Record<string, any> = { status, updated_at: isoTimestamp };
      if (trackingCode !== undefined) dbUpdate.tracking_code = trackingCode;
      supabase.from('orders').update(dbUpdate).eq('id', orderId).then((res) => {
        if (res.error) console.log('Supabase status update info:', res.error.message);
      });
    }

    try {
      const updateData: Record<string, any> = { status, updatedAt: isoTimestamp };
      if (trackingCode !== undefined) updateData.trackingCode = trackingCode;
      await setDoc(doc(db, 'orders', orderId), cleanUndefinedForFirestore(updateData), { merge: true });
    } catch (e) {
      console.log('Error updating order status in Firestore:', e);
    }
    showToast(`Status do pedido atualizado para: ${status}`);
  };

  const clearOrderManually = async (
    orderId: string,
    status: OrderStatus,
    clearedBy: string,
    notes?: string,
    paidAmount?: number,
    remainingAmount?: number
  ) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const isoTimestamp = new Date().toISOString();
    const operator = clearedBy || currentUser?.name || 'Administrador';
    const noteText = notes || 'Baixa manual confirmada pelo operador via WhatsApp.';

    let updatedList: Order[] = [];
    setOrders((prev) => {
      updatedList = prev.map((order) => {
        if (order.id === orderId) {
          const finalPaid = paidAmount !== undefined ? paidAmount : (status === 'Pago' || status === 'Entregue' ? order.total : order.paidAmount);
          const finalRemaining = remainingAmount !== undefined ? remainingAmount : (finalPaid !== undefined ? Math.max(0, order.total - finalPaid) : order.remainingAmount);
          return {
            ...order,
            status,
            paidAmount: finalPaid,
            remainingAmount: finalRemaining,
            clearedManuallyAt: timestamp,
            clearedBy: operator,
            notes: noteText,
          };
        }
        return order;
      });
      try {
        localStorage.setItem('peptide_orders', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Error saving orders to localStorage:', e);
      }
      return updatedList;
    });

    const targetOrder = updatedList.find((o) => o.id === orderId);

    const supabase = getSupabaseClient();
    if (supabase) {
      const updateData: Record<string, any> = {
        status,
        cleared_manually_at: isoTimestamp,
        cleared_by: operator,
        notes: noteText,
        updated_at: isoTimestamp,
      };
      if (targetOrder?.paidAmount !== undefined) updateData.paid_amount = targetOrder.paidAmount;
      if (targetOrder?.remainingAmount !== undefined) updateData.remaining_amount = targetOrder.remainingAmount;

      supabase.from('orders').update(updateData).eq('id', orderId).then((res) => {
        if (res.error) console.log('Supabase clear order info:', res.error.message);
      });
    }

    try {
      await setDoc(
        doc(db, 'orders', orderId),
        cleanUndefinedForFirestore({
          status,
          paidAmount: targetOrder?.paidAmount,
          remainingAmount: targetOrder?.remainingAmount,
          clearedManuallyAt: timestamp,
          clearedBy: operator,
          notes: noteText,
          updatedAt: isoTimestamp,
        }),
        { merge: true }
      );
    } catch (e) {
      console.log('Error saving manual clearance in Firestore:', e);
    }
    showToast(`Baixa manual concluída e salva com sucesso! Status: ${status}`);
  };

  const addFinancialTransaction = (tx: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
    };
    setFinancialTransactions((prev) => [newTx, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('financial_transactions').insert(mapFinToDB(newTx)).then();
    }

    try {
      setDoc(doc(db, 'financialTransactions', newTx.id), cleanUndefinedForFirestore(newTx));
    } catch (e) {
      console.log('Error saving financial transaction in Firestore:', e);
    }
    showToast('Lançamento financeiro registrado com sucesso!');
  };

  const deleteFinancialTransaction = async (id: string): Promise<void> => {
    setFinancialTransactions((prev) => prev.filter((t) => t.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('financial_transactions').delete().eq('id', id);
    }

    try {
      await deleteDoc(doc(db, 'financialTransactions', id));
    } catch (e) {
      console.log('Error deleting financial transaction from Firestore:', e);
    }
    showToast('Lançamento financeiro removido com sucesso.');
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    // 1. Remove order from state
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    // 2. Remove associated financial transaction from state if linked
    setFinancialTransactions((prev) => prev.filter((tx) => tx.orderId !== orderId));

    // 3. Update localStorage
    try {
      const savedOrders = JSON.parse(localStorage.getItem('peptide_orders') || '[]');
      const filteredOrders = savedOrders.filter((o: Order) => o.id !== orderId);
      localStorage.setItem('peptide_orders', JSON.stringify(filteredOrders));

      const savedFinances = JSON.parse(localStorage.getItem('peptide_finances') || '[]');
      const filteredFinances = savedFinances.filter((t: FinancialTransaction) => t.orderId !== orderId);
      localStorage.setItem('peptide_finances', JSON.stringify(filteredFinances));
    } catch (e) {
      console.log('Error syncing deletion with localStorage:', e);
    }

    // 4. Delete order and linked transaction from Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('financial_transactions').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
    }

    // 5. Delete order document from Firestore
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      console.log('Error deleting order from Firestore:', e);
    }

    // 6. Delete linked financial transaction in Firestore if any
    try {
      const financesSnap = await getDocs(
        query(collection(db, 'financialTransactions'), where('orderId', '==', orderId))
      );
      financesSnap.forEach(async (d) => {
        try {
          await deleteDoc(doc(db, 'financialTransactions', d.id));
        } catch {}
      });
    } catch (e) {
      console.log('Error deleting linked financial transaction in Firestore:', e);
    }

    showToast('Pedido excluído com sucesso!');
    return true;
  };

  const clearAllOrders = async (): Promise<void> => {
    setOrders([]);
    localStorage.setItem('peptide_orders', '[]');

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('orders').delete().neq('id', '');
    }

    try {
      const snap = await getDocs(collection(db, 'orders'));
      snap.forEach(async (d) => {
        try {
          await deleteDoc(doc(db, 'orders', d.id));
        } catch {}
      });
    } catch (e) {
      console.log('Error clearing all orders in Firestore:', e);
    }
    showToast('Todos os pedidos foram removidos com sucesso.');
  };

  const clearAllFinances = async (): Promise<void> => {
    setFinancialTransactions([]);
    localStorage.setItem('peptide_finances', '[]');

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('financial_transactions').delete().neq('id', '');
    }

    try {
      const snap = await getDocs(collection(db, 'financialTransactions'));
      snap.forEach(async (d) => {
        try {
          await deleteDoc(doc(db, 'financialTransactions', d.id));
        } catch {}
      });
    } catch (e) {
      console.log('Error clearing all financial transactions in Firestore:', e);
    }
    showToast('Histórico financeiro zerado com sucesso.');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductPromotion,
        toggleProductFeatured,
        syncOfficialCatalog,
        executeCatalogDeduplication,
        auditDeduplication,
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        currentUser,
        loginUser,
        loginWithGoogle,
        loginStaffOrAdmin,
        logoutUser,
        switchUserRole,
        updateUserProfile,
        isAuthOpen,
        setIsAuthOpen,
        orders,
        createOrder,
        createManualOrder,
        updateOrder,
        updateOrderStatus,
        clearOrderManually,
        deleteOrder,
        clearAllOrders,
        clearAllFinances,
        refreshSalesData,
        financialTransactions,
        addFinancialTransaction,
        deleteFinancialTransaction,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        clearAllEmployees,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponStatus,
        appliedCoupon,
        setAppliedCoupon,
        applyCouponCode,
        removeCoupon,
        couponDiscount,
        storeSettings,
        updateStoreSettings,
        toggleStorePurchasesSuspension,
        deliveryFee,
        isSupabaseActive,
        supabaseConfigured,
        saveAllProductsToCloud,
        saveAllOrdersToCloud,
        saveAllFinancesToCloud,
        saveAllEmployeesToCloud,
        saveAllCouponsToCloud,
        saveAllSettingsToCloud,
        saveEverythingToCloud,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        selectedProductDetail,
        setSelectedProductDetail,
        productRequests,
        addProductRequest,
        approveProductRequest,
        deleteProductRequest,
        getProductRequestShareUrl,
        currentView,
        setCurrentView,
        activeNav,
        setActiveNav,
        infoModal,
        setInfoModal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

