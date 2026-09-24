import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar,
  Filter,
  FileSpreadsheet,
  Share2,
  Download,
  Receipt,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Truck,
  Package,
  Megaphone,
  Users,
  Percent,
  Wallet,
  Coins,
  FileText,
  AlertCircle,
  Copy,
  Printer,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FinancialTransaction, Order } from '../../types';
import { exportCashFlowToExcel, formatCurrency } from '../../utils/exportUtils';

export const FinancialManagement: React.FC = () => {
  const {
    orders,
    financialTransactions,
    addFinancialTransaction,
    deleteFinancialTransaction,
    currentUser,
    storeSettings,
    showToast,
    refreshSalesData,
  } = useApp();

  // Period Filter State
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'all' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sales Scope Filter: 'all_active' (todos os pedidos do site) vs 'confirmed_only' (somente vendas pagas/confirmadas)
  const [salesScope, setSalesScope] = useState<'all_active' | 'confirmed_only'>('all_active');

  // Auto-refresh and Sync state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());

  const handleSyncSales = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshSalesData(false);
      setLastSyncTime(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto sync on mount and interval
  useEffect(() => {
    refreshSalesData(true).catch(() => {});
    const interval = setInterval(() => {
      refreshSalesData(true).catch(() => {});
      setLastSyncTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Active View Tab inside Financial Dashboard
  const [activeTab, setActiveTab] = useState<'caixa' | 'despesas' | 'dre'>('caixa');

  // Transaction Modal State (Lançar Despesa ou Entrada)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'SAIDA' | 'ENTRADA'>('SAIDA');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Fornecedores & Peptídeos');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txPaymentMethod, setTxPaymentMethod] = useState('PIX');
  const [txSupplier, setTxSupplier] = useState('');
  const [txNotes, setTxNotes] = useState('');

  // Search and Filter within Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'sales' | 'expenses' | 'manual_income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Deletion Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState<{ id: string; description: string; amount: number; type: 'SAIDA' | 'ENTRADA' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // WhatsApp Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(() => {
    return localStorage.getItem('last_cashflow_wa_phone') || storeSettings.whatsappNumber || '';
  });
  const [includePaymentMethodsInWA, setIncludePaymentMethodsInWA] = useState(true);
  const [includeExpensesBreakdownInWA, setIncludeExpensesBreakdownInWA] = useState(true);
  const [includeTopOrdersInWA, setIncludeTopOrdersInWA] = useState(false);
  const [copiedWASummary, setCopiedWASummary] = useState(false);

  // Expense Categories Definitions
  const EXPENSE_CATEGORIES = [
    { label: 'Fornecedores & Peptídeos', icon: Building2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { label: 'Embalagens & Frascos', icon: Package, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { label: 'Frete & Envios / Sedex', icon: Truck, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { label: 'Marketing & Tráfego Pago', icon: Megaphone, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { label: 'Salários & Comissões Equipe', icon: Users, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    { label: 'Aluguel & Contas Fixas', icon: Building2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { label: 'Taxas & Impostos / Maquininha', icon: Percent, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
    { label: 'Despesas Operacionais Diversas', icon: Receipt, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
    { label: 'Outras Saídas', icon: ArrowDownRight, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  ];

  const INCOME_CATEGORIES = [
    { label: 'Venda Direta / Balcão', icon: ShoppingBagIcon, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { label: 'Aporte de Capital / Investimento', icon: Wallet, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    { label: 'Rendimentos & Reembolsos', icon: Coins, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
    { label: 'Outras Entradas', icon: ArrowUpRight, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  ];

  function ShoppingBagIcon(props: any) {
    return <DollarSign {...props} />;
  }

  // Open modal pre-configured
  const handleOpenModal = (type: 'SAIDA' | 'ENTRADA') => {
    setModalType(type);
    setTxAmount('');
    setTxCategory(type === 'SAIDA' ? 'Fornecedores & Peptídeos' : 'Venda Direta / Balcão');
    setTxDescription('');
    setTxSupplier('');
    setTxNotes('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxPaymentMethod('PIX');
    setIsModalOpen(true);
  };

  // Date Range Filtering Logic
  const dateRange = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (timeFilter === 'today') {
      return { start: startOfToday, end: endOfToday, label: 'Hoje' };
    }
    if (timeFilter === 'yesterday') {
      const yStart = new Date(startOfToday);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(endOfToday);
      yEnd.setDate(yEnd.getDate() - 1);
      return { start: yStart, end: yEnd, label: 'Ontem' };
    }
    if (timeFilter === 'week') {
      const wStart = new Date(startOfToday);
      wStart.setDate(wStart.getDate() - 7);
      return { start: wStart, end: endOfToday, label: 'Últimos 7 dias' };
    }
    if (timeFilter === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: mStart, end: endOfToday, label: 'Este Mês' };
    }
    if (timeFilter === 'last_month') {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: lmStart, end: lmEnd, label: 'Mês Anterior' };
    }
    if (timeFilter === 'year') {
      const yStart = new Date(now.getFullYear(), 0, 1);
      return { start: yStart, end: endOfToday, label: 'Este Ano' };
    }
    if (timeFilter === 'custom' && customStartDate) {
      const cStart = new Date(customStartDate + 'T00:00:00');
      const cEnd = customEndDate ? new Date(customEndDate + 'T23:59:59.999') : endOfToday;
      return {
        start: cStart,
        end: cEnd,
        label: `${cStart.toLocaleDateString('pt-BR')} até ${cEnd.toLocaleDateString('pt-BR')}`,
      };
    }
    return { start: new Date(0), end: new Date(2100, 0, 1), label: 'Todo o Período' };
  }, [timeFilter, customStartDate, customEndDate]);

  // Filter valid Orders within Period
  const periodOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status === 'Cancelado') return false;
      const orderDate = new Date(order.createdAt || 0);
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Filter Financial Transactions within Period
  const periodTransactions = useMemo(() => {
    return financialTransactions.filter((tx) => {
      const txDateObj = new Date(tx.date || 0);
      return txDateObj >= dateRange.start && txDateObj <= dateRange.end;
    });
  }, [financialTransactions, dateRange]);

  // Separate Expenses and Manual Incomes
  const periodExpenses = useMemo(() => {
    return periodTransactions.filter((tx) => tx.type === 'SAIDA');
  }, [periodTransactions]);

  const periodManualIncomes = useMemo(() => {
    return periodTransactions.filter((tx) => tx.type === 'ENTRADA' && !tx.orderId);
  }, [periodTransactions]);

  // Financial Calculations & Revenue Totals matching site sales
  const grossSalesTotal = useMemo(() => {
    return periodOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [periodOrders]);

  const confirmedSalesTotal = useMemo(() => {
    return periodOrders.reduce((sum, order) => {
      if (order.paidAmount !== undefined && order.paidAmount > 0) {
        return sum + Number(order.paidAmount);
      }
      if (['Pago', 'Enviado', 'Entregue', 'Em Separação', 'Pago Parcial'].includes(order.status)) {
        return sum + (order.total || 0);
      }
      return sum;
    }, 0);
  }, [periodOrders]);

  const pendingSalesTotal = Math.max(0, grossSalesTotal - confirmedSalesTotal);

  const totalSalesRevenue = salesScope === 'all_active' ? grossSalesTotal : confirmedSalesTotal;

  const totalExtraIncome = useMemo(() => {
    return periodManualIncomes.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [periodManualIncomes]);

  const totalGrossIncome = totalSalesRevenue + totalExtraIncome;

  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [periodExpenses]);

  // Net Cash Balance = Total Incomes - Total Expenses
  const netCashBalance = totalGrossIncome - totalExpenses;
  const profitMargin = totalGrossIncome > 0 ? (netCashBalance / totalGrossIncome) * 100 : 0;

  // Order Counts & Average Ticket
  const paidOrdersCount = periodOrders.length;
  const averageTicket = paidOrdersCount > 0 ? totalSalesRevenue / paidOrdersCount : 0;

  // Payment methods breakdown for site sales
  const paymentMethodsBreakdown = useMemo(() => {
    const acc: Record<string, { count: number; total: number }> = {};
    periodOrders.forEach((o) => {
      const method = o.paymentMethod || 'A Combinar';
      if (!acc[method]) acc[method] = { count: 0, total: 0 };
      acc[method].count += 1;
      acc[method].total += o.total || 0;
    });
    return acc;
  }, [periodOrders]);

  // Expenses grouped by Category
  const expensesByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      const cat = e.category || 'Outras Saídas';
      acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    });
    return acc;
  }, [periodExpenses]);

  // Unified Ledger Entries (Orders as Inflow + Manual Transactions)
  interface LedgerEntry {
    id: string;
    date: string;
    type: 'ENTRADA' | 'SAIDA';
    category: string;
    description: string;
    amount: number;
    paymentMethod?: string;
    isOrder?: boolean;
    orderId?: string;
    notes?: string;
    rawItem?: FinancialTransaction | Order;
  }

  const unifiedLedger = useMemo<LedgerEntry[]>(() => {
    const entries: LedgerEntry[] = [];

    // 1. Orders as Inflows
    periodOrders.forEach((order) => {
      entries.push({
        id: `order-${order.id}`,
        date: order.createdAt,
        type: 'ENTRADA',
        category: 'Venda na Loja',
        description: `Pedido ${order.orderNumber || order.id.slice(0, 8)} - ${order.customer?.name || 'Cliente'} (${order.items?.length || 0} itens)`,
        amount: order.total || 0,
        paymentMethod: order.paymentMethod || 'PIX',
        isOrder: true,
        orderId: order.id,
        notes: order.notes,
        rawItem: order,
      });
    });

    // 2. Manual Financial Transactions (Expenses & Extra Incomes)
    periodTransactions.forEach((tx) => {
      // Avoid duplicate display if already rendered as order
      if (tx.orderId && periodOrders.some((o) => o.id === tx.orderId)) {
        return;
      }
      entries.push({
        id: tx.id,
        date: tx.date,
        type: tx.type,
        category: tx.category || (tx.type === 'SAIDA' ? 'Despesa' : 'Entrada'),
        description: tx.description || 'Lançamento Manual',
        amount: tx.amount || 0,
        paymentMethod: tx.paymentMethod || 'PIX',
        isOrder: false,
        notes: tx.notes,
        rawItem: tx,
      });
    });

    // Sort descending by date
    entries.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return entries;
  }, [periodOrders, periodTransactions]);

  // Filtered Ledger by search and type
  const filteredLedger = useMemo(() => {
    return unifiedLedger.filter((item) => {
      // Type filter
      if (ledgerTypeFilter === 'sales' && !item.isOrder) return false;
      if (ledgerTypeFilter === 'expenses' && item.type !== 'SAIDA') return false;
      if (ledgerTypeFilter === 'manual_income' && (item.isOrder || item.type !== 'ENTRADA')) return false;

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = item.description.toLowerCase().includes(query);
        const catMatch = item.category.toLowerCase().includes(query);
        const methodMatch = (item.paymentMethod || '').toLowerCase().includes(query);
        const notesMatch = (item.notes || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch && !methodMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [unifiedLedger, ledgerTypeFilter, categoryFilter, searchQuery]);

  // Handle Submit New Transaction (Expense / Income)
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(txAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Por favor, informe um valor válido maior que zero.');
      return;
    }

    if (!txDescription.trim()) {
      showToast('Por favor, informe a descrição do lançamento.');
      return;
    }

    const newTx: Omit<FinancialTransaction, 'id'> = {
      date: txDate ? new Date(txDate + 'T12:00:00').toISOString() : new Date().toISOString(),
      type: modalType,
      category: txCategory,
      description: txDescription.trim(),
      amount: parsedAmount,
      paymentMethod: txPaymentMethod,
      supplier: txSupplier.trim() || undefined,
      notes: txNotes.trim() || undefined,
      createdBy: currentUser?.name || 'Administrador',
    };

    addFinancialTransaction(newTx);
    setIsModalOpen(false);
  };

  // Confirm Delete Transaction
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await deleteFinancialTransaction(itemToDelete.id);
      setItemToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const filename = exportCashFlowToExcel({
      periodLabel: dateRange.label,
      storeName: storeSettings.storeName || 'Peptide Imports Farma',
      metrics: {
        totalSalesRevenue,
        totalExtraIncome,
        totalExpenses,
        netCashBalance,
        ordersCount: periodOrders.length,
        paidOrdersCount,
        averageTicket,
      },
      expenses: periodExpenses,
      transactions: unifiedLedger.map((u) => ({
        id: u.id,
        date: u.date,
        type: u.type,
        category: u.category,
        description: u.description,
        amount: u.amount,
        paymentMethod: u.paymentMethod,
      })),
      expensesByCategory,
    });
    showToast(`Planilha ${filename} baixada com sucesso!`);
  };

  // WhatsApp Cash Flow Formatted Message Generator
  const generateWhatsAppMessage = () => {
    const nowStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let msg = `*📊 RELATÓRIO DE CONTROLE DE CAIXA*\n`;
    msg += `🏢 *${storeSettings.storeName || 'Peptide Imports Farma'}*\n`;
    msg += `📅 *Período:* ${dateRange.label}\n`;
    msg += `🕒 *Emitido em:* ${nowStr} às ${timeStr}\n\n`;

    msg += `*💵 FATURAMENTO DO SITE & ENTRADAS:*\n`;
    msg += `• *Total de Vendas do Site:* *${formatCurrency(grossSalesTotal)}* (${periodOrders.length} pedidos)\n`;
    msg += `  - 🟢 Vendas Pagas/Quitadas: *${formatCurrency(confirmedSalesTotal)}*\n`;
    if (pendingSalesTotal > 0) {
      msg += `  - 🟡 Pedidos Pendentes: *${formatCurrency(pendingSalesTotal)}*\n`;
    }
    if (totalExtraIncome > 0) {
      msg += `• *Outras Entradas/Aportes:* *${formatCurrency(totalExtraIncome)}*\n`;
    }
    msg += `• *Faturamento Bruto Total:* *${formatCurrency(totalGrossIncome)}*\n`;
    msg += `• *Ticket Médio:* *${formatCurrency(averageTicket)}*\n\n`;

    msg += `*📉 DESPESAS & SAÍDAS:* *${formatCurrency(totalExpenses)}* (${periodExpenses.length} lançamentos)\n`;

    if (includeExpensesBreakdownInWA && Object.keys(expensesByCategory).length > 0) {
      msg += `\n*Detalhamento de Despesas por Categoria:*\n`;
      Object.entries(expensesByCategory).forEach(([cat, val]) => {
        const numVal = Number(val) || 0;
        const pct = totalExpenses > 0 ? ((numVal / totalExpenses) * 100).toFixed(1) : '0';
        msg += `  • ${cat}: *${formatCurrency(numVal)}* (${pct}%)\n`;
      });
    }

    if (includePaymentMethodsInWA && Object.keys(paymentMethodsBreakdown).length > 0) {
      msg += `\n*Formas de Pagamento no Site:*\n`;
      Object.entries(paymentMethodsBreakdown).forEach(([method, data]) => {
        const item = data as { count: number; total: number };
        msg += `  • ${method}: ${item.count} pedidos (*${formatCurrency(item.total)}*)\n`;
      });
    }

    if (includeTopOrdersInWA && periodOrders.length > 0) {
      msg += `\n*Últimos Pedidos do Período:*\n`;
      periodOrders.slice(0, 10).forEach((o) => {
        msg += `  #${o.orderNumber || o.id.slice(0, 6)} - ${o.customer?.name || 'Cliente'} - ${formatCurrency(o.total || 0)} (${o.status})\n`;
      });
      if (periodOrders.length > 10) {
        msg += `  ... e mais ${periodOrders.length - 10} pedidos.\n`;
      }
    }

    msg += `\n*══════════════════════════*\n`;
    msg += `*💰 SALDO LÍQUIDO EM CAIXA:* *${formatCurrency(netCashBalance)}*\n`;
    msg += `*📈 Margem Líquida:* *${profitMargin.toFixed(1)}%*\n`;
    msg += `*══════════════════════════*\n`;

    return msg;
  };

  // Copy WhatsApp Text to Clipboard
  const handleCopyWhatsAppText = () => {
    const msg = generateWhatsAppMessage();
    navigator.clipboard.writeText(msg);
    setCopiedWASummary(true);
    showToast('Relatório de caixa copiado para o WhatsApp com sucesso!');
    setTimeout(() => setCopiedWASummary(false), 3000);
  };

  // Directly Send to WhatsApp
  const handleDirectSendWhatsApp = () => {
    let rawDigits = (whatsAppPhone || '').replace(/\D/g, '');
    if (!rawDigits) {
      showToast('Por favor, informe um número de telefone com DDD.');
      return;
    }

    // Auto prepend Brazil 55 if length is 10 or 11
    if (rawDigits.length === 10 || rawDigits.length === 11) {
      rawDigits = `55${rawDigits}`;
    }

    localStorage.setItem('last_cashflow_wa_phone', rawDigits);

    const message = generateWhatsAppMessage();
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${rawDigits}&text=${encodedText}`;

    // Open WhatsApp in a clean new tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast(`Abrindo WhatsApp para enviar relatório ao número +${rawDigits}...`);
    setIsWhatsAppModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-xs">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white font-tech tracking-tight">
                  CONTROLE DE CAIXA & GESTÃO FINANCEIRA
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Faturamento de vendas consolidado, lançamento de despesas e extrato de caixa em tempo real
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncSales}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-all cursor-pointer"
              title="Sincronizar dados de vendas com Firestore em tempo real"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar Vendas'}</span>
            </button>

            <button
              onClick={() => handleOpenModal('SAIDA')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Despesa</span>
            </button>

            <button
              onClick={() => handleOpenModal('ENTRADA')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Entrada Extra</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Exportar para Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              title="Enviar relatório de caixa completo para o WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Sales Scope Mode & Sync Status Indicator */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Base de Vendas:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setSalesScope('all_active')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesScope === 'all_active'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas as Vendas ({formatCurrency(grossSalesTotal)})
              </button>
              <button
                onClick={() => setSalesScope('confirmed_only')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesScope === 'confirmed_only'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Somente Pagos ({formatCurrency(confirmedSalesTotal)})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Vendas Sincronizadas às {lastSyncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Time Period Filter Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto admin-nav-scrollbar py-1">
            <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Período:
            </span>
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: 'week', label: '7 Dias' },
              { id: 'month', label: 'Este Mês' },
              { id: 'last_month', label: 'Mês Passado' },
              { id: 'year', label: 'Este Ano' },
              { id: 'all', label: 'Tudo' },
              { id: 'custom', label: 'Personalizado' },
            ].map((p) => {
              const isActive = timeFilter === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTimeFilter(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 text-xs bg-slate-800/60 p-1.5 rounded-xl border border-slate-700">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:border-cyan-500 outline-hidden"
              />
              <span className="text-slate-500 font-bold">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:border-cyan-500 outline-hidden"
              />
            </div>
          )}

          <div className="text-xs text-slate-400 font-medium">
            Exibindo dados de: <strong className="text-cyan-300">{dateRange.label}</strong>
          </div>
        </div>
      </div>

      {/* Main KPI Overview Cards (Caixa e Faturamento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Total de Vendas */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-tech">
              Faturamento do Site
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-tech tracking-tight">
              {formatCurrency(totalSalesRevenue)}
            </div>
            <div className="space-y-1 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">🟢 Quitado/Pago:</span>
                <span className="font-mono text-emerald-300 font-bold">{formatCurrency(confirmedSalesTotal)}</span>
              </div>
              {pendingSalesTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">🟡 Pendente:</span>
                  <span className="font-mono text-amber-300 font-bold">{formatCurrency(pendingSalesTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-500 pt-0.5">
                <span>{paidOrdersCount} pedidos</span>
                <span>Médio: {formatCurrency(averageTicket)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Outras Entradas */}
        <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-tech">
              Outras Entradas / Aportes
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-tech tracking-tight">
              {formatCurrency(totalExtraIncome)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span>{periodManualIncomes.length} aportes manuais</span>
              <span className="text-cyan-400 font-semibold">Total: {formatCurrency(totalGrossIncome)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total de Despesas / Saídas */}
        <div className="bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-tech">
              Total de Despesas
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-tech tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span>{periodExpenses.length} despesas lançadas</span>
              <button
                onClick={() => handleOpenModal('SAIDA')}
                className="text-rose-400 hover:text-rose-300 font-semibold hover:underline cursor-pointer"
              >
                + Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Saldo Líquido em Caixa (Lucro Real) */}
        <div className={`border rounded-3xl p-5 shadow-lg relative overflow-hidden group transition-all ${
          netCashBalance >= 0
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/40 hover:border-emerald-400'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border-rose-500/40 hover:border-rose-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider font-tech text-slate-300">
              Saldo Líquido em Caixa
            </span>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              netCashBalance >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {netCashBalance >= 0 ? 'Positivo' : 'Negativo'}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-black font-tech tracking-tight ${
              netCashBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(netCashBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span>Margem Operacional</span>
              <span className={`font-bold ${netCashBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs (Extrato Caixa / Gestão Despesas / DRE) */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('caixa')}
          className={`py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'caixa'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/50 rounded-t-2xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Extrato de Movimentações de Caixa ({filteredLedger.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('despesas')}
          className={`py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'despesas'
              ? 'border-rose-500 text-rose-400 bg-slate-900/50 rounded-t-2xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Gestão de Despesas ({periodExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dre')}
          className={`py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'dre'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900/50 rounded-t-2xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>DRE & Resultado do Exercício</span>
        </button>
      </div>

      {/* TAB 1: EXTRATO DO CAIXA INTEGRADO */}
      {activeTab === 'caixa' && (
        <div className="space-y-4">
          {/* Filtering & Search Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por descrição, cliente, forma pagto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Type Filter Buttons */}
              {[
                { id: 'all', label: 'Todas' },
                { id: 'sales', label: '🟢 Vendas da Loja' },
                { id: 'expenses', label: '🔴 Despesas' },
                { id: 'manual_income', label: '🔷 Aportes / Entradas' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setLedgerTypeFilter(b.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    ledgerTypeFilter === b.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {filteredLedger.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Receipt className="w-12 h-12 mx-auto text-slate-600" />
                <h3 className="text-base font-bold text-white font-tech">NENHUMA MOVIMENTAÇÃO NO PERÍODO</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Não foram encontradas entradas ou despesas com os filtros selecionados. Clique em "+ Lançar Despesa" ou "+ Lançar Entrada" para registrar.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => handleOpenModal('SAIDA')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    + Lançar Despesa
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Data</th>
                      <th className="py-3.5 px-4">Tipo</th>
                      <th className="py-3.5 px-4">Categoria</th>
                      <th className="py-3.5 px-4">Descrição / Origem</th>
                      <th className="py-3.5 px-4">Forma Pagto</th>
                      <th className="py-3.5 px-4 text-right">Valor</th>
                      <th className="py-3.5 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLedger.map((item) => {
                      const isIncome = item.type === 'ENTRADA';
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono">
                            {new Date(item.date).toLocaleDateString('pt-BR')}
                            <span className="text-[10px] text-slate-500 ml-1.5">
                              {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isIncome
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {isIncome ? 'ENTRADA' : 'SAÍDA'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-white font-medium">
                            {item.description}
                            {item.notes && (
                              <div className="text-[10px] text-slate-400 truncate">Obs: {item.notes}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono">
                            {item.paymentMethod || 'PIX'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold font-mono">
                            <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                              {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            {!item.isOrder ? (
                              <button
                                onClick={() =>
                                  setItemToDelete({
                                    id: item.id,
                                    description: item.description,
                                    amount: item.amount,
                                    type: item.type,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Venda Loja</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GESTÃO DE DESPESAS */}
      {activeTab === 'despesas' && (
        <div className="space-y-6">
          {/* Expense Categories Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-tech flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  Despesas por Categoria
                </h3>
                <span className="text-xs text-slate-400">Total: {formatCurrency(totalExpenses)}</span>
              </div>

              {Object.keys(expensesByCategory).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhuma despesa registrada neste período.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(expensesByCategory)
                    .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
                    .map(([category, amount]) => {
                      const numAmount = Number(amount) || 0;
                      const percentage = totalExpenses > 0 ? (numAmount / totalExpenses) * 100 : 0;
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{category}</span>
                            <span className="text-rose-400 font-mono">
                              {formatCurrency(numAmount)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Quick Add Expense Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 mb-3">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-tech">NOVA DESPESA</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Cadastre compras de peptídeos, frascos, insumos, fretes, investimentos em tráfego ou despesas do dia a dia.
                </p>
              </div>

              <button
                onClick={() => handleOpenModal('SAIDA')}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Lançar Nova Despesa</span>
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-tech">
                HISTÓRICO DE DESPESAS LANÇADAS ({periodExpenses.length})
              </h3>
            </div>

            {periodExpenses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma despesa cadastrada para o período selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Descrição / Favorecido</th>
                      <th className="py-3 px-4">Forma Pagto</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {periodExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {new Date(exp.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold text-[11px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {exp.description}
                          {exp.supplier && <span className="text-slate-500 text-[10px] ml-1">({exp.supplier})</span>}
                          {exp.notes && <div className="text-[10px] text-slate-500">{exp.notes}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{exp.paymentMethod || 'PIX'}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-400 font-mono">
                          - {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() =>
                              setItemToDelete({
                                id: exp.id,
                                description: exp.description,
                                amount: exp.amount,
                                type: 'SAIDA',
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DRE & RESULTADO DO EXERCÍCIO */}
      {activeTab === 'dre' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-white font-tech">
              DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE GERENCIAL)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidação financeira de receitas, deduções, despesas operacionais e resultado líquido
            </p>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            {/* 1. Receitas */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between font-bold text-emerald-400">
                <span>(+) RECEITA BRUTA DE VENDAS (LOJA VIRTUAL)</span>
                <span className="font-mono">{formatCurrency(totalSalesRevenue)}</span>
              </div>
              {totalExtraIncome > 0 && (
                <div className="flex justify-between font-semibold text-cyan-400 pl-4">
                  <span>(+) Outras Receitas & Aportes</span>
                  <span className="font-mono">{formatCurrency(totalExtraIncome)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800/80">
                <span>(=) RECEITA BRUTA TOTAL</span>
                <span className="font-mono">{formatCurrency(totalGrossIncome)}</span>
              </div>
            </div>

            {/* 2. Despesas por Grupo */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                (-) DESPESAS & CUSTOS OPERACIONAIS
              </div>

              {Object.keys(expensesByCategory).length === 0 ? (
                <div className="text-slate-500 italic pl-4 text-xs">Nenhuma despesa lançada no período.</div>
              ) : (
                Object.entries(expensesByCategory).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between text-slate-300 pl-4">
                    <span>(-) {cat}</span>
                    <span className="font-mono text-rose-400">- {formatCurrency(Number(val) || 0)}</span>
                  </div>
                ))
              )}

              <div className="flex justify-between font-bold text-rose-400 pt-2 border-t border-slate-800/80">
                <span>(=) TOTAL DE DESPESAS</span>
                <span className="font-mono">- {formatCurrency(totalExpenses)}</span>
              </div>
            </div>

            {/* 3. Resultado Líquido */}
            <div className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              netCashBalance >= 0
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  (=) RESULTADO LÍQUIDO DO CAIXA (LUCRO LÍQUIDO)
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  Margem Líquida do Período: <strong>{profitMargin.toFixed(1)}%</strong>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-tech font-mono">
                {formatCurrency(netCashBalance)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAR DESPESA OU ENTRADA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  modalType === 'SAIDA' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {modalType === 'SAIDA' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-tech">
                    {modalType === 'SAIDA' ? 'LANÇAR DESPESA / SAÍDA' : 'LANÇAR ENTRADA EXTRA'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registre a movimentação financeira no fluxo de caixa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalType('SAIDA');
                    setTxCategory('Fornecedores & Peptídeos');
                  }}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    modalType === 'SAIDA'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔴 Despesa (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalType('ENTRADA');
                    setTxCategory('Venda Direta / Balcão');
                  }}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    modalType === 'ENTRADA'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Entrada (Receita)
                </button>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Valor (R$) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono text-sm focus:border-cyan-500 outline-hidden font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Data do Lançamento <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-cyan-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Categoria <span className="text-rose-400">*</span>
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-cyan-500 outline-hidden"
                >
                  {(modalType === 'SAIDA' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description & Favorecido */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Descrição do Gasto / Lançamento <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={modalType === 'SAIDA' ? 'Ex: Compra de 50 caixas de isopor e gelo seco' : 'Ex: Aporte para capital de giro'}
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-cyan-500 outline-hidden"
                />
              </div>

              {/* Payment Method & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Forma de Pagamento</label>
                  <select
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-cyan-500 outline-hidden"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Transferência">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fornecedor / Favorecido</label>
                  <input
                    type="text"
                    placeholder="Ex: Fornecedor Alpha, Meta Ads, etc."
                    value={txSupplier}
                    onChange={(e) => setTxSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-cyan-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observações Adicionais</label>
                <input
                  type="text"
                  placeholder="Número de nota fiscal, código de rastreio, detalhes..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 ${
                    modalType === 'SAIDA' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  }`}
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-tech">EXCLUIR LANÇAMENTO?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Deseja realmente remover o lançamento "{itemToDelete.description}" no valor de {formatCurrency(itemToDelete.amount)}?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR PARA O WHATSAPP */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-tech">
                    ENVIAR RELATÓRIO DE CAIXA PARA WHATSAPP
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compartilhe o fechamento financeiro consolidado ({dateRange.label}) diretamente pelo WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              
              {/* Phone Input & Quick Preset */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Número do WhatsApp de Destino (com DDD)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">📱</span>
                    <input
                      type="text"
                      placeholder="Ex: 11999998888 ou 5511999998888"
                      value={whatsAppPhone}
                      onChange={(e) => setWhatsAppPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono text-sm focus:border-emerald-500 outline-hidden font-bold"
                    />
                  </div>
                  {storeSettings.whatsappNumber && (
                    <button
                      type="button"
                      onClick={() => setWhatsAppPhone(storeSettings.whatsappNumber)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border border-slate-700"
                    >
                      Usar Nº da Loja
                    </button>
                  )}
                </div>
              </div>

              {/* Options to Customize Message */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Opções de Conteúdo na Mensagem:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExpensesBreakdownInWA}
                      onChange={(e) => setIncludeExpensesBreakdownInWA(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                    />
                    <span>Detalhamento de Despesas</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePaymentMethodsInWA}
                      onChange={(e) => setIncludePaymentMethodsInWA(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                    />
                    <span>Formas de Pagamento do Site</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTopOrdersInWA}
                      onChange={(e) => setIncludeTopOrdersInWA(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                    />
                    <span>Lista de Pedidos Recentes</span>
                  </label>
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 font-semibold text-xs flex items-center gap-1.5">
                    <span>Pré-visualização da Mensagem:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppText}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedWASummary ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-emerald-300/90 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed selection:bg-emerald-500 selection:text-slate-950">
                  {generateWhatsAppMessage()}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer transition-colors"
              >
                Fechar
              </button>
              
              <button
                type="button"
                onClick={handleCopyWhatsAppText}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedWASummary ? 'Texto Copiado!' : 'Copiar Mensagem'}</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSendWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Abrir WhatsApp & Enviar</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
