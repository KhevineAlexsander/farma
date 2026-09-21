import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  Trophy,
  RefreshCw,
  Search,
  Phone,
  Mail,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  Send,
  Copy,
  Check,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SalesReportsTab: React.FC = () => {
  const { orders, products, saveAllOrdersToCloud, showToast } = useApp();
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [onlyPaid, setOnlyPaid] = useState<boolean>(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeView, setActiveView] = useState<'both' | 'customers' | 'products'>('both');

  // WhatsApp Summary State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(() => {
    return localStorage.getItem('last_sales_report_wa_phone') || '';
  });
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filter orders according to period and status
  const now = new Date();
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (onlyPaid) {
      if (!['Pago', 'Em Separação', 'Enviado', 'Entregue'].includes(order.status)) {
        return false;
      }
    } else {
      if (order.status === 'Cancelado') return false;
    }

    // Time filter
    if (timeFilter !== 'all') {
      const orderDate = new Date(order.createdAt || Date.now());
      if (timeFilter === 'today') {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (timeFilter === 'week') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (timeFilter === 'month') {
        if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  // --- 1. QUEM COMPRA MAIS (Ranking de Clientes) ---
  const customerMap = new Map<
    string,
    {
      name: string;
      email: string;
      phone: string;
      ordersCount: number;
      totalSpent: number;
      lastOrderDate: string;
    }
  >();

  filteredOrders.forEach((order) => {
    const name = order.customer?.name || (order as any).customerName || 'Cliente';
    const email = order.customer?.email || (order as any).customerEmail || '';
    const phone = order.customer?.phone || (order as any).customerPhone || '';

    // Identify client by email, phone or name
    const key = (email || phone || name).toLowerCase().trim();

    const existing = customerMap.get(key) || {
      name,
      email,
      phone,
      ordersCount: 0,
      totalSpent: 0,
      lastOrderDate: order.createdAt || '',
    };

    existing.ordersCount += 1;
    existing.totalSpent += order.total || 0;

    // Track most recent order date
    if (order.createdAt && (!existing.lastOrderDate || new Date(order.createdAt) > new Date(existing.lastOrderDate))) {
      existing.lastOrderDate = order.createdAt;
    }

    customerMap.set(key, existing);
  });

  const rankedCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .filter((c) => {
      if (!customerSearch.trim()) return true;
      const q = customerSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });

  const topCustomer = rankedCustomers[0] || null;
  const maxCustomerSpent = topCustomer ? topCustomer.totalSpent : 1;

  // --- 2. QUAIS PRODUTOS SAEM MAIS (Ranking de Produtos) ---
  const productMap = new Map<
    string,
    {
      name: string;
      dosage: string;
      category: string;
      qtySold: number;
      totalRevenue: number;
      currentStock?: number;
    }
  >();

  filteredOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const prodName = (item.product?.name || item.name || 'Produto').trim().toUpperCase();
      const dosage = (item.product?.dosage || item.dosage || '').trim().toUpperCase();
      const key = `${prodName}_${dosage}`;

      const matchedProduct = products.find(
        (p) => p.name.trim().toUpperCase() === prodName && (!dosage || p.dosage.trim().toUpperCase() === dosage)
      );

      const existing = productMap.get(key) || {
        name: prodName,
        dosage: dosage || (matchedProduct?.dosage ?? ''),
        category: item.product?.category || matchedProduct?.category || 'Geral',
        qtySold: 0,
        totalRevenue: 0,
        currentStock: matchedProduct?.stock,
      };

      const itemQty = item.quantity || 1;
      const itemPrice = item.price || item.product?.price || 0;

      existing.qtySold += itemQty;
      existing.totalRevenue += itemPrice * itemQty;

      productMap.set(key, existing);
    });
  });

  const rankedProducts = Array.from(productMap.values())
    .sort((a, b) => b.qtySold - a.qtySold || b.totalRevenue - a.totalRevenue)
    .filter((p) => {
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.dosage.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });

  const topProduct = rankedProducts[0] || null;
  const maxProductQty = topProduct ? topProduct.qtySold : 1;

  // Overall totals
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalUnitsSold = rankedProducts.reduce((acc, p) => acc + p.qtySold, 0);

  const handleSync = async () => {
    setIsSyncing(true);
    await saveAllOrdersToCloud();
    setIsSyncing(false);
    showToast('Dados de vendas sincronizados!');
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-500/25 via-amber-500/15 to-amber-600/30 text-amber-300 border-2 border-amber-400/80 flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md shadow-amber-500/20 select-none">
          <span className="leading-none">1º</span>
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-slate-300/25 via-slate-300/15 to-slate-400/30 text-slate-100 border-2 border-slate-300/80 flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md shadow-slate-300/10 select-none">
          <span className="leading-none">2º</span>
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-700/30 via-amber-700/20 to-amber-800/35 text-amber-400 border-2 border-amber-600/80 flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md shadow-amber-800/10 select-none">
          <span className="leading-none">3º</span>
        </span>
      );
    }
    return (
      <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 select-none">
        <span className="leading-none">{index + 1}º</span>
      </span>
    );
  };

  const formatWhatsAppLink = (phone: string, customerName: string) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return null;
    const fullNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const msg = encodeURIComponent(`Olá ${customerName}, tudo bem? Aqui é da equipe da loja de peptídeos!`);
    return `https://wa.me/${fullNumber}?text=${msg}`;
  };

  const generateSalesSummaryText = () => {
    const periodLabel =
      timeFilter === 'today'
        ? 'Hoje'
        : timeFilter === 'week'
        ? 'Últimos 7 Dias'
        : timeFilter === 'month'
        ? 'Mês Atual'
        : 'Geral (Todo o Histórico)';

    const statusFilterLabel = onlyPaid ? 'Apenas Pedidos Pagos' : 'Todos os Pedidos';
    const dateFormatted = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    let text = `📊 *RESUMO EXECUTIVO DE VENDAS - PEPTIDE IMPORTS*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📅 *Período:* ${periodLabel}\n`;
    text += `🔍 *Filtro:* ${statusFilterLabel}\n`;
    text += `🕒 *Gerado em:* ${dateFormatted}\n\n`;

    text += `💵 *Faturamento Total:* R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `📦 *Total de Pedidos:* ${filteredOrders.length} pedido(s)\n`;
    text += `🧪 *Frascos/Unidades Vendidos:* ${totalUnitsSold} un.\n`;
    const avgTicket = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    text += `📈 *Ticket Médio:* R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;

    text += `🏆 *TOP 5 CLIENTES (Quem Mais Compra):*\n`;
    if (rankedCustomers.length === 0) {
      text += `_Nenhum cliente registrado no período_\n`;
    } else {
      rankedCustomers.slice(0, 5).forEach((cust, idx) => {
        text += `${idx + 1}º ${cust.name}: R$ ${cust.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cust.ordersCount} ped.)\n`;
      });
    }

    text += `\n📦 *TOP 5 PRODUTOS MAIS VENDIDOS:*\n`;
    if (rankedProducts.length === 0) {
      text += `_Nenhum produto vendido no período_\n`;
    } else {
      rankedProducts.slice(0, 5).forEach((prod, idx) => {
        const dosageStr = prod.dosage ? ` (${prod.dosage})` : '';
        text += `${idx + 1}º ${prod.name}${dosageStr}: ${prod.qtySold} un. (R$ ${prod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})\n`;
      });
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ _Relatório gerado via Peptide Imports ERP_`;
    return text;
  };

  const handleSendSummaryToWhatsApp = () => {
    if (!whatsAppPhone.trim()) {
      showToast('Digite um número de WhatsApp com DDD antes de enviar.');
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
    showToast('Abrindo WhatsApp com o resumo!');
  };

  const handleCopySummary = async () => {
    try {
      const text = generateSalesSummaryText();
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      showToast('Resumo copiado com sucesso!');
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      showToast('Não foi possível copiar automaticamente.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 w-full overflow-hidden">
      {/* Header & Quick Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Trophy className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
                  Relatório de Vendas Direto
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Quem mais compra & quais produtos mais saem.
                </p>
              </div>
            </div>
          </div>

          {/* Time & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            {/* Period selector - Grid on mobile for equal tap zones */}
            <div className="grid grid-cols-4 sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              {[
                { id: 'all', label: 'Tudo' },
                { id: 'month', label: 'Mês' },
                { id: 'week', label: '7 Dias' },
                { id: 'today', label: 'Hoje' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeFilter(t.id as any)}
                  className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-bold text-center transition-all cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                    timeFilter === t.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white active:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Quick Actions (WhatsApp Summary, Paid filter & Refresh) */}
            <div className="grid grid-cols-1 sm:flex items-center gap-2">
              {/* WhatsApp Summary Trigger Button */}
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer min-h-[40px] sm:min-h-0"
                title="Enviar resumo completo das vendas direto para o WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Enviar Resumo WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                {/* Paid vs All Toggle */}
                <button
                  onClick={() => setOnlyPaid(!onlyPaid)}
                  className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer min-h-[40px] sm:min-h-0 ${
                    onlyPaid
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Alternar entre apenas pedidos pagos ou todos os pedidos"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{onlyPaid ? 'Apenas Pagos' : 'Todos Pedidos'}</span>
                </button>

                {/* Sync Button */}
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px] sm:min-h-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Atualizando...' : 'Atualizar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View switcher on mobile/tablet */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Visualizar:</span>
            <button
              onClick={() => setActiveView('both')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[38px] flex items-center gap-1.5 ${
                activeView === 'both' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Ambos</span>
            </button>
            <button
              onClick={() => setActiveView('customers')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[38px] flex items-center gap-1.5 ${
                activeView === 'customers' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300" />
              <span>Quem Compra Mais ({rankedCustomers.length})</span>
            </button>
            <button
              onClick={() => setActiveView('products')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[38px] flex items-center gap-1.5 ${
                activeView === 'products' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>Produtos Mais Vendidos ({rankedProducts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 Big Answer Cards: Champion Customer & Champion Product */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Top Customer Card */}
        <div className="bg-gradient-to-br from-amber-950/25 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                MAIOR COMPRADOR DA LOJA
              </span>
              <h4 className="text-lg sm:text-2xl font-black text-white tracking-tight break-words">
                {topCustomer ? topCustomer.name : 'Nenhuma venda ainda'}
              </h4>
              {topCustomer && (
                <p className="text-xs text-slate-400">
                  {topCustomer.ordersCount} pedido(s) realizados • Última compra em{' '}
                  {topCustomer.lastOrderDate ? new Date(topCustomer.lastOrderDate).toLocaleDateString('pt-BR') : '—'}
                </p>
              )}
            </div>

            <div className="bg-slate-950/60 border border-amber-500/20 sm:border-0 rounded-xl p-2.5 sm:p-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 sm:block">Total Gasto:</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                R$ {(topCustomer?.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {topCustomer && (
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{topCustomer.phone || 'Sem telefone'}</span>
              </span>
              {topCustomer.phone && formatWhatsAppLink(topCustomer.phone, topCustomer.name) && (
                <a
                  href={formatWhatsAppLink(topCustomer.phone, topCustomer.name)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-3 py-2 sm:py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/35 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[42px] sm:min-h-0 cursor-pointer"
                >
                  <span>Chamar no WhatsApp</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Top Product Card */}
        <div className="bg-gradient-to-br from-cyan-950/25 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 shrink-0" />
                PRODUTO QUE MAIS SAI
              </span>
              <h4 className="text-lg sm:text-2xl font-black text-white tracking-tight break-words">
                {topProduct ? topProduct.name : 'Nenhum produto vendido'}
              </h4>
              {topProduct && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                    {topProduct.dosage || 'Dosagem padrão'}
                  </span>
                  <span>•</span>
                  <span>{topProduct.category}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 border border-cyan-500/20 sm:border-0 rounded-xl p-2.5 sm:p-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 sm:block">Total Vendido:</span>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono block">
                  {topProduct ? topProduct.qtySold : 0} un.
                </span>
                <span className="text-[11px] text-emerald-400 font-mono block">
                  R$ {(topProduct?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {topProduct && (
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Faturamento deste produto:</span>
              <span className="font-bold text-white font-mono">
                R$ {(topProduct.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2 Rankings: Side by Side or Full width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* SEÇÃO 1: QUEM COMPRA MAIS */}
        {(activeView === 'both' || activeView === 'customers') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                  <span>Quem Compra Mais (Ranking)</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Ordenado pelo maior valor financeiro gasto.
                </p>
              </div>

              {/* Customer Search input */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar comprador..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 sm:py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 w-full min-h-[38px] sm:min-h-0"
                />
              </div>
            </div>

            {rankedCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum comprador encontrado para o filtro selecionado.
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3 max-h-[500px] sm:max-h-[580px] overflow-y-auto pr-0.5 sm:pr-1 overscroll-contain">
                {rankedCustomers.map((cust, idx) => {
                  const spendPercent = Math.min(100, Math.round((cust.totalSpent / maxCustomerSpent) * 100));
                  const waLink = formatWhatsAppLink(cust.phone, cust.name);

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 active:border-slate-600 rounded-2xl p-3 sm:p-4 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                          {getRankBadge(idx)}
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-white text-xs sm:text-sm tracking-tight break-words">
                              {cust.name}
                            </h5>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-[11px] text-slate-400 mt-0.5">
                              {cust.phone && (
                                <span className="flex items-center gap-1 truncate">
                                  <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate">{cust.phone}</span>
                                </span>
                              )}
                              {cust.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate max-w-[140px] sm:max-w-[180px]">{cust.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Total Spent Big */}
                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-black text-emerald-400 font-mono block">
                            R$ {cust.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                            {cust.ordersCount} pedido(s)
                          </span>
                        </div>
                      </div>

                      {/* Visual Spending Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${spendPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                        <span className="text-[10px] sm:text-[11px]">
                          Última compra:{' '}
                          {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString('pt-BR') : '—'}
                        </span>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center justify-end sm:justify-start gap-1 transition-colors py-1 cursor-pointer"
                          >
                            <span>Conversar no WhatsApp</span>
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

        {/* SEÇÃO 2: QUAIS PRODUTOS SAEM MAIS */}
        {(activeView === 'both' || activeView === 'products') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                  <span>Quais Produtos Saem Mais (Ranking)</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Ordenado pela quantidade de unidades vendidas.
                </p>
              </div>

              {/* Product Search input */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 sm:py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 w-full min-h-[38px] sm:min-h-0"
                />
              </div>
            </div>

            {rankedProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum produto vendido no período selecionado.
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3 max-h-[500px] sm:max-h-[580px] overflow-y-auto pr-0.5 sm:pr-1 overscroll-contain">
                {rankedProducts.map((prod, idx) => {
                  const qtyPercent = Math.min(100, Math.round((prod.qtySold / maxProductQty) * 100));

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 active:border-slate-600 rounded-2xl p-3 sm:p-4 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                          {getRankBadge(idx)}
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-white text-xs sm:text-sm tracking-tight break-words">
                              {prod.name}
                            </h5>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              {prod.dosage && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono font-bold text-[10px] border border-slate-800">
                                  {prod.dosage}
                                </span>
                              )}
                              <span className="text-slate-500">•</span>
                              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">{prod.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Units Sold Big & Revenue */}
                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-black text-cyan-300 font-mono block">
                            {prod.qtySold} {prod.qtySold === 1 ? 'unidade' : 'unidades'}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-emerald-400 font-mono">
                            R$ {prod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Visual Sales Volume Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                            style={{ width: `${qtyPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] pt-1 border-t border-slate-900">
                        <span className="text-slate-500 truncate">
                          Estoque em loja:{' '}
                          <strong className={typeof prod.currentStock === 'number' && prod.currentStock <= 5 ? 'text-amber-400' : 'text-slate-300'}>
                            {typeof prod.currentStock === 'number' ? `${prod.currentStock} un.` : 'Disponível'}
                          </strong>
                        </span>
                        <span className="text-slate-400 font-mono text-right sm:text-left">
                          Média R$ {(prod.totalRevenue / (prod.qtySold || 1)).toFixed(2)}/un
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simple Footer Summary */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-4 text-[11px] sm:text-xs">
          <span>
            Pedidos no Filtro: <strong className="text-white">{filteredOrders.length}</strong>
          </span>
          <span>•</span>
          <span>
            Frascos/Unidades: <strong className="text-cyan-300">{totalUnitsSold}</strong>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar Resumo para WhatsApp</span>
          </button>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-[11px] sm:text-xs text-slate-400">Faturamento:</span>
            <strong className="text-emerald-400 text-sm sm:text-base font-mono font-bold">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Modal: Enviar Resumo no WhatsApp */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-2xl my-6 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                  <MessageSquare className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Enviar Resumo de Vendas
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Defina o número de destino e envie o resumo instantâneo
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
              {/* Phone Input Box */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Número do WhatsApp de Destino *
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
                <p className="text-[11px] text-slate-500">
                  Você pode enviar para o seu próprio WhatsApp, para sócios, gerentes ou contabilidade.
                </p>
              </div>

              {/* Live Preview of formatted Message */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Prévia da Mensagem Formatada
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-cyan-400" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                  {generateSalesSummaryText()}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendSummaryToWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:from-emerald-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
              >
                <Send className="w-4 h-4" />
                <span>Abrir e Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
