import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem, Order, FinancialTransaction, User, ProductCategory, OrderStatus, Address, Employee, StoreSettings, Coupon } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_TRANSACTIONS, CURRENT_CLIENT_USER, ADMIN_USER, INITIAL_EMPLOYEES, INITIAL_SETTINGS, INITIAL_COUPONS } from '../data/mockData';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
} from '../lib/firebase';

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
    const saved = localStorage.getItem('peptide_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
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

  // Sync auth state with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as User;
            setCurrentUser(data);
          } else {
            // New user from Google
            const newUser: User = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cliente',
              email: fbUser.email || '',
              role: 'CLIENTE',
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
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
          }
        } catch {
          // If Firestore network error, fallback to user from auth
          setCurrentUser((prev) => {
            if (prev && prev.email === fbUser.email) return prev;
            return {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cliente',
              email: fbUser.email || '',
              role: 'CLIENTE',
              phone: '(11) 99999-0000',
              photoURL: fbUser.photoURL || undefined,
              addresses: [],
            };
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('peptide_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('peptide_user');
    }
  }, [currentUser]);

  // Sync products, orders, employees, coupons, settings, and finances to/from Firestore in real-time
  useEffect(() => {
    try {
      const unsubProducts = onSnapshot(collection(db, 'products'), async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial products into Firestore so all clients can see them
          for (const p of INITIAL_PRODUCTS) {
            try {
              await setDoc(doc(db, 'products', p.id), p);
            } catch (e) {
              console.log('Error seeding product:', e);
            }
          }
        } else {
          const list: Product[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Product), id: d.id }));
          setProducts(list);
          localStorage.setItem('peptide_products', JSON.stringify(list));
        }
      }, (err) => console.log('Firestore products sync:', err.message));

      // Employees listener (auto-seed if empty)
      const unsubEmployees = onSnapshot(collection(db, 'employees'), async (snapshot) => {
        if (snapshot.empty) {
          for (const emp of INITIAL_EMPLOYEES) {
            try {
              await setDoc(doc(db, 'employees', emp.id), emp);
            } catch (e) {
              console.log('Error seeding employee:', e);
            }
          }
        } else {
          const list: Employee[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Employee), id: d.id }));
          setEmployees(list);
          localStorage.setItem('peptide_employees', JSON.stringify(list));
        }
      }, (err) => console.log('Firestore employees sync:', err.message));

      // Coupons listener (auto-seed if empty)
      const unsubCoupons = onSnapshot(collection(db, 'coupons'), async (snapshot) => {
        if (snapshot.empty) {
          for (const coup of INITIAL_COUPONS) {
            try {
              await setDoc(doc(db, 'coupons', coup.id), coup);
            } catch (e) {
              console.log('Error seeding coupon:', e);
            }
          }
        } else {
          const list: Coupon[] = [];
          snapshot.forEach((d) => list.push({ ...(d.data() as Coupon), id: d.id }));
          setCoupons(list);
          localStorage.setItem('peptide_coupons', JSON.stringify(list));
        }
      }, (err) => console.log('Firestore coupons sync:', err.message));

      // Settings listener (auto-seed if empty)
      const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), async (docSnap) => {
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
        } else {
          try {
            await setDoc(doc(db, 'settings', 'config'), INITIAL_SETTINGS);
          } catch (e) {
            console.log('Error seeding store settings:', e);
          }
        }
      }, (err) => console.log('Firestore settings sync:', err.message));

      // Orders listener (connected directly to real database)
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => list.push({ ...(d.data() as Order), id: d.id }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(list);
        localStorage.setItem('peptide_orders', JSON.stringify(list));
      }, (err) => console.log('Firestore orders sync:', err.message));

      // Financial transactions listener (connected directly to real database)
      const unsubFinances = onSnapshot(collection(db, 'financialTransactions'), (snapshot) => {
        const list: FinancialTransaction[] = [];
        snapshot.forEach((d) => list.push({ ...(d.data() as FinancialTransaction), id: d.id }));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFinancialTransactions(list);
        localStorage.setItem('peptide_finances', JSON.stringify(list));
      }, (err) => console.log('Firestore finances sync:', err.message));

      return () => {
        unsubProducts();
        unsubEmployees();
        unsubCoupons();
        unsubSettings();
        unsubOrders();
        unsubFinances();
      };
    } catch (err) {
      console.log('Firestore realtime listeners fallback mode:', err);
    }
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
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'employees', empId), newEmp);
    } catch (e) {
      console.log('Error saving employee to Firestore:', e);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => {
      const updated = prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp));
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
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.log('Error deleting product from Firestore:', e);
    }
  };

  const toggleProductPromotion = async (id: string, isPromotion?: boolean, discount = 15) => {
    let target: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
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
      })
    );
    showToast('Status de promoção atualizado!');

    if (target) {
      try {
        await setDoc(doc(db, 'products', id), target, { merge: true });
      } catch (e) {
        console.log('Error updating promotion in Firestore:', e);
      }
    }
  };

  const toggleProductFeatured = async (id: string) => {
    let target: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextFeatured = !p.featured;
          target = { ...p, featured: nextFeatured };
          return target;
        }
        return p;
      })
    );
    showToast('Status de destaque atualizado!');

    if (target) {
      try {
        await setDoc(doc(db, 'products', id), target, { merge: true });
      } catch (e) {
        console.log('Error updating featured in Firestore:', e);
      }
    }
  };

  const syncOfficialCatalog = async () => {
    try {
      showToast('Sincronizando catálogo oficial com o Firestore...');
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
      for (const p of products) {
        await setDoc(doc(db, 'products', p.id), p, { merge: true });
      }
      localStorage.setItem('peptide_products', JSON.stringify(products));
      showToast(`Todos os ${products.length} produtos foram salvos no banco e atualizados no site!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar produtos no Firestore:', err);
      showToast('Erro ao salvar produtos no banco de dados.');
      return false;
    }
  };

  const saveAllOrdersToCloud = async (): Promise<boolean> => {
    try {
      showToast('Sincronizando pedidos com o banco de dados...');
      for (const o of orders) {
        await setDoc(doc(db, 'orders', o.id), o, { merge: true });
      }
      localStorage.setItem('peptide_orders', JSON.stringify(orders));
      showToast(`Todos os ${orders.length} pedidos foram sincronizados no banco de dados!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar pedidos no Firestore:', err);
      showToast('Erro ao salvar pedidos no banco de dados.');
      return false;
    }
  };

  const saveAllFinancesToCloud = async (): Promise<boolean> => {
    try {
      showToast('Salvando lançamentos contábeis no banco...');
      for (const tx of financialTransactions) {
        await setDoc(doc(db, 'financialTransactions', tx.id), tx, { merge: true });
      }
      localStorage.setItem('peptide_finances', JSON.stringify(financialTransactions));
      showToast(`Livro caixa (${financialTransactions.length} lançamentos) salvo no banco!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar financeiro no Firestore:', err);
      showToast('Erro ao salvar financeiro no banco de dados.');
      return false;
    }
  };

  const saveAllEmployeesToCloud = async (): Promise<boolean> => {
    try {
      showToast('Salvando equipe e permissões no banco...');
      for (const emp of employees) {
        await setDoc(doc(db, 'employees', emp.id), emp, { merge: true });
      }
      localStorage.setItem('peptide_employees', JSON.stringify(employees));
      showToast(`Equipe (${employees.length} colaboradores) salva no banco de dados!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar equipe no Firestore:', err);
      showToast('Erro ao salvar equipe no banco de dados.');
      return false;
    }
  };

  const saveAllCouponsToCloud = async (): Promise<boolean> => {
    try {
      showToast('Salvando cupons de desconto no banco...');
      for (const coup of coupons) {
        await setDoc(doc(db, 'coupons', coup.id), coup, { merge: true });
      }
      localStorage.setItem('peptide_coupons', JSON.stringify(coupons));
      showToast(`Cupons (${coupons.length} ativos) salvos e sincronizados com a loja!`);
      return true;
    } catch (err) {
      console.error('Erro ao salvar cupons no Firestore:', err);
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
      await setDoc(doc(db, 'settings', 'config'), merged, { merge: true });
      showToast('Configurações da loja salvas no banco e aplicadas ao site em tempo real!');
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações no Firestore:', err);
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

    // Deduct inventory stock & sync to Firestore
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((item) => item.product.id === p.id);
        if (cartItem) {
          const updatedStock = Math.max(0, p.stock - cartItem.quantity);
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

    // Save to Firestore
    try {
      setDoc(doc(db, 'orders', newOrder.id), newOrder);
    } catch (e) {
      console.log('Error saving order to Firestore:', e);
    }

    // If coupon was applied, increment its usage and sync to Firestore
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
    try {
      setDoc(doc(db, 'financialTransactions', newTx.id), newTx);
    } catch (e) {
      console.log('Error saving financial transaction in Firestore:', e);
    }
    showToast('Lançamento financeiro registrado com sucesso!');
  };

  const deleteFinancialTransaction = async (id: string): Promise<void> => {
    setFinancialTransactions((prev) => prev.filter((t) => t.id !== id));
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

    // 4. Delete order document from Firestore
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      console.log('Error deleting order from Firestore:', e);
    }

    // 5. Delete linked financial transaction in Firestore if any
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

