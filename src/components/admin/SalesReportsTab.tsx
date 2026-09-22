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
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Flame,
  BarChart3,
  Calendar,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';

export const SalesReportsTab: React.FC = () => {
  const { orders, products, storeSettings, saveAllOrdersToCloud, showToast } = useApp();

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

  // WhatsApp Summary Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(() => {
    return localStorage.getItem('last_sales_report_wa_phone') || storeSettings.whatsappNumber || '';
  });
  const [includeCustomerRankingInWhatsApp, setIncludeCustomerRankingInWhatsApp] = useState<boolean>(false);
  const [whatsAppTopProductsLimit, setWhatsAppTopProductsLimit] = useState<number>(5);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Real-time filtering of orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return orders.filter((order) => {
      // 1. Status Filter
      if (order.status === 'Cancelado') return false;

      if (statusFilterMode === 'confirmed_paid') {
        // Pedidos com pagamento aprovado ou em andamento logístico
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
      // 'all_active' includes all except Cancelado

      // 2. Time Filter
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
  }, [orders, timeFilter, statusFilterMode]);

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
        totalRevenue: number;
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

        const existing = productMap.get(key) || {
          id: item.product?.id || matchedProduct?.id,
          name: prodName,
          dosage: dosage || (matchedProduct?.dosage ?? ''),
          category: matchedProduct?.category || category,
          qtySold: 0,
          totalRevenue: 0,
          ordersCount: 0,
          currentStock: matchedProduct?.stock,
          unitPriceAverage: itemPrice,
          imageUrl: item.product?.imageUrl || matchedProduct?.imageUrl,
        };

        existing.qtySold += itemQty;
        existing.totalRevenue += itemPrice * itemQty;

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

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 w-full overflow-hidden">
      
      {/* Top Filter Bar & Real-Time Sync */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
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

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilterMode}
                onChange={(e) => setStatusFilterMode(e.target.value as any)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[38px] cursor-pointer"
                title="Filtrar status dos pedidos computados no relatório"
              >
                <option value="confirmed_paid">✓ Pagos & Em Separação / Envio</option>
                <option value="fully_paid">✓ Apenas 100% Quitados</option>
                <option value="all_active">Todos os Pedidos Ativos</option>
                <option value="pending">Apenas Pendentes (Aguardando)</option>
              </select>

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
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                title="Atualizar dados em tempo real"
              >
                <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time KPI Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-3.5 border-t border-slate-800">
          
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
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl">
                <Package className="w-5 h-5" />
              </span>
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Produtos Mais Vendidos (Saída de Estoque)
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Análise detalhada de volume de saída, faturamento por frasco e share de vendas.
            </p>
          </div>

          {/* Search, Category Filter & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
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
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {shareOfVolume}% do total
                      </span>
                    </div>

                    <div className="p-2 bg-slate-900/80 rounded-xl text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Faturamento:</span>
                      <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                        R$ {prod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {shareOfRevenue}% da receita
                      </span>
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
                    className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 transition-all space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Product details */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        {getRankBadge(idx)}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h5 className="font-extrabold text-white text-xs sm:text-sm tracking-tight break-words">
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
                            <span>Presente em <strong className="text-slate-200">{prod.ordersCount}</strong> pedido(s)</span>
                          </div>
                        </div>
                      </div>

                      {/* Sold quantity & Revenue */}
                      <div className="text-right shrink-0">
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
