import React, { useState } from 'react';
import {
  Users,
  Package,
  Trophy,
  Medal,
  RefreshCw,
  Search,
  DollarSign,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  Clock
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
        <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-amber-500/10">
          🥇 1º
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-8 h-8 rounded-xl bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-black text-sm shrink-0">
          🥈 2º
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-8 h-8 rounded-xl bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center font-black text-sm shrink-0">
          🥉 3º
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
        #{index + 1}
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Quick Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Trophy className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Relatório de Vendas Direto
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Quem mais compra & quais produtos mais saem.
                </p>
              </div>
            </div>
          </div>

          {/* Time & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'Tudo' },
                { id: 'month', label: 'Este Mês' },
                { id: 'week', label: '7 Dias' },
                { id: 'today', label: 'Hoje' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeFilter === t.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Paid vs All Toggle */}
            <button
              onClick={() => setOnlyPaid(!onlyPaid)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                onlyPaid
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Alternar entre apenas pedidos pagos ou todos os pedidos"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{onlyPaid ? 'Apenas Pagos' : 'Todos os Pedidos'}</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>

        {/* View switcher on mobile/tablet */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium mr-1">Visualizar:</span>
          <button
            onClick={() => setActiveView('both')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeView === 'both' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Ambos Lado a Lado
          </button>
          <button
            onClick={() => setActiveView('customers')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              activeView === 'customers' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quem Compra Mais ({rankedCustomers.length})</span>
          </button>
          <button
            onClick={() => setActiveView('products')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              activeView === 'products' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Produtos Mais Vendidos ({rankedProducts.length})</span>
          </button>
        </div>
      </div>

      {/* 2 Big Answer Cards: Champion Customer & Champion Product */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Customer Card */}
        <div className="bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                MAIOR COMPRADOR DA LOJA
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {topCustomer ? topCustomer.name : 'Nenhuma venda ainda'}
              </h4>
              {topCustomer && (
                <p className="text-xs text-slate-400">
                  {topCustomer.ordersCount} pedido(s) realizados • Última compra em{' '}
                  {topCustomer.lastOrderDate ? new Date(topCustomer.lastOrderDate).toLocaleDateString('pt-BR') : '—'}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Gasto</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                R$ {(topCustomer?.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {topCustomer && topCustomer.phone && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                {topCustomer.phone}
              </span>
              {formatWhatsAppLink(topCustomer.phone, topCustomer.name) && (
                <a
                  href={formatWhatsAppLink(topCustomer.phone, topCustomer.name)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Chamar no WhatsApp</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Top Product Card */}
        <div className="bg-gradient-to-br from-cyan-950/20 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                PRODUTO QUE MAIS SAI
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {topProduct ? topProduct.name : 'Nenhum produto vendido'}
              </h4>
              {topProduct && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                    {topProduct.dosage || 'Dosagem padrão'}
                  </span>
                  <span>•</span>
                  <span>{topProduct.category}</span>
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Vendido</span>
              <span className="text-2xl font-black text-cyan-300 font-mono">
                {topProduct ? topProduct.qtySold : 0} un.
              </span>
              <span className="text-[11px] text-emerald-400 font-mono block">
                R$ {(topProduct?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {topProduct && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Faturamento gerado por este produto:
              </span>
              <span className="font-bold text-white font-mono">
                R$ {(topProduct.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2 Rankings: Side by Side or Full width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SEÇÃO 1: QUEM COMPRA MAIS */}
        {(activeView === 'both' || activeView === 'customers') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Quem Compra Mais (Ranking de Clientes)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordenado pelo maior valor financeiro gasto na loja.
                </p>
              </div>

              {/* Customer Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 w-full sm:w-44"
                />
              </div>
            </div>

            {rankedCustomers.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Nenhum comprador encontrado para o filtro selecionado.
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {rankedCustomers.map((cust, idx) => {
                  const spendPercent = Math.min(100, Math.round((cust.totalSpent / maxCustomerSpent) * 100));
                  const waLink = formatWhatsAppLink(cust.phone, cust.name);

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {getRankBadge(idx)}
                          <div>
                            <h5 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                              {cust.name}
                            </h5>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                              {cust.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  {cust.phone}
                                </span>
                              )}
                              {cust.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  <span className="truncate max-w-[180px]">{cust.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Total Spent Big */}
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-emerald-400 font-mono block">
                            R$ {cust.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
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
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                        <span>
                          Última compra:{' '}
                          {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString('pt-BR') : '—'}
                        </span>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>WhatsApp</span>
                            <ArrowUpRight className="w-3 h-3" />
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  <span>Quais Produtos Saem Mais (Ranking)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordenado pela quantidade de unidades vendidas.
                </p>
              </div>

              {/* Product Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-44"
                />
              </div>
            </div>

            {rankedProducts.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Nenhum produto vendido no período selecionado.
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {rankedProducts.map((prod, idx) => {
                  const qtyPercent = Math.min(100, Math.round((prod.qtySold / maxProductQty) * 100));

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {getRankBadge(idx)}
                          <div>
                            <h5 className="font-bold text-white text-sm tracking-tight">
                              {prod.name}
                            </h5>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              {prod.dosage && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono font-bold text-[11px] border border-slate-800">
                                  {prod.dosage}
                                </span>
                              )}
                              <span className="text-slate-500">•</span>
                              <span className="text-[11px] text-slate-400">{prod.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Units Sold Big & Revenue */}
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-cyan-300 font-mono block">
                            {prod.qtySold} {prod.qtySold === 1 ? 'unidade' : 'unidades'}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-mono">
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
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                        <span className="text-slate-500">
                          Estoque atual em loja:{' '}
                          <strong className={typeof prod.currentStock === 'number' && prod.currentStock <= 5 ? 'text-amber-400' : 'text-slate-300'}>
                            {typeof prod.currentStock === 'number' ? `${prod.currentStock} un.` : 'Disponível'}
                          </strong>
                        </span>
                        <span className="text-slate-400 font-mono">
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
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Total de Pedidos no Filtro: <strong className="text-white">{filteredOrders.length}</strong>
          </span>
          <span>•</span>
          <span>
            Frascos/Unidades Vendidas: <strong className="text-cyan-300">{totalUnitsSold}</strong>
          </span>
        </div>
        <div>
          Faturamento Total:{' '}
          <strong className="text-emerald-400 text-sm font-mono font-bold">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>
    </div>
  );
};
