export type ProductCategory = 'Todos' | 'Emagrecimento' | 'Saúde' | 'Beleza' | 'Desempenho';

export interface Product {
  id: string;
  name: string;
  dosage: string;
  category: 'Emagrecimento' | 'Saúde' | 'Beleza' | 'Desempenho';
  description: string;
  benefits: string[]; // 3 main bullet points
  price: number;
  originalPrice?: number; // Para exibir "De R$ 380,00 Por R$ 295,00"
  costPrice: number;
  stock: number;
  capColor: string;
  purity: string; // e.g. "99.4% HPLC"
  storage: string;
  reconstitution: string;
  imageUrl?: string;
  featured?: boolean; // Em destaque no topo do catálogo
  isPromotion?: boolean; // Em promoção com selo visual
  promotionDiscount?: number; // % de desconto exibido
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export type OrderStatus = 'Pendente' | 'Pago' | 'Em Separação' | 'Enviado' | 'Entregue' | 'Cancelado';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
  };
  address: Address;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar';
  trackingCode?: string;
  clearedManuallyAt?: string;
  clearedBy?: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'ENTRADA' | 'SAIDA';
  description: string;
  category: string;
  amount: number;
  orderId?: string;
}

export type UserRole = 'CLIENTE' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  addresses: Address[];
  photoURL?: string;
  staffRole?: string;
  isMaster?: boolean;
  permissions?: {
    canManageProducts: boolean;
    canManageOrders: boolean;
    canManageFinances: boolean;
    canManageStaff: boolean;
    canManageSettings: boolean;
  };
}

export type StaffRole = 'Administrador Geral' | 'Gerente de Estoque' | 'Atendente de Vendas' | 'Financeiro';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // Senha de acesso ao sistema
  role: StaffRole;
  status: 'Ativo' | 'Inativo';
  createdAt: string;
  permissions: {
    canManageProducts: boolean;
    canManageOrders: boolean;
    canManageFinances: boolean;
    canManageStaff: boolean;
    canManageSettings: boolean;
  };
}

export interface Coupon {
  id: string;
  code: string; // Ex: "PEPTIDE10", "PROMO50"
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // Porcentagem (10) ou valor em reais (50)
  minOrderAmount?: number; // Valor mínimo do pedido
  status: 'Ativo' | 'Inativo';
  usageCount: number;
  maxUsage?: number;
  expiresAt?: string;
  description?: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // Ex: "5511993456789"
  whatsappDisplay: string; // Ex: "(11) 99345-6789"
  supportEmail: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTagline?: string;
  heroDescription?: string;
  announcementBar: string;
  checkoutNotice: string;
  // Taxa de Entrega e Retirada
  deliveryFee: number; // Taxa de entrega fixa em R$ (ex: 30.00)
  pickupEnabled: boolean; // Permitir retirada na sede (balcão)
  pickupAddress: string; // Endereço da sede para retirada
  pickupEstimatedTime: string; // Prazo para retirada (ex: "Pronto em 2 horas úteis")
  couponsEnabled?: boolean; // Habilitar ou desabilitar cupons no site
}

