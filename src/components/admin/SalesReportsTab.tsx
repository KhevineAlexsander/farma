import React, { useState, useMemo } from 'react';
import {
  Package,
  Trophy,
  RefreshCw,
  Search,
  Phone,
  Mail,
  ArrowUpRight,
  Filter,
  Send,
  Copy,
  Check,
  X,
  MessageSquare,
  Sparkles,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Layers,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Flame,
  BarChart3,
  Calendar,
  Users,
  Edit3,
  Eye,
  ExternalLink,
  Truck,
  ChevronRight,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';

export interface SalesReportsTabProps {
  onOpenEditOrder?: (orderId: string) => void;
}

export const SalesReportsTab: React.FC<SalesReportsTabProps> = ({ onOpenEditOrder }) => {
  const { orders, products, storeSettings, saveAllOrdersToCloud, showToast, updateOrderStatus } = useApp();

  // Period and Status filters
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all'>('month');
  const [statusFilterMode, setStatusFilterMode] = useState<'confirmed_paid' | 'all_active' | 'fully_paid' | 'pending'>('confirmed_paid');
  
  // Product Search & Category Filter
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productSortBy, setProductSortBy] = useState<'qty' | 'revenue' | 'stock'>('qty');

  // Customer Ranking Filter & Discreet Collapse State
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerRankingExpanded, setIsCustomerRankingExpanded] = useState<boolean>(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal: View and edit orders for a specific selected product
  const [selectedProductForOrders, setSelectedProductForOrders] = useState<{
    id?: string;
    name: string;
    dosage?: string;
    category?: string;
    qtySold: number;
    qtyConfirmed: number;
    qtyPending: number;
    totalRevenue: number;
    currentStock?: number;
    ordersCount: number;
  } | null>(null);
  const [productOrdersStatusFilter, setProductOrdersStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [productOrdersSearch, setProductOrdersSearch] = useState('');

  // WhatsApp Summary Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(() => {
    return localStorage.getItem('last_sales_report_wa_phone') || storeSettings.whatsappNumber || '';
  });
  const [includeCustomerRankingInWhatsApp, setIncludeCustomerRankingInWhatsApp] = useState<boolean>(false);
  const [whatsAppTopProductsLimit, setWhatsAppTopProductsLimit] = useState<number>(5);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Period statistics before status filter (to display exact counts of pending vs confirmed in the time window)
  const periodOrdersStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const timeMatched = orders.filter((order) => {
      if (order.status === 'Cancelado') return false;
      if (timeFilter !== 'all') {
        const orderTime = new Date(order.createdAt || Date.now()).getTime();
        if (timeFilter === 'today') {
          if (orderTime < startOfToday.getTime() || orderTime > endOfToday.getTime()) return false;
        } else if (timeFilter === 'yesterday') {
          if (orderTime < startOfYesterday.getTime() || orderTime > endOfYesterday.getTime()) return false;
        } else if (timeFilter === 'week') {
          if (orderTime < sevenDaysAgo.getTime()) return false;
        } else if (timeFilter === 'month') {
          if (orderTime < startOfCurrentMonth.getTime()) return false;
        } else if (timeFilter === 'last_month') {
          if (orderTime < startOfLastMonth.getTime() || orderTime > endOfLastMonth.getTime()) return false;
        }
      }
      return true;
    });

    const pendingCount = timeMatched.filter((o) => o.status === 'Pendente').length;
    const confirmedCount = timeMatched.filter((o) => o.status !== 'Pendente').length;
    const fullyPaidCount = timeMatched.filter((o) => ['Pago', 'Entregue'].includes(o.status)).length;
    const totalActiveCount = timeMatched.length;

    return {
      pendingCount,
      confirmedCount,
      fullyPaidCount,
      totalActiveCount,
      timeMatched,
    };
  }, [orders, timeFilter]);

  // Real-time filtering of orders
  const filteredOrders = useMemo(() => {
    return periodOrdersStats.timeMatched.filter((order) => {
      // 1. Status Filter
      if (statusFilterMode === 'confirmed_paid') {
        // Pedidos com pagamento aprovado ou em andamento logístico (Sem Pendentes)
        if (!['Pago', 'Pago Parcial', 'Em Separação', 'Enviado', 'Entregue'].includes(order.status)) {
          return false;
        }
      } else if (statusFilterMode === 'fully_paid') {
        if (!['Pago', 'Entregue'].includes(order.status)) {
          return false;
        }
      } else if (statusFilterMode === 'pending') {
        if (order.status !== 'Pendente') {
          return false;
        }
      }
      // 'all_active' includes all except Cancelado (Com Pendentes)
      return true;
    });
  }, [periodOrdersStats, statusFilterMode]);

  // Overall Financial & Volume metrics in real time
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalPaidInCash = 0;
    let totalPendingBalance = 0;
    let totalDiscount = 0;
    let totalShipping = 0;
    const paymentMethodsCount: Record<string, { count: number; total: number }> = {};

    filteredOrders.forEach((order) => {
      const orderTotal = order.total || 0;
      totalRevenue += orderTotal;
      totalDiscount += order.discount || 0;
      totalShipping += order.shipping || 0;

      // Calculate paid and remaining amounts
      if (order.paidAmount !== undefined) {
        totalPaidInCash += Number(order.paidAmount) || 0;
        totalPendingBalance += Number(order.remainingAmount) || Math.max(0, orderTotal - (Number(order.paidAmount) || 0));
      } else if (['Pago', 'Entregue', 'Em Separação', 'Enviado'].includes(order.status)) {
        totalPaidInCash += orderTotal;
      } else {
        totalPendingBalance += orderTotal;
      }

      // Track Payment Methods
      const method = order.paymentMethod || 'A Combinar';
      if (!paymentMethodsCount[method]) {
        paymentMethodsCount[method] = { count: 0, total: 0 };
      }
      paymentMethodsCount[method].count += 1;
      paymentMethodsCount[method].total += orderTotal;
    });

    const ordersCount = filteredOrders.length;
    const averageTicket = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    return {
      totalRevenue,
      totalPaidInCash,
      totalPendingBalance,
      totalDiscount,
      totalShipping,
      ordersCount,
      averageTicket,
      paymentMethodsCount,
    };
  }, [filteredOrders]);

  // --- 1. PRODUTOS QUE MAIS SAEM (FOCO PRINCIPAL DO RELATÓRIO) ---
  const { rankedProducts, totalUnitsSold, categoriesList } = useMemo(() => {
    const productMap = new Map<
      string,
      {
        id?: string;
        name: string;
        dosage: string;
        category: string;
        qtySold: number;
        qtyConfirmed: number;
        qtyPending: number;
        totalRevenue: number;
        revenueConfirmed: number;
        revenuePending: number;
        ordersCount: number;
        currentStock?: number;
        unitPriceAverage: number;
        imageUrl?: string;
      }
    >();

    const categoriesSet = new Set<string>();

    filteredOrders.forEach((order) => {
      const items = order.items || [];
      const orderProductsInThisOrder = new Set<string>();
      const isPendingOrder = order.status === 'Pendente';

      items.forEach((item) => {
        const prodName = (item.product?.name || (item as any).name || 'Produto').trim();
        const dosage = (item.product?.dosage || (item as any).dosage || '').trim();
        const category = (item.product?.category || (item as any).category || 'Geral').trim();
        if (category) categoriesSet.add(category);

        // Normalize matching key
        const key = `${prodName.toUpperCase()}_${dosage.toUpperCase()}`;

        // Find match in catalog for accurate real-time stock
        const matchedProduct = products.find(
          (p) =>
            p.name.trim().toUpperCase() === prodName.toUpperCase() &&
            (!dosage || p.dosage.trim().toUpperCase() === dosage.toUpperCase())
        );

        const itemQty = Math.max(1, Number(item.quantity) || 1);
        const itemPrice = Number(item.product?.price) || Number((item as any).price) || (itemQty > 0 ? (order.subtotal || order.total) / (items.length || 1) : 0);
        const itemLineTotal = itemPrice * itemQty;

        const existing = productMap.get(key) || {
          id: item.product?.id || matchedProduct?.id,
          name: prodName,
          dosage: dosage || (matchedProduct?.dosage ?? ''),
          category: matchedProduct?.category || category,
          qtySold: 0,
          qtyConfirmed: 0,
          qtyPending: 0,
          totalRevenue: 0,
          revenueConfirmed: 0,
          revenuePending: 0,
          ordersCount: 0,
          currentStock: matchedProduct?.stock,
          unitPriceAverage: itemPrice,
          imageUrl: item.product?.imageUrl || matchedProduct?.imageUrl,
        };

        existing.qtySold += itemQty;
        existing.totalRevenue += itemLineTotal;

        if (isPendingOrder) {
          existing.qtyPending += itemQty;
          existing.revenuePending += itemLineTotal;
        } else {
          existing.qtyConfirmed += itemQty;
          existing.revenueConfirmed += itemLineTotal;
        }

        if (!orderProductsInThisOrder.has(key)) {
          existing.ordersCount += 1;
          orderProductsInThisOrder.add(key);
        }

        productMap.set(key, existing);
      });
    });

    const list = Array.from(productMap.values()).map((p) => ({
      ...p,
      unitPriceAverage: p.qtySold > 0 ? p.totalRevenue / p.qtySold : 0,
    }));

    const totalUnits = list.reduce((acc, p) => acc + p.qtySold, 0);

    // Filter & Sort
    const filteredList = list
      .filter((p) => {
        if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
        if (!productSearch.trim()) return true;
        const q = productSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.dosage.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (productSortBy === 'qty') {
          return b.qtySold - a.qtySold || b.totalRevenue - a.totalRevenue;
        } else if (productSortBy === 'revenue') {
          return b.totalRevenue - a.totalRevenue || b.qtySold - a.qtySold;
        } else if (productSortBy === 'stock') {
          return (a.currentStock ?? 999) - (b.currentStock ?? 999);
        }
        return b.qtySold - a.qtySold;
      });

    return {
      rankedProducts: filteredList,
      totalUnitsSold: totalUnits,
      categoriesList: Array.from(categoriesSet).sort(),
    };
  }, [filteredOrders, products, productSearch, selectedCategory, productSortBy]);

  const maxProductQty = rankedProducts.length > 0 ? Math.max(...rankedProducts.map((p) => p.qtySold), 1) : 1;
  const top3Products = rankedProducts.slice(0, 3);

  // --- 2. QUEM COMPRA MAIS (RANKING DISCRETO & COMPACTO) ---
  const rankedCustomers = useMemo(() => {
    const customerMap = new Map<
      string,
      {
        name: string;
        email: string;
        phone: string;
        cpf?: string;
        ordersCount: number;
        totalSpent: number;
        lastOrderDate: string;
      }
    >();

    filteredOrders.forEach((order) => {
      const name = order.customer?.name || (order as any).customerName || 'Cliente';
      const email = order.customer?.email || (order as any).customerEmail || '';
      const phone = order.customer?.phone || (order as any).customerPhone || '';
      const cpf = order.customer?.cpf || '';

      const key = (phone || email || name).toLowerCase().trim();

      const existing = customerMap.get(key) || {
        name,
        email,
        phone,
        cpf,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: order.createdAt || '',
      };

      existing.ordersCount += 1;
      existing.totalSpent += order.total || 0;

      if (order.createdAt && (!existing.lastOrderDate || new Date(order.createdAt) > new Date(existing.lastOrderDate))) {
        existing.lastOrderDate = order.createdAt;
      }

      customerMap.set(key, existing);
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .filter((c) => {
        if (!customerSearch.trim()) return true;
        const q = customerSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.cpf && c.cpf.includes(q))
        );
      });
  }, [filteredOrders, customerSearch]);

  const handleSync = async () => {
    setIsSyncing(true);
    await saveAllOrdersToCloud();
    setIsSyncing(false);
    showToast('Relatório de vendas atualizado com a nuvem!');
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-amber-500/20">
          1º
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-slate-300/20">
          2º
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-amber-700/20">
          3º
        </span>
      );
    }
    return (
      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
        {index + 1}º
      </span>
    );
  };

  const formatWhatsAppLink = (phone: string, customerName: string) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return null;
    const fullNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const msg = encodeURIComponent(`Olá ${customerName}, tudo bem? Aqui é da equipe da ${storeSettings.storeName || 'Peptide Imports'}!`);
    return `https://wa.me/${fullNumber}?text=${msg}`;
  };

  // WhatsApp Sales Summary Generator (Customer ranking is OPTIONAL)
  const generateSalesSummaryText = () => {
    const brand = storeSettings.storeName || 'PEPTIDE IMPORTS FARMA';
    const periodLabel =
      timeFilter === 'today'
        ? 'Hoje'
        : timeFilter === 'yesterday'
        ? 'Ontem'
        : timeFilter === 'week'
        ? 'Últimos 7 Dias'
        : timeFilter === 'month'
        ? 'Mês Atual'
        : timeFilter === 'last_month'
        ? 'Mês Anterior'
        : 'Geral (Todo o Histórico)';

    const statusLabel =
      statusFilterMode === 'confirmed_paid'
        ? 'Apenas Pedidos Pagos & Em Andamento'
        : statusFilterMode === 'fully_paid'
        ? 'Apenas 100% Quitados'
        : statusFilterMode === 'pending'
        ? 'Apenas Pendentes'
        : 'Todos os Pedidos Ativos';

    const nowFormatted = new Date().toLocaleString('pt-BR');

    let text = `📊 *RELATÓRIO DE VENDAS - ${brand}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📅 *Período:* ${periodLabel}\n`;
    text += `🏷️ *Filtro:* ${statusLabel}\n`;
    text += `🕒 *Gerado em:* ${nowFormatted}\n\n`;

    text += `💰 *RESUMO GERAL:* \n`;
    text += `• *Faturamento Total:* R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `• *Total de Pedidos:* ${metrics.ordersCount} pedido(s)\n`;
    text += `• *Frascos/Unidades Vendidas:* ${totalUnitsSold} un.\n`;
    text += `• *Ticket Médio por Pedido:* R$ ${metrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    if (metrics.totalPendingBalance > 0) {
      text += `• *Saldo a Receber (Parcial):* R$ ${metrics.totalPendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    }

    text += `\n📦 *PRODUTOS MAIS VENDIDOS (RANKING DE SAÍDA):*\n`;
    if (rankedProducts.length === 0) {
      text += `_Nenhum produto computado no período selecionado_\n`;
    } else {
      const listToShow = whatsAppTopProductsLimit > 0 ? rankedProducts.slice(0, whatsAppTopProductsLimit) : rankedProducts;
      listToShow.forEach((prod, idx) => {
        const dosageStr = prod.dosage ? ` (${prod.dosage})` : '';
        const pct = totalUnitsSold > 0 ? ((prod.qtySold / totalUnitsSold) * 100).toFixed(1) : '0';
        text += `${idx + 1}º *${prod.name}${dosageStr}*\n`;
        text += `   └ *${prod.qtySold} un.* vendidas (${pct}%) • R$ ${prod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      });
      if (rankedProducts.length > listToShow.length) {
        text += `_... e mais ${rankedProducts.length - listToShow.length} produto(s) vendidos_\n`;
      }
    }

    // Optional Top Buyers / Customer Ranking
    if (includeCustomerRankingInWhatsApp) {
      text += `\n👥 *TOP COMPRADORES (CLIENTES):*\n`;
      if (rankedCustomers.length === 0) {
        text += `_Nenhum cliente registrado no período_\n`;
      } else {
        rankedCustomers.slice(0, 5).forEach((cust, idx) => {
          text += `${idx + 1}º *${cust.name}*: R$ ${cust.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cust.ordersCount} ped.)\n`;
        });
      }
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Peptide Imports ERP - Controle em Tempo Real_`;
    return text;
  };

  const handleSendSummaryToWhatsApp = () => {
    if (!whatsAppPhone.trim()) {
      showToast('Informe um número de WhatsApp com DDD.');
      return;
    }

    const cleanNumber = whatsAppPhone.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      showToast('Digite um número válido com DDD (ex: 11987654321).');
      return;
    }

    localStorage.setItem('last_sales_report_wa_phone', whatsAppPhone);

    const fullNumber = cleanNumber.startsWith('55') && cleanNumber.length >= 12 ? cleanNumber : `55${cleanNumber}`;
    const text = generateSalesSummaryText();
    const encodedText = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodedText}`;

    window.open(waUrl, '_blank');
    setIsWhatsAppModalOpen(false);
    showToast('Abrindo WhatsApp com o relatório de vendas!');
  };

  const handleCopySummary = async () => {
    try {
      const text = generateSalesSummaryText();
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      showToast('Relatório copiado para a área de transferência!');
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      showToast('Não foi possível copiar o texto automaticamente.');
    }
  };

  // Matching orders for the product currently inspected
  const productOrdersDetails = useMemo(() => {
    if (!selectedProductForOrders) {
      return { allOrders: [], pendingCount: 0, confirmedCount: 0, totalUnits: 0, totalRevenue: 0 };
    }

    const targetName = (selectedProductForOrders.name || '').toLowerCase().trim();
    const targetDosage = (selectedProductForOrders.dosage || '').toLowerCase().trim();

    // Check all time-matched orders in the current period window
    const matches: Array<{
      order: Order;
      itemQty: number;
      itemPrice: number;
      itemSubtotal: number;
      otherItemsCount: number;
    }> = [];

    (periodOrdersStats.timeMatched || []).forEach((ord) => {
      const items = ord.items || [];
      const matchedItems = items.filter((it) => {
        const pName = (it.product?.name || (it as any).name || '').toLowerCase().trim();
        const pDosage = (it.product?.dosage || (it as any).dosage || '').toLowerCase().trim();

        if (selectedProductForOrders.id && it.product?.id === selectedProductForOrders.id) {
          return true;
        }
        return pName === targetName && pDosage === targetDosage;
      });

      if (matchedItems.length > 0) {
        const itemQty = matchedItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
        const itemPrice = Number(matchedItems[0]?.product?.price) || Number((matchedItems[0] as any)?.price) || 0;
        const itemSubtotal = itemPrice * itemQty;
        const otherItemsCount = items.length - matchedItems.length;

        matches.push({
          order: ord,
          itemQty,
          itemPrice,
          itemSubtotal,
          otherItemsCount,
        });
      }
    });

    const pendingCount = matches.filter((m) => m.order.status === 'Pendente').length;
    const confirmedCount = matches.filter((m) => m.order.status !== 'Pendente').length;
    const totalUnits = matches.reduce((acc, m) => acc + m.itemQty, 0);
    const totalRevenue = matches.reduce((acc, m) => acc + m.itemSubtotal, 0);

    return {
      allOrders: matches,
      pendingCount,
      confirmedCount,
      totalUnits,
      totalRevenue,
    };
  }, [selectedProductForOrders, periodOrdersStats.timeMatched]);

  const filteredProductOrders = useMemo(() => {
    if (!productOrdersDetails.allOrders) return [];

    return productOrdersDetails.allOrders.filter(({ order }) => {
      if (productOrdersStatusFilter === 'pending' && order.status !== 'Pendente') {
        return false;
      }
      if (productOrdersStatusFilter === 'confirmed' && order.status === 'Pendente') {
        return false;
      }

      if (productOrdersSearch.trim()) {
        const term = productOrdersSearch.toLowerCase().trim();
        const custName = (order.customer?.name || '').toLowerCase();
        const custPhone = (order.customer?.phone || '').toLowerCase();
        const orderNum = (order.orderNumber || order.id || '').toLowerCase();
        return custName.includes(term) || custPhone.includes(term) || orderNum.includes(term);
      }

      return true;
    });
  }, [productOrdersDetails.allOrders, productOrdersStatusFilter, productOrdersSearch]);

  const handleOpenOrderInEdit = (orderId: string) => {
    setSelectedProductForOrders(null);
    if (onOpenEditOrder) {
      onOpenEditOrder(orderId);
    } else {
      showToast('Abrindo pedido no painel...');
    }
  };

  const handleQuickMarkPaid = (orderId: string, orderNum: string) => {
    updateOrderStatus(orderId, 'Pago');
    showToast(`Pedido ${orderNum} marcado como Pago!`);
  };

  const getCustomerWhatsappUrl = (order: Order) => {
    const rawPhone = order.customer?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phoneWithDdi = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const orderNum = order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`;
    const message = encodeURIComponent(
      `Olá ${order.customer?.name || 'Cliente'}, tudo bem? Aqui é da Peptide Imports a respeito do seu pedido ${orderNum}!`
    );
    return `https://wa.me/${phoneWithDdi}?text=${message}`;
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente':
        return { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Pendente', icon: Clock };
      case 'Pago':
        return { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Pago', icon: CheckCircle };
      case 'Pago Parcial':
        return { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', label: 'Pago Parcial', icon: DollarSign };
      case 'Em Separação':
        return { bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30', label: 'Em Separação', icon: Package };
      case 'Enviado':
        return { bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', label: 'Enviado', icon: Truck };
      case 'Entregue':
        return { bg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40', label: 'Entregue', icon: CheckCircle2 };
      default:
        return { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: status, icon: Clock };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 w-full overflow-hidden">
      
      {/* Top Filter Bar & Real-Time Sync */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0 shadow-md shadow-cyan-500/10">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                  Relatório de Vendas em Tempo Real
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Métricas atualizadas automaticamente a cada pedido registrado.
              </p>
            </div>
          </div>

          {/* Controls: Periods & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
            {/* Period Selector */}
            <div className="grid grid-cols-3 sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: 'week', label: '7 Dias' },
                { id: 'month', label: 'Este Mês' },
                { id: 'last_month', label: 'Mês Passado' },
                { id: 'all', label: 'Tudo' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeFilter(t.id as any)}
                  className={`py-1.5 px-2 sm:px-3 rounded-lg text-xs font-bold text-center transition-all cursor-pointer min-h-[36px] sm:min-h-0 flex items-center justify-center ${
                    timeFilter === t.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white active:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* WhatsApp Report Button */}
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer min-h-[38px] shrink-0"
              title="Gerar relatório formatado e enviar para o WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="hidden sm:inline">Relatório WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0 self-center sm:self-auto"
              title="Atualizar dados em tempo real"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* BOTÕES DE CONTROLE: COM PEDIDOS PENDENTES VS SEM PEDIDOS PENDENTES */}
        {/* ------------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filtro de Pedidos no Relatório:</span>
          </div>

          {/* Segmented Button Bar for Pending vs Confirmed */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            
            {/* 1. SEM PEDIDOS PENDENTES (APENAS CONFIRMADOS) */}
            <button
              onClick={() => setStatusFilterMode('confirmed_paid')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                statusFilterMode === 'confirmed_paid'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Mostrar apenas pedidos confirmados e pagos (exclui pedidos pendentes)"
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Sem Pendentes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                statusFilterMode === 'confirmed_paid' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
              }`}>
                {periodOrdersStats.confirmedCount}
              </span>
            </button>

            {/* 2. COM PEDIDOS PENDENTES (TOTAL DE DEMANDA) */}
            <button
              onClick={() => setStatusFilterMode('all_active')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                statusFilterMode === 'all_active'
                  ? 'bg-purple-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Mostrar todos os produtos incluindo os que estão em pedidos pendentes"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Com Pendentes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                statusFilterMode === 'all_active' ? 'bg-white/20 text-white font-bold' : 'bg-slate-900 text-slate-400'
              }`}>
                {periodOrdersStats.totalActiveCount}
              </span>
            </button>

            {/* 3. APENAS PEDIDOS PENDENTES */}
            <button
              onClick={() => setStatusFilterMode('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                statusFilterMode === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Mostrar exclusivamente a demanda de produtos em pedidos pendentes aguardando baixa"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Apenas Pendentes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                statusFilterMode === 'pending' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400/80'
              }`}>
                {periodOrdersStats.pendingCount}
              </span>
            </button>

          </div>
        </div>

        {/* Real-Time KPI Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
          
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Faturamento
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-emerald-400 font-mono">
                R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              Unidades Vendidas
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-cyan-300 font-mono">
                {totalUnitsSold} <span className="text-xs font-normal text-slate-400">frascos</span>
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
              Pedidos no Filtro
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-purple-300 font-mono">
                {metrics.ordersCount} <span className="text-xs font-normal text-slate-400">pedidos</span>
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Ticket Médio
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-amber-300 font-mono">
                R$ {metrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          SEÇÃO PRINCIPAL: RELATÓRIO DOS PRODUTOS QUE MAIS SAEM (DESTAQUE MÁXIMO)
         ========================================================================= */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-5">
        
        {/* Section Header & Quick Switch Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl">
                <Package className="w-5 h-5" />
              </span>
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Produtos Mais Vendidos (Saída de Estoque)
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-slate-400">
                Análise detalhada de volume de saída, faturamento por frasco e share de vendas.
              </p>
              
              {/* Active Mode Tag */}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                statusFilterMode === 'confirmed_paid'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : statusFilterMode === 'all_active'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                {statusFilterMode === 'confirmed_paid' && <CheckCircle className="w-3 h-3 text-cyan-400" />}
                {statusFilterMode === 'all_active' && <Layers className="w-3 h-3 text-purple-400" />}
                {statusFilterMode === 'pending' && <Clock className="w-3 h-3 text-amber-400" />}
                {statusFilterMode === 'confirmed_paid'
                  ? 'Modo: Sem Pendentes (Apenas Confirmados)'
                  : statusFilterMode === 'all_active'
                  ? 'Modo: Com Pedidos Pendentes Incluídos'
                  : 'Modo: Apenas Pedidos Pendentes'}
              </span>
            </div>
          </div>

          {/* Quick Action Toggle Button & Search / Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick Toggle Button between With Pending and Without Pending */}
            {statusFilterMode === 'confirmed_paid' ? (
              <button
                onClick={() => setStatusFilterMode('all_active')}
                className="px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Alternar para ver com os produtos em pedidos pendentes incluídos"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Ver COM Pendentes ({periodOrdersStats.pendingCount})</span>
              </button>
            ) : (
              <button
                onClick={() => setStatusFilterMode('confirmed_paid')}
                className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Alternar para ver sem os produtos em pedidos pendentes"
              >
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>✓ Ver SEM Pendentes (Confirmados)</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 min-h-[38px]"
              />
            </div>

            {/* Category selector */}
            {categoriesList.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[38px] cursor-pointer"
              >
                <option value="all">Todas Categorias</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Sort options */}
            <select
              value={productSortBy}
              onChange={(e) => setProductSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[38px] cursor-pointer"
            >
              <option value="qty">Ordenar por Quantidade (Mais Saem)</option>
              <option value="revenue">Ordenar por Faturamento (R$)</option>
              <option value="stock">Ordenar por Estoque Atual</option>
            </select>
          </div>
        </div>

        {/* Podium Top 3 Products Showcase */}
        {top3Products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {top3Products.map((prod, idx) => {
              const shareOfVolume = totalUnitsSold > 0 ? ((prod.qtySold / totalUnitsSold) * 100).toFixed(1) : '0';
              const shareOfRevenue = metrics.totalRevenue > 0 ? ((prod.totalRevenue / metrics.totalRevenue) * 100).toFixed(1) : '0';

              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              const borderClass = isFirst
                ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-900 shadow-amber-500/5'
                : isSecond
                ? 'border-slate-400/30 bg-gradient-to-br from-slate-800/30 via-slate-950 to-slate-900'
                : 'border-amber-700/30 bg-gradient-to-br from-amber-950/15 via-slate-950 to-slate-900';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${borderClass} shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getRankBadge(idx)}
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                          {isFirst ? '🏆 Campeão de Vendas' : isSecond ? '🥈 2º Mais Vendido' : '🥉 3º Mais Vendido'}
                        </span>
                        <h5 className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate">
                          {prod.name}
                        </h5>
                      </div>
                    </div>

                    {prod.dosage && (
                      <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs rounded-md shrink-0">
                        {prod.dosage}
                      </span>
                    )}
                  </div>

                  {/* Big metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                    <div className="p-2 bg-slate-900/80 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Volume Saída:</span>
                      <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                        {prod.qtySold} un.
                      </span>
                      {statusFilterMode === 'all_active' && prod.qtyPending > 0 ? (
                        <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                          <span className="text-emerald-400 font-bold block">{prod.qtyConfirmed} conf.</span>
                          <span className="text-purple-300 font-bold block">+{prod.qtyPending} pend.</span>
                        </div>
                      ) : statusFilterMode === 'pending' ? (
                        <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                          100% pendente
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {shareOfVolume}% do total
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-slate-900/80 rounded-xl text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Faturamento:</span>
                      <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                        R$ {prod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {statusFilterMode === 'all_active' && prod.revenuePending > 0 ? (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          R$ {prod.revenueConfirmed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} conf.
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {shareOfRevenue}% da receita
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock and Average Ticket Footer */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/60">
                    <span>
                      Estoque Atual:{' '}
                      <strong className={typeof prod.currentStock === 'number' && prod.currentStock <= 5 ? 'text-amber-400' : 'text-slate-200'}>
                        {typeof prod.currentStock === 'number' ? `${prod.currentStock} un.` : '—'}
                      </strong>
                    </span>
                    <span className="font-mono text-slate-300">
                      Média: R$ {prod.unitPriceAverage.toFixed(2).replace('.', ',')}/un
                    </span>
                  </div>

                  {/* Button to view orders containing this product and edit them */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductForOrders({
                        id: prod.id,
                        name: prod.name,
                        dosage: prod.dosage,
                        category: prod.category,
                        qtySold: prod.qtySold,
                        qtyConfirmed: prod.qtyConfirmed,
                        qtyPending: prod.qtyPending,
                        totalRevenue: prod.totalRevenue,
                        currentStock: prod.currentStock,
                        ordersCount: prod.ordersCount,
                      });
                      setProductOrdersStatusFilter('all');
                      setProductOrdersSearch('');
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ver Pedidos ({prod.ordersCount}) & Editar</span>
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Complete Ranked Products List / Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Listagem completa de produtos vendidos ({rankedProducts.length})</span>
            <span>Total de Frascos: <strong className="text-cyan-300 font-mono font-bold">{totalUnitsSold}</strong></span>
          </div>

          {rankedProducts.length === 0 ? (
            <div className="text-center py-12 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-xs">
              Nenhum produto vendido com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {rankedProducts.map((prod, idx) => {
                const qtyPercent = Math.min(100, Math.round((prod.qtySold / maxProductQty) * 100));
                const shareOfTotalVolume = totalUnitsSold > 0 ? ((prod.qtySold / totalUnitsSold) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedProductForOrders({
                        id: prod.id,
                        name: prod.name,
                        dosage: prod.dosage,
                        category: prod.category,
                        qtySold: prod.qtySold,
                        qtyConfirmed: prod.qtyConfirmed,
                        qtyPending: prod.qtyPending,
                        totalRevenue: prod.totalRevenue,
                        currentStock: prod.currentStock,
                        ordersCount: prod.ordersCount,
                      });
                      setProductOrdersStatusFilter('all');
                      setProductOrdersSearch('');
                    }}
                    className="bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/40 rounded-2xl p-3.5 sm:p-4 transition-all space-y-2.5 shadow-sm cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Product details */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        {getRankBadge(idx)}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h5 className="font-extrabold text-white text-xs sm:text-sm tracking-tight break-words group-hover:text-cyan-300 transition-colors">
                              {prod.name}
                            </h5>
                            {prod.dosage && (
                              <span className="px-1.5 py-0.5 bg-slate-900 text-cyan-400 font-mono font-bold text-[10px] rounded border border-slate-800">
                                {prod.dosage}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span className="text-slate-500">{prod.category}</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProductForOrders({
                                  id: prod.id,
                                  name: prod.name,
                                  dosage: prod.dosage,
                                  category: prod.category,
                                  qtySold: prod.qtySold,
                                  qtyConfirmed: prod.qtyConfirmed,
                                  qtyPending: prod.qtyPending,
                                  totalRevenue: prod.totalRevenue,
                                  currentStock: prod.currentStock,
                                  ordersCount: prod.ordersCount,
                                });
                                setProductOrdersStatusFilter('all');
                                setProductOrdersSearch('');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Ver os pedidos que contêm este produto"
                            >
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span>Presente em <strong className="text-white">{prod.ordersCount}</strong> pedido(s)</span>
                              <span className="text-cyan-400 ml-0.5 font-bold">→ Ver & Editar</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sold quantity & Revenue + Action Button */}
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                            {prod.qtySold}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            {prod.qtySold === 1 ? 'frasco' : 'frascos'}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          R$ {prod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        
                        {/* Pending vs Confirmed Details */}
                        {statusFilterMode === 'all_active' && prod.qtyPending > 0 && (
                          <div className="flex items-center gap-1.5 justify-end text-[10px] mt-0.5 font-mono">
                            <span className="text-emerald-400 font-semibold">{prod.qtyConfirmed} conf.</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-purple-300 font-semibold">+{prod.qtyPending} pend.</span>
                          </div>
                        )}
                        {statusFilterMode === 'pending' && (
                          <span className="text-[10px] text-amber-400 font-mono font-semibold block mt-0.5">
                            Aguardando baixa
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductForOrders({
                              id: prod.id,
                              name: prod.name,
                              dosage: prod.dosage,
                              category: prod.category,
                              qtySold: prod.qtySold,
                              qtyConfirmed: prod.qtyConfirmed,
                              qtyPending: prod.qtyPending,
                              totalRevenue: prod.totalRevenue,
                              currentStock: prod.currentStock,
                              ordersCount: prod.ordersCount,
                            });
                            setProductOrdersStatusFilter('all');
                            setProductOrdersSearch('');
                          }}
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 group-hover:text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          <Edit3 className="w-3 h-3 text-cyan-400" />
                          <span>Ver Pedidos</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-300" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Sales Volume Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${qtyPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stock & Unit Economics Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pt-1.5 border-t border-slate-900 text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>
                          Participação no volume total: <strong className="text-cyan-300 font-mono">{shareOfTotalVolume}%</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Estoque disponível:{' '}
                          <strong
                            className={
                              typeof prod.currentStock === 'number' && prod.currentStock <= 5
                                ? 'text-amber-400 font-bold'
                                : 'text-slate-200 font-bold'
                            }
                          >
                            {typeof prod.currentStock === 'number' ? `${prod.currentStock} un.` : '—'}
                          </strong>
                        </span>
                      </div>

                      <span className="font-mono text-slate-300">
                        Preço Médio Praticado: R$ {prod.unitPriceAverage.toFixed(2).replace('.', ',')}/un
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 2: RANKING DE QUEM MAIS COMPRA (DISCRETO & COMPACTO)
         ========================================================================= */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
        
        {/* Toggleable Accordion Header */}
        <div
          onClick={() => setIsCustomerRankingExpanded(!isCustomerRankingExpanded)}
          className="flex items-center justify-between cursor-pointer select-none py-1"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-slate-800 text-slate-400 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-200">
                  Ranking de Clientes (Quem Mais Compra)
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                  {rankedCustomers.length} clientes
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Visualização secundária e discreta dos maiores compradores.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-xs font-semibold"
          >
            <span>{isCustomerRankingExpanded ? 'Recolher' : 'Expandir'}</span>
            {isCustomerRankingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Customer List */}
        {isCustomerRankingExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
            
            {/* Search customer input */}
            <div className="relative max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou WhatsApp..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700 min-h-[36px]"
              />
            </div>

            {rankedCustomers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhum cliente registrado no período selecionado.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                {rankedCustomers.map((cust, idx) => {
                  const waLink = formatWhatsAppLink(cust.phone, cust.name);

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}º
                        </span>
                        <div className="min-w-0 flex-1">
                          <h6 className="font-bold text-slate-200 truncate">{cust.name}</h6>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 truncate">
                            {cust.phone && <span>{cust.phone}</span>}
                            <span>•</span>
                            <span>{cust.ordersCount} pedido(s)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 block text-xs">
                            R$ {cust.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Última: {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString('pt-BR') : '—'}
                          </span>
                        </div>

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: PEDIDOS QUE CONTÊM O PRODUTO SELECIONADO (DRILL-DOWN & EDIÇÃO)
         ========================================================================= */}
      {selectedProductForOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-2xl my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-800 shrink-0 gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 shrink-0 mt-0.5">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                      {selectedProductForOrders.name}
                    </h3>
                    {selectedProductForOrders.dosage && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs rounded-md border border-cyan-500/30">
                        {selectedProductForOrders.dosage}
                      </span>
                    )}
                    {selectedProductForOrders.category && (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[11px] rounded-md border border-slate-700">
                        {selectedProductForOrders.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                    Listando todos os pedidos do período que contêm este produto. Clique em qualquer pedido para editar diretamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductForOrders(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Performance Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-b border-slate-800 shrink-0">
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total no Período</span>
                <span className="text-base sm:text-lg font-black font-mono text-cyan-300">
                  {productOrdersDetails.totalUnits} un.
                </span>
                <span className="text-[10px] text-slate-500 block">frascos vendidos</span>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturamento Item</span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                  R$ {productOrdersDetails.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 block">receita gerada</span>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de Pedidos</span>
                <span className="text-base sm:text-lg font-black font-mono text-white">
                  {productOrdersDetails.allOrders.length}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  <span className="text-emerald-400 font-bold">{productOrdersDetails.confirmedCount} conf.</span>
                  {' • '}
                  <span className="text-amber-400 font-bold">{productOrdersDetails.pendingCount} pend.</span>
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estoque em Tempo Real</span>
                <span
                  className={`text-base sm:text-lg font-black font-mono ${
                    typeof selectedProductForOrders.currentStock === 'number' && selectedProductForOrders.currentStock <= 5
                      ? 'text-amber-400'
                      : 'text-slate-200'
                  }`}
                >
                  {typeof selectedProductForOrders.currentStock === 'number'
                    ? `${selectedProductForOrders.currentStock} un.`
                    : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block">no estoque da loja</span>
              </div>
            </div>

            {/* Filter and Search Bar inside Modal */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-3 border-b border-slate-800 shrink-0">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setProductOrdersStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                    productOrdersStatusFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({productOrdersDetails.allOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProductOrdersStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    productOrdersStatusFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-amber-400/90 hover:text-amber-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendentes ({productOrdersDetails.pendingCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductOrdersStatusFilter('confirmed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    productOrdersStatusFilter === 'confirmed'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-emerald-400/90 hover:text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmados ({productOrdersDetails.confirmedCount})</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productOrdersSearch}
                  onChange={(e) => setProductOrdersSearch(e.target.value)}
                  placeholder="Buscar cliente, nº ou tel..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[38px]"
                />
                {productOrdersSearch && (
                  <button
                    type="button"
                    onClick={() => setProductOrdersSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Scrollable Orders List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 min-h-[220px]">
              {filteredProductOrders.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-slate-400 space-y-2">
                  <Package className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold">Nenhum pedido encontrado para os filtros selecionados.</p>
                  {(productOrdersStatusFilter !== 'all' || productOrdersSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductOrdersStatusFilter('all');
                        setProductOrdersSearch('');
                      }}
                      className="text-xs text-cyan-400 hover:underline font-bold"
                    >
                      Limpar filtros de busca
                    </button>
                  )}
                </div>
              ) : (
                filteredProductOrders.map(({ order, itemQty, itemPrice, itemSubtotal, otherItemsCount }) => {
                  const badge = getOrderStatusBadge(order.status);
                  const BadgeIcon = badge.icon;
                  const orderDateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : 'Data não informada';

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-3.5 sm:p-4 transition-all space-y-3 shadow-md group"
                    >
                      {/* Top Header of Order Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-extrabold text-white text-xs sm:text-sm">
                            #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${badge.bg}`}>
                            <BadgeIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            {orderDateStr}
                          </span>
                        </div>

                        {/* Primary Action Button: Open in Edit mode */}
                        <button
                          type="button"
                          onClick={() => handleOpenOrderInEdit(order.id)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                          title="Abrir este pedido diretamente na tela de edição"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Pedido</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Main Grid: Customer info + Product highlight */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Customer Info Box */}
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              Cliente
                            </span>
                            {order.customer?.phone && (
                              <a
                                href={getCustomerWhatsappUrl(order)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-colors"
                                title="Conversar no WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                          <h6 className="font-extrabold text-white text-xs sm:text-sm truncate">
                            {order.customer?.name || 'Cliente Sem Nome'}
                          </h6>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>{order.customer?.phone || 'Sem telefone'}</span>
                            {order.customer?.city && (
                              <>
                                <span>•</span>
                                <span>{order.customer.city}/{order.customer.state || ''}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Product in this order Highlight */}
                        <div className="p-3 bg-cyan-950/20 rounded-xl border border-cyan-500/30 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                            Item neste pedido:
                          </span>
                          <div className="flex items-baseline justify-between">
                            <span className="font-extrabold text-white text-sm">
                              {itemQty}x {selectedProductForOrders.name} {selectedProductForOrders.dosage || ''}
                            </span>
                            <span className="font-mono font-bold text-cyan-300 text-sm">
                              R$ {itemSubtotal.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                            <span>Preço un.: R$ {itemPrice.toFixed(2).replace('.', ',')}</span>
                            {otherItemsCount > 0 && (
                              <span className="text-slate-400 font-medium">
                                + {otherItemsCount} outro{otherItemsCount > 1 ? 's' : ''} produto{otherItemsCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Order Footer summary & secondary actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Total do Pedido:</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            R$ {Number(order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            ({order.paymentMethod || 'PIX'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.status === 'Pendente' && (
                            <button
                              type="button"
                              onClick={() => handleQuickMarkPaid(order.id, order.orderNumber || order.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Marcar como Pago sem precisar abrir o editor"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Marcar como Pago</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenOrderInEdit(order.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span>Abrir e Editar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-500">
                Mostrando {filteredProductOrders.length} de {productOrdersDetails.allOrders.length} pedidos
              </span>
              <button
                type="button"
                onClick={() => setSelectedProductForOrders(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ENVIAR RESUMO DE VENDAS PARA O WHATSAPP (RANKING CLIENTES OPCIONAL)
         ========================================================================= */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                  <MessageSquare className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Enviar Relatório de Vendas via WhatsApp
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Relatório focado nos produtos mais vendidos com opção de compradores.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto py-3.5 pr-1 flex-1 text-xs">
              
              {/* WhatsApp Destination Phone */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-slate-200 font-bold flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Número do WhatsApp de Destino:
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">com DDD (ex: 11987654321)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="Digite o número de WhatsApp..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                  {whatsAppPhone && (
                    <button
                      type="button"
                      onClick={() => setWhatsAppPhone('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Options Box: Customer Ranking Optional & Product Limit */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Opções de Formatação do Relatório:
                </span>

                {/* Pending vs Confirmed in WhatsApp Report */}
                <div className="space-y-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="font-bold text-slate-200 text-xs block">
                    Tipo de Pedidos Computados:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusFilterMode('confirmed_paid')}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        statusFilterMode === 'confirmed_paid'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Sem Pendentes ({periodOrdersStats.confirmedCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilterMode('all_active')}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        statusFilterMode === 'all_active'
                          ? 'bg-purple-500 text-white shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Com Pendentes ({periodOrdersStats.totalActiveCount})</span>
                    </button>
                  </div>
                </div>

                {/* Optional Customer Ranking Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeCustomerRankingInWhatsApp}
                    onChange={(e) => setIncludeCustomerRankingInWhatsApp(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-200 text-xs block">
                      Incluir Ranking de Maiores Compradores (Clientes)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {includeCustomerRankingInWhatsApp ? 'Ativado: O Top 5 clientes será incluído.' : 'Desativado: O relatório focará apenas nos produtos e números gerais.'}
                    </span>
                  </div>
                </label>

                {/* Top Products Limit selector */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300 font-semibold text-xs">Exibir no WhatsApp:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 3, label: 'Top 3' },
                      { id: 5, label: 'Top 5' },
                      { id: 10, label: 'Top 10' },
                      { id: 0, label: 'Todos' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWhatsAppTopProductsLimit(opt.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          whatsAppTopProductsLimit === opt.id
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Prévia do Texto Formatado
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                  {generateSalesSummaryText()}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px]"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-extrabold">Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Relatório</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSendSummaryToWhatsApp}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
              >
                <Send className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
