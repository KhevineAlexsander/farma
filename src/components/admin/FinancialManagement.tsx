import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Lock,
  AlertTriangle,
  KeyRound,
  UploadCloud,
  FileSpreadsheet,
  X,
  PieChart as PieChartIcon,
  Calculator,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../../context/AppContext';
import { Order, FinancialTransaction } from '../../types';
import { PeptideVial } from '../PeptideVial';

export const FinancialManagement: React.FC = () => {
  const { orders, financialTransactions, addFinancialTransaction, deleteFinancialTransaction, deleteOrder, clearAllFinances, products } = useApp();
  const [period, setPeriod] = useState<'Dia' | 'Semana' | 'Mês'>('Mês');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Active Tab in Financial Ledger & Direct Orders
  const [activeFinanceTab, setActiveFinanceTab] = useState<'caixa' | 'pedidos'>('caixa');

  // Deletion modal state for Direct Orders & Transactions
  const [orderToDeleteFromFinance, setOrderToDeleteFromFinance] = useState<Order | null>(null);
  const [txToDelete, setTxToDelete] = useState<FinancialTransaction | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Transaction Form
  const [txType, setTxType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [txDesc, setTxDesc] = useState('');
  const [txCategory, setTxCategory] = useState('Venda Direta');
  const [txAmount, setTxAmount] = useState('');

  // Clear Ledger with Password 8817
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearError, setClearError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Search/Filter in tables for mobile
  const [productSearch, setProductSearch] = useState('');

  // Handler to delete a direct order from finances
  const handleConfirmDeleteOrderFromFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToDeleteFromFinance) return;

    if (deletePassword.trim() !== '8817') {
      setDeleteError('Senha incorreta! Digite a senha 8817 para confirmar a exclusão do pedido.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteOrder(orderToDeleteFromFinance.id);
      setOrderToDeleteFromFinance(null);
      setDeletePassword('');
      setDeleteError(null);
    } catch (err) {
      console.error('Error deleting order from finance:', err);
      setDeleteError('Ocorreu um erro ao excluir o pedido direto. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler to delete a manual transaction
  const handleConfirmDeleteTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToDelete) return;

    if (deletePassword.trim() !== '8817') {
      setDeleteError('Senha incorreta! Digite a senha 8817 para autorizar a exclusão.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteFinancialTransaction(txToDelete.id);
      setTxToDelete(null);
      setDeletePassword('');
      setDeleteError(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setDeleteError('Ocorreu um erro ao excluir o lançamento. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to initiate deletion from Livro Caixa
  const handleDeleteTxItem = (tx: FinancialTransaction) => {
    if (tx.orderId) {
      const matched = orders.find((o) => o.id === tx.orderId);
      if (matched) {
        setOrderToDeleteFromFinance(matched);
        setDeletePassword('');
        setDeleteError(null);
        return;
      }
    }
    const match = tx.description.match(/#PI-\d+/);
    if (match) {
      const matched = orders.find((o) => o.orderNumber === match[0]);
      if (matched) {
        setOrderToDeleteFromFinance(matched);
        setDeletePassword('');
        setDeleteError(null);
        return;
      }
    }
    setTxToDelete(tx);
    setDeletePassword('');
    setDeleteError(null);
  };

  // Calculate KPIs strictly from real orders
  const validOrders = orders.filter((o) => o.status !== 'Cancelado');
  const totalRevenue = validOrders.reduce((acc, order) => acc + (order.total || 0), 0);

  // Total product cost (CPV - Custo dos Produtos Vendidos)
  const totalCost = validOrders.reduce((acc, order) => {
    const orderCost = (order.items || []).reduce(
      (sum, item) => sum + (item.product?.costPrice || 0) * (item.quantity || 1),
      0
    );
    return acc + orderCost;
  }, 0);

  // Despesas Operacionais adicionais via Livro Caixa
  const totalExpensesFromLedger = financialTransactions
    .filter((tx) => tx.type === 'SAIDA')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  // Receitas adicionais via Livro Caixa
  const totalExtraIncomeFromLedger = financialTransactions
    .filter((tx) => tx.type === 'ENTRADA')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const grossProfit = totalRevenue - totalCost; // Lucro Bruto
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfit = grossProfit + totalExtraIncomeFromLedger - totalExpensesFromLedger; // Lucro Líquido
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const averageTicket = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // Orders today calculated from real order dates
  const todayStr = new Date().toISOString().split('T')[0];
  const ordersTodayCount = validOrders.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr)).length;

  // Dynamic chart datasets
  const dataByDay = [
    { label: '08h', vendas: 0, lucro: 0 },
    { label: '10h', vendas: 0, lucro: 0 },
    { label: '12h', vendas: 0, lucro: 0 },
    { label: '14h', vendas: 0, lucro: 0 },
    { label: '16h', vendas: 0, lucro: 0 },
    { label: '18h', vendas: 0, lucro: 0 },
    { label: '20h', vendas: 0, lucro: 0 },
  ];

  const dataByWeek = [
    { label: 'Seg', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Ter', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Qua', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Qui', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Sex', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Sáb', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Dom', vendas: 0, lucro: 0, custos: 0 },
  ];

  const dataByMonth = [
    { label: 'Sem 1', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Sem 2', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Sem 3', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Sem 4', vendas: 0, lucro: 0, custos: 0 },
  ];

  validOrders.forEach((order) => {
    const orderCost = (order.items || []).reduce(
      (sum, item) => sum + (item.product?.costPrice || 0) * (item.quantity || 1),
      0
    );
    const orderProfit = (order.total || 0) - orderCost;
    const d = new Date(order.createdAt || Date.now());

    // Day hour
    const hour = d.getHours();
    const bucket = `${String(Math.min(Math.floor(hour / 2) * 2, 20)).padStart(2, '0')}h`;
    const dayMatch = dataByDay.find((i) => i.label === bucket) || dataByDay[dataByDay.length - 1];
    if (dayMatch) {
      dayMatch.vendas += order.total || 0;
      dayMatch.lucro += orderProfit;
    }

    // Week day
    const dayOfWeek = d.getDay();
    const adjustedIdx = (dayOfWeek + 6) % 7;
    if (dataByWeek[adjustedIdx]) {
      dataByWeek[adjustedIdx].vendas += order.total || 0;
      dataByWeek[adjustedIdx].lucro += orderProfit;
      dataByWeek[adjustedIdx].custos += orderCost;
    }

    // Month week
    const dateNum = d.getDate();
    const weekIdx = Math.min(Math.floor((dateNum - 1) / 7), 3);
    if (dataByMonth[weekIdx]) {
      dataByMonth[weekIdx].vendas += order.total || 0;
      dataByMonth[weekIdx].lucro += orderProfit;
      dataByMonth[weekIdx].custos += orderCost;
    }
  });

  const activeChartData = period === 'Dia' ? dataByDay : period === 'Semana' ? dataByWeek : dataByMonth;

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc || !txAmount) return;

    addFinancialTransaction({
      date: new Date().toISOString().split('T')[0],
      type: txType,
      description: txDesc,
      category: txCategory,
      amount: parseFloat(txAmount),
    });

    setIsTxModalOpen(false);
    setTxDesc('');
    setTxAmount('');
  };

  const handleConfirmClearFinances = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearPassword.trim() !== '8817') {
      setClearError('Senha incorreta! Digite a senha 8817 para autorizar a limpeza do histórico.');
      return;
    }

    try {
      setIsClearing(true);
      await clearAllFinances();
      setIsClearModalOpen(false);
      setClearPassword('');
      setClearError(null);
    } catch (err) {
      console.error('Error clearing finances:', err);
      setClearError('Ocorreu um erro ao limpar o histórico financeiro.');
    } finally {
      setIsClearing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.dosage && p.dosage.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 w-full overflow-hidden">
      
      {/* 4 Financial KPIs Cards (Fluid 1-col on mobile, 2-col on tablet, 4-col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Faturamento Total */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Faturamento Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block">
              R$ {(totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> Receita bruta acumulada
            </span>
          </div>
        </div>

        {/* KPI 2: Lucro Líquido */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Lucro Líquido Real
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight block ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {(netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Margem líquida global: <strong className="text-emerald-300 font-mono">{netMargin.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* KPI 3: Ticket Médio */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block">
              R$ {(averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Por pedido confirmado
            </span>
          </div>
        </div>

        {/* KPI 4: Pedidos Hoje */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pedidos Hoje
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block">
              {ordersTodayCount} {ordersTodayCount === 1 ? 'pedido' : 'pedidos'}
            </span>
            <span className="text-[11px] text-cyan-400 block mt-1">
              {validOrders.length} pedidos no total
            </span>
          </div>
        </div>
      </div>

      {/* Demonstrativo do Resultado do Exercício (DRE Sintético) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                DRE - Demonstrativo de Resultado
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Resumo contábil estruturado de faturamento, custos e lucros
              </p>
            </div>
          </div>
        </div>

        {/* DRE Rows: Mobile Stack / Desktop List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block">
              (+) Receita Bruta de Vendas
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-white mt-1 block">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">100% da base comercial</span>
          </div>

          <div className="bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-amber-400 block">
              (-) Custo dos Produtos (CPV)
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-amber-300 mt-1 block">
              R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : 0}% da receita
            </span>
          </div>

          <div className="bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-cyan-400 block">
              (=) Lucro Bruto
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-cyan-300 mt-1 block">
              R$ {grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-cyan-500/80 block mt-0.5 font-medium">
              Margem Bruta: {grossMargin.toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-emerald-400 block">
              (=) Lucro Líquido Final
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-emerald-400 mt-1 block">
              R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5 font-medium">
              Margem Líquida: {netMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sales Chart with Period Filters */}
      <div className="p-4 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              <span>Evolução de Vendas & Lucro</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Desempenho consolidado por ciclo temporal
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto justify-center">
            {(['Dia', 'Semana', 'Mês'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                  period === p
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white active:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-60 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vendasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="lucroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0f17',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              />
              <Area type="monotone" dataKey="vendas" name="Faturamento" stroke="#00E5FF" strokeWidth={2.5} fillOpacity={1} fill="url(#vendasGrad)" />
              <Area type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#lucroGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Automatic Margin Calculation by Product */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
              <span>Margem de Lucro por Peptídeo</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Cálculo unitário automático com base no preço de venda e custo
            </p>
          </div>

          <div className="w-full sm:w-56">
            <input
              type="text"
              placeholder="Filtrar peptídeo..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 sm:py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 min-h-[38px] sm:min-h-0"
            />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-2.5">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Nenhum produto cadastrado ou encontrado.
            </div>
          ) : (
            filteredProducts.slice(0, 15).map((p) => {
              const price = p.price || 0;
              const costPrice = p.costPrice || 0;
              const profit = price - costPrice;
              const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0';

              return (
                <div key={p.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                        {p.name || 'Produto'}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.dosage && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono text-[10px] font-bold border border-slate-800">
                            {p.dosage}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 truncate">{p.category || 'Geral'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 font-mono">
                      {margin}% margem
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Venda:</span>
                      <strong className="text-white font-mono">R$ {price.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Custo:</span>
                      <span className="text-slate-400 font-mono">R$ {costPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Lucro:</span>
                      <strong className="text-emerald-400 font-mono">+R$ {profit.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Peptídeo</th>
                <th className="py-3 px-3">Dosagem</th>
                <th className="py-3 px-3">Preço Venda</th>
                <th className="py-3 px-3">Preço Custo</th>
                <th className="py-3 px-3">Lucro Unitário</th>
                <th className="py-3 px-3 text-right">Margem %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.slice(0, 15).map((p) => {
                const price = p.price || 0;
                const costPrice = p.costPrice || 0;
                const profit = price - costPrice;
                const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0';
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-white">{p.name || 'Produto'}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-mono">{p.dosage || '-'}</td>
                    <td className="py-2.5 px-3 font-semibold text-white font-mono">R$ {price.toFixed(2).replace('.', ',')}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">R$ {costPrice.toFixed(2).replace('.', ',')}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400 font-mono">+R$ {profit.toFixed(2).replace('.', ',')}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Ledger & Direct Orders Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Controle de Faturamento & Livro Caixa
              </h3>
              <span className="text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                ERP Integrado
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Gerencie lançamentos contábeis e exclua pedidos diretos do faturamento com recálculo automático de DRE
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            {financialTransactions.length > 0 && (
              <button
                onClick={() => {
                  setIsClearModalOpen(true);
                  setClearPassword('');
                  setClearError(null);
                }}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-500/20 transition-all cursor-pointer shadow-sm min-h-[40px] sm:min-h-0"
                title="Zerar histórico de lançamentos (Requer senha 8817)"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Zerar Livro Caixa</span>
              </button>
            )}
            <button
              onClick={() => setIsTxModalOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-500/20 min-h-[40px] sm:min-h-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation for Finanças: Livro Caixa vs Pedidos Diretos */}
        <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveFinanceTab('caixa')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeFinanceTab === 'caixa'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Livro Caixa Geral ({financialTransactions.length})</span>
          </button>
          <button
            onClick={() => setActiveFinanceTab('pedidos')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeFinanceTab === 'pedidos'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pedidos Diretos & Faturamento ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: Livro Caixa Geral (Entradas e Saídas) */}
        {activeFinanceTab === 'caixa' && (
          <div className="space-y-3">
            {/* Mobile View: Cards for Transactions */}
            <div className="block md:hidden space-y-2.5">
              {financialTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Nenhum lançamento financeiro registrado até o momento.
                </div>
              ) : (
                financialTransactions.map((tx) => {
                  const isIncome = tx.type === 'ENTRADA';
                  const isDirectOrder = !!tx.orderId || tx.description.includes('#PI-');
                  return (
                    <div
                      key={tx.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isIncome
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {tx.type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{tx.date}</span>
                          {isDirectOrder && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-md font-bold">
                              Pedido Direto
                            </span>
                          )}
                        </div>

                        <span className={`font-mono font-bold text-xs sm:text-sm ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isIncome ? '+' : '-'} R$ {(tx.amount || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                        <div>
                          <h5 className="font-semibold text-white text-xs">{tx.description}</h5>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{tx.category}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteTxItem(tx)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer min-h-[34px]"
                          title={isDirectOrder ? 'Excluir este pedido direto do faturamento' : 'Excluir lançamento'}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isDirectOrder ? 'Excluir Pedido' : 'Excluir'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Descrição</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3 text-right">Valor</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {financialTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        Nenhum lançamento financeiro registrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    financialTransactions.map((tx) => {
                      const isIncome = tx.type === 'ENTRADA';
                      const isDirectOrder = !!tx.orderId || tx.description.includes('#PI-');
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{tx.date}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isIncome
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-white font-medium">
                            <div className="flex items-center gap-1.5">
                              <span>{tx.description}</span>
                              {isDirectOrder && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded font-bold">
                                  Direto
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{tx.category}</td>
                          <td className={`py-2.5 px-3 text-right font-bold text-sm font-mono ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isIncome ? '+' : '-'} R$ {(tx.amount || 0).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleDeleteTxItem(tx)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                              title={isDirectOrder ? 'Excluir este pedido direto do faturamento' : 'Excluir lançamento contábil'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">{isDirectOrder ? 'Excluir Pedido' : 'Excluir'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Pedidos Diretos & Faturamento */}
        {activeFinanceTab === 'pedidos' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Lista de <strong>{orders.length} pedidos diretos</strong> registrados no sistema. A exclusão de um pedido aqui recalcula o faturamento bruto, o CPV e o DRE instantaneamente.
                </span>
              </div>
            </div>

            {/* Mobile View: Cards for Orders */}
            <div className="block md:hidden space-y-3">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Nenhum pedido direto registrado no sistema.
                </div>
              ) : (
                orders.map((order) => {
                  const orderCost = (order.items || []).reduce(
                    (sum, item) => sum + (item.product?.costPrice || 0) * (item.quantity || 1),
                    0
                  );
                  const orderProfit = (order.total || 0) - orderCost;
                  const dateFormatted = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-';

                  return (
                    <div key={order.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-cyan-400 font-mono text-xs">{order.orderNumber}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {order.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{dateFormatted}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total</span>
                          <span className="font-bold text-white font-mono text-sm">
                            R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-slate-500">Cliente: </span>
                        <strong>{order.customer?.name || 'Cliente'}</strong> ({order.customer?.phone || 'Sem telefone'})
                      </div>

                      {/* Products overview */}
                      <div className="p-2 bg-slate-900/90 rounded-xl text-[11px] space-y-1 border border-slate-800/80">
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300">
                            <span className="truncate max-w-[200px]">{it.quantity}x {it.product?.name || 'Peptídeo'} {it.product?.dosage}</span>
                            <span className="font-mono text-slate-400">R$ {((it.product?.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Cost & Profit Calculation */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
                        <div className="p-1.5 bg-slate-900/60 rounded-lg">
                          <span className="text-slate-500 block text-[10px]">Custo (CPV)</span>
                          <span className="text-slate-300 font-mono font-semibold">R$ {orderCost.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="p-1.5 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
                          <span className="text-emerald-400/80 block text-[10px]">Lucro Direto</span>
                          <span className="text-emerald-400 font-mono font-bold">+R$ {orderProfit.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>

                      {/* Delete Order Action */}
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setOrderToDeleteFromFinance(order);
                            setDeletePassword('');
                            setDeleteError(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px]"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span>Excluir Pedido Direto</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Orders Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Pedido</th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Itens</th>
                    <th className="py-3 px-3">Pagamento</th>
                    <th className="py-3 px-3 text-right">Faturamento</th>
                    <th className="py-3 px-3 text-right">CPV (Custo)</th>
                    <th className="py-3 px-3 text-right">Lucro</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                        Nenhum pedido direto registrado no sistema.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const orderCost = (order.items || []).reduce(
                        (sum, item) => sum + (item.product?.costPrice || 0) * (item.quantity || 1),
                        0
                      );
                      const orderProfit = (order.total || 0) - orderCost;
                      const dateFormatted = order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '-';

                      return (
                        <tr key={order.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3">
                            <span className="font-extrabold text-cyan-400 font-mono">{order.orderNumber}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{dateFormatted}</td>
                          <td className="py-2.5 px-3 text-white font-medium">
                            <div>{order.customer?.name || 'Cliente'}</div>
                            <div className="text-[10px] text-slate-500">{order.customer?.phone || '-'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            <div className="text-[11px] truncate max-w-[160px]" title={(order.items || []).map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}>
                              {(order.items || []).map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {order.paymentMethod || 'PIX'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white font-mono">
                            R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                            R$ {orderCost.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                            +R$ {orderProfit.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setOrderToDeleteFromFinance(order);
                                setDeletePassword('');
                                setDeleteError(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer mx-auto shadow-sm"
                              title="Excluir este pedido direto do faturamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir Pedido</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Transaction Modal (Mobile Friendly) */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsTxModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-white mb-4 pr-10">
              Novo Lançamento Financeiro
            </h3>

            <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('ENTRADA')}
                    className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer min-h-[42px] ${
                      txType === 'ENTRADA' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('SAIDA')}
                    className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer min-h-[42px] ${
                      txType === 'SAIDA' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Saída (Despesa)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Descrição</label>
                <textarea
                  required
                  rows={3}
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Ex: Embalagens isotérmicas Sedex, insumos laboratoriais..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500 resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Categoria</label>
                  <input
                    type="text"
                    required
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    placeholder="Ex: Logística, Fornecedor"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500 text-xs min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:border-cyan-500 font-mono text-xs min-h-[40px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5 min-h-[42px]"
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>Salvar Lançamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Zerar Histórico Financeiro com Senha 8817 (Mobile Friendly) */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-red-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (!isClearing) {
                  setIsClearModalOpen(false);
                  setClearPassword('');
                  setClearError(null);
                }
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="p-2.5 bg-red-500/15 text-red-400 rounded-xl border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="pr-8">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                  Ação Crítica de Administrador
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Zerar Livro Caixa Financeiro
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmClearFinances} className="space-y-4">
              <div className="p-3 bg-red-950/25 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Esta ação excluirá permanentemente todos os lançamentos do livro caixa do banco de dados para iniciar o controle do zero.
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Senha de Confirmação:
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono font-semibold">Senha: 8817</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    value={clearPassword}
                    onChange={(e) => {
                      setClearPassword(e.target.value);
                      if (clearError) setClearError(null);
                    }}
                    placeholder="Digite a senha 8817"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 placeholder-slate-600 font-mono tracking-widest min-h-[44px]"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              {clearError && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{clearError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => {
                    setIsClearModalOpen(false);
                    setClearPassword('');
                    setClearError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isClearing || !clearPassword.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
                >
                  {isClearing ? (
                    <span>Limpando...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmar Limpeza</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Pedido Direto do Faturamento (Senha 8817) */}
      {orderToDeleteFromFinance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-red-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (!isDeleting) {
                  setOrderToDeleteFromFinance(null);
                  setDeletePassword('');
                  setDeleteError(null);
                }
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="p-2.5 bg-red-500/15 text-red-400 rounded-xl border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="pr-8">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                  Finanças & DRE - Exclusão Direta
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Excluir Pedido {orderToDeleteFromFinance.orderNumber}
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmDeleteOrderFromFinance} className="space-y-3.5">
              {/* Resumo do Pedido */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="text-white font-semibold truncate max-w-[200px]">{orderToDeleteFromFinance.customer?.name || 'Cliente'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Faturamento Bruto:</span>
                  <span className="text-emerald-400 font-bold font-mono">R$ {(orderToDeleteFromFinance.total || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma de Pagamento:</span>
                  <span className="text-cyan-400 font-semibold">{orderToDeleteFromFinance.paymentMethod || 'PIX'}</span>
                </div>
              </div>

              <div className="p-3 bg-red-950/25 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  A exclusão deste pedido removerá o lançamento do Livro Caixa e recalculará as receitas, CPV e Lucro Líquido do DRE. Confirme com a senha de administrador:
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Senha de Confirmação:
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono font-semibold">Senha: 8817</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError(null);
                    }}
                    placeholder="Digite a senha 8817"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 placeholder-slate-600 font-mono tracking-widest min-h-[42px]"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                </div>
              </div>

              {deleteError && (
                <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setOrderToDeleteFromFinance(null);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
                >
                  {isDeleting ? (
                    <span>Excluindo Pedido...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmar Exclusão</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Lançamento Avulso do Livro Caixa (Senha 8817) */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-red-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (!isDeleting) {
                  setTxToDelete(null);
                  setDeletePassword('');
                  setDeleteError(null);
                }
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="p-2.5 bg-red-500/15 text-red-400 rounded-xl border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="pr-8">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                  Exclusão de Lançamento
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Excluir {txToDelete.type} do Livro Caixa
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmDeleteTx} className="space-y-3.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="text-white font-semibold">{txToDelete.description}</div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Valor:</span>
                  <span className={`font-mono font-bold ${txToDelete.type === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'}`}>
                    R$ {(txToDelete.amount || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Senha de Confirmação:
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono font-semibold">Senha: 8817</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError(null);
                    }}
                    placeholder="Digite a senha 8817"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 placeholder-slate-600 font-mono tracking-widest min-h-[42px]"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                </div>
              </div>

              {deleteError && (
                <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setTxToDelete(null);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
                >
                  {isDeleting ? <span>Excluindo...</span> : <span>Confirmar Exclusão</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
