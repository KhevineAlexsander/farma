import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem, Order, FinancialTransaction, User, ProductCategory, OrderStatus, Address, Employee, StoreSettings, Coupon } from '../types';
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

interface AppContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductPromotion: (id: string, isPromotion?: boolean, discount?: number) => void;
  toggleProductFeatured: (id: string) => void;
  syncOfficialCatalog: () => Promise<void>;

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
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingCode?: string) => void;
  clearOrderManually: (orderId: string, status: OrderStatus, clearedBy: string, notes?: string) => void;
  deleteOrder: (orderId: string) => Promise<boolean>;
  clearAllOrders: () => Promise<void>;
  clearAllFinances: () => Promise<void>;

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

  currentView: 'store' | 'admin' | 'my-account' | 'checkout' | 'guide';
  setCurrentView: (view: 'store' | 'admin' | 'my-account' | 'checkout' | 'guide') => void;

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
    return saved ? JSON.parse(saved) : [];
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
            }));
          } else if (!settData) {
            await supabase.from('store_settings').upsert(mapSettingsToDB(INITIAL_SETTINGS));
          }

          // Fetch Orders
          const { data: ordData, error: ordErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (!ordErr && ordData) {
            const mapped = ordData.map(mapDBToOrder);
            setOrders(mapped);
            localStorage.setItem('peptide_orders', JSON.stringify(mapped));
          }

          // Fetch Financial Transactions
          const { data: finData, error: finErr } = await supabase.from('financial_transactions').select('*').order('date', { ascending: false });
          if (!finErr && finData) {
            const mapped = finData.map(mapDBToFin);
            setFinancialTransactions(mapped);
            localStorage.setItem('peptide_finances', JSON.stringify(mapped));
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
              setOrders(mapped);
              localStorage.setItem('peptide_orders', JSON.stringify(mapped));
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

    try {
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

      unsubSettings = onSnapshot(doc(db, 'settings', 'config'), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StoreSettings;
          setStoreSettings((prev) => {
            const merged = {
              ...INITIAL_SETTINGS,
              ...prev,
              ...data,
              deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : prev.deliveryFee,
            };
            localStorage.setItem('peptide_settings', JSON.stringify(merged));
            return merged;
          });
        }
      }, () => {});

      unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Order[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Order), id: d.id }));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders((prev) => (isSupabaseConfigured() && prev.length > 0 ? prev : list));
          localStorage.setItem('peptide_orders', JSON.stringify(list));
        }
      }, () => {});

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
            (e: Employee) =>
              !['emp-1', 'emp-2', 'emp-3'].includes(e.id) &&
              !['juliana@peptideimports.com.br', 'rafael.estoque@peptideimports.com.br', 'beatriz.vendas@peptideimports.com.br'].includes(e.email?.toLowerCase())
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

  // --- Navigation & UI State ---
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'my-account' | 'checkout' | 'guide'>('store');
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
      await setDoc(doc(db, 'settings', 'config'), updated, { merge: true });
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
      await setDoc(doc(db, 'employees', empId), newEmp);
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
    if (currentUser && (currentUser.id === id || currentUser.email.toLowerCase() === updates.email?.toLowerCase())) {
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
      await updateDoc(doc(db, 'employees', id), updates);
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
      await setDoc(doc(db, 'coupons', newId), newCoupon);
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
        await setDoc(doc(db, 'coupons', id), target, { merge: true });
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
        message: `Valor mínimo para este cupom é de R$ ${found.minOrderAmount.toFixed(2).replace('.', ',')}.`,
        discount: 0,
      };
    }

    let calculatedDiscount = 0;
    if (found.type === 'PERCENTAGE') {
      calculatedDiscount = (subtotal * found.value) / 100;
    } else {
      calculatedDiscount = Math.min(subtotal, found.value);
    }

    setAppliedCoupon(found);
    showToast(`Cupom "${found.code}" aplicado com sucesso!`);
    return {
      success: true,
      message: `Cupom ${found.code} aplicado (-${found.type === 'PERCENTAGE' ? `${found.value}%` : `R$ ${found.value.toFixed(2).replace('.', ',')}`})!`,
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
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
    };
    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('peptide_products', JSON.stringify(updated));
      return updated;
    });
    showToast(`Produto "${newProduct.name}" cadastrado com sucesso!`);

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
      await setDoc(doc(db, 'products', newId), newProduct);
    } catch (e) {
      console.log('Error adding product to Firestore:', e);
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    let updatedList: Product[] = [];
    setProducts((prev) => {
      updatedList = prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
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
        await setDoc(doc(db, 'products', id), target, { merge: true });
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
        await setDoc(doc(db, 'products', id), target, { merge: true });
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
        await setDoc(doc(db, 'products', product.id), product, { merge: true });
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
        await setDoc(doc(db, 'products', p.id), p, { merge: true });
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

  const saveAllOrdersToCloud = async (): Promise<boolean> => {
    try {
      showToast('Sincronizando pedidos com o banco de dados...');
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbOrders = orders.map(mapOrderToDB);
        await supabase.from('orders').upsert(dbOrders);
      }
      for (const o of orders) {
        await setDoc(doc(db, 'orders', o.id), o, { merge: true });
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
        await setDoc(doc(db, 'financialTransactions', tx.id), tx, { merge: true });
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
        await setDoc(doc(db, 'employees', emp.id), emp, { merge: true });
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
        await setDoc(doc(db, 'coupons', coup.id), coup, { merge: true });
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

  const saveAllSettingsToCloud = async (customSettings?: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const merged: StoreSettings = {
        ...storeSettings,
        ...(customSettings || {}),
      };
      setStoreSettings(merged);
      localStorage.setItem('peptide_settings', JSON.stringify(merged));

      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('store_settings').upsert(mapSettingsToDB(merged));
      }
      await setDoc(doc(db, 'settings', 'config'), merged, { merge: true });
      showToast('Configurações da loja salvas no banco e aplicadas ao site em tempo real!');
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      showToast('Erro ao salvar configurações no banco de dados.');
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

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = Number(
    cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2)
  );

  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'PERCENTAGE'
      ? Number(((cartTotal * appliedCoupon.value) / 100).toFixed(2))
      : Number(Math.min(cartTotal, appliedCoupon.value).toFixed(2))
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
          await setDoc(userDocRef, loggedUser, { merge: true });
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
        await setDoc(userDocRef, loggedUser);
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
      (e) => e.email.toLowerCase().trim() === cleanEmail && e.status === 'Ativo'
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
    const subtotal = Number(cartTotal.toFixed(2));
    const shipping = Number((orderData.shipping !== undefined ? orderData.shipping : deliveryFee).toFixed(2));
    const discount = Number((orderData.discount !== undefined ? orderData.discount : couponDiscount).toFixed(2));
    const total = Number(Math.max(0, subtotal + shipping - discount).toFixed(2));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#PI-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customer: orderData.customer,
      address: orderData.address,
      items: [...cart],
      subtotal,
      shipping,
      discount,
      total,
      status: 'Pendente',
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes,
    };

    const supabase = getSupabaseClient();

    // Deduct inventory stock & sync to Supabase & Firestore
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((item) => item.product.id === p.id);
        if (cartItem) {
          const updatedStock = Math.max(0, p.stock - cartItem.quantity);
          if (supabase) {
            supabase.from('products').update({ stock: updatedStock }).eq('id', p.id).then();
          }
          try {
            setDoc(doc(db, 'products', p.id), { stock: updatedStock }, { merge: true });
          } catch (e) {
            console.log('Error updating product stock in Firestore:', e);
          }
          return { ...p, stock: updatedStock };
        }
        return p;
      })
    );

    // Save order
    setOrders((prev) => [newOrder, ...prev]);

    // Save order to Supabase
    if (supabase) {
      supabase.from('orders').insert(mapOrderToDB(newOrder)).then();
    }

    // Save to Firestore fallback
    try {
      setDoc(doc(db, 'orders', newOrder.id), newOrder);
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
            setDoc(doc(db, 'coupons', matchedCoupon.id), { usageCount: newUsage }, { merge: true });
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
      setDoc(doc(db, 'financialTransactions', newTx.id), newTx);
    } catch (e) {
      console.log('Error saving transaction in Firestore:', e);
    }

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, trackingCode?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status,
            trackingCode: trackingCode !== undefined ? trackingCode : order.trackingCode,
          };
        }
        return order;
      })
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      const dbUpdate: Record<string, any> = { status };
      if (trackingCode !== undefined) dbUpdate.tracking_code = trackingCode;
      supabase.from('orders').update(dbUpdate).eq('id', orderId).then();
    }

    try {
      const updateData: Record<string, any> = { status };
      if (trackingCode !== undefined) updateData.trackingCode = trackingCode;
      setDoc(doc(db, 'orders', orderId), updateData, { merge: true });
    } catch (e) {
      console.log('Error updating order status in Firestore:', e);
    }
    showToast(`Status do pedido atualizado para: ${status}`);
  };

  const clearOrderManually = (orderId: string, status: OrderStatus, clearedBy: string, notes?: string) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status,
            clearedManuallyAt: timestamp,
            clearedBy: clearedBy || 'Administrador',
            notes: notes || order.notes || 'Baixa manual confirmada pelo operador via WhatsApp.',
          };
        }
        return order;
      })
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('orders').update({
        status,
        cleared_manually_at: timestamp,
        cleared_by: clearedBy || 'Administrador',
        notes: notes || 'Baixa manual confirmada pelo operador via WhatsApp.',
      }).eq('id', orderId).then();
    }

    try {
      setDoc(
        doc(db, 'orders', orderId),
        {
          status,
          clearedManuallyAt: timestamp,
          clearedBy: clearedBy || 'Administrador',
          notes: notes || 'Baixa manual confirmada pelo operador via WhatsApp.',
        },
        { merge: true }
      );
    } catch (e) {
      console.log('Error saving manual clearance in Firestore:', e);
    }
    showToast(`Baixa manual concluída para o pedido! Status: ${status}`);
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
      setDoc(doc(db, 'financialTransactions', newTx.id), newTx);
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
        updateOrderStatus,
        clearOrderManually,
        deleteOrder,
        clearAllOrders,
        clearAllFinances,
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

