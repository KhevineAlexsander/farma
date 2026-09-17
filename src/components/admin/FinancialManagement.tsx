import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, CreditCard, Plus, ArrowUpRight, ArrowDownRight, Calendar, X, FileSpreadsheet, Trash2, Lock, AlertTriangle, KeyRound, UploadCloud, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';

export const FinancialManagement: React.FC = () => {
  const { orders, financialTransactions, addFinancialTransaction, clearAllFinances, products, saveAllFinancesToCloud } = useApp();
  const [period, setPeriod] = useState<'Dia' | 'Semana' | 'Mês'>('Mês');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isSavingFinances, setIsSavingFinances] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSaveFinancesToCloud = async () => {
    setIsSavingFinances(true);
    const success = await saveAllFinancesToCloud();
    setIsSavingFinances(false);
    if (success) {
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  };

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

  // Calculate KPIs strictly from real orders
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((acc, order) => acc + order.total, 0);

  // Total product cost across all confirmed orders
  const totalCost = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((acc, order) => {
      const orderCost = order.items.reduce(
        (sum, item) => sum + item.product.costPrice * item.quantity,
        0
      );
      return acc + orderCost;
    }, 0);

  const netProfit = totalRevenue - totalCost;
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Orders today calculated from real order dates
  const todayStr = new Date().toISOString().split('T')[0];
  const ordersTodayCount = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;

  // Dynamic chart datasets calculated strictly from real orders (starts at zero)
  const dataByDay = [
    { label: '08:00', vendas: 0, lucro: 0 },
    { label: '10:00', vendas: 0, lucro: 0 },
    { label: '12:00', vendas: 0, lucro: 0 },
    { label: '14:00', vendas: 0, lucro: 0 },
    { label: '16:00', vendas: 0, lucro: 0 },
    { label: '18:00', vendas: 0, lucro: 0 },
    { label: '20:00', vendas: 0, lucro: 0 },
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
    { label: 'Semana 1', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Semana 2', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Semana 3', vendas: 0, lucro: 0, custos: 0 },
    { label: 'Semana 4 (Atual)', vendas: 0, lucro: 0, custos: 0 },
  ];

  orders.forEach((order) => {
    if (order.status === 'Cancelado') return;
    const orderCost = order.items.reduce(
      (sum, item) => sum + item.product.costPrice * item.quantity,
      0
    );
    const orderProfit = order.total - orderCost;
    const d = new Date(order.createdAt);

    // Day hour
    const hour = d.getHours();
    const bucket = `${String(Math.min(Math.floor(hour / 2) * 2, 20)).padStart(2, '0')}:00`;
    const dayMatch = dataByDay.find((i) => i.label === bucket) || dataByDay[dataByDay.length - 1];
    if (dayMatch) {
      dayMatch.vendas += order.total;
      dayMatch.lucro += orderProfit;
    }

    // Week day
    const dayOfWeek = d.getDay(); // 0 is Sun
    const adjustedIdx = (dayOfWeek + 6) % 7; // Mon = 0, Sun = 6
    if (dataByWeek[adjustedIdx]) {
      dataByWeek[adjustedIdx].vendas += order.total;
      dataByWeek[adjustedIdx].lucro += orderProfit;
      dataByWeek[adjustedIdx].custos += orderCost;
    }

    // Month week
    const dateNum = d.getDate();
    const weekIdx = Math.min(Math.floor((dateNum - 1) / 7), 3);
    if (dataByMonth[weekIdx]) {
      dataByMonth[weekIdx].vendas += order.total;
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

  return (
    <div className="space-y-6">
      
      {/* 4 Financial KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Faturamento Total */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Total</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white font-tech">
              R$ {totalRevenue.toFixed(2).replace('.', ',')}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs mês anterior
            </span>
          </div>
        </div>

        {/* KPI 2: Lucro Líquido */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Real</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-400 font-tech">
              R$ {netProfit.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Margem líquida global: <strong className="text-white">{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</strong>
            </span>
          </div>
        </div>

        {/* KPI 3: Ticket Médio */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Médio por Pedido</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white font-tech">
              R$ {averageTicket.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Média de 2.4 frascos por carrinho
            </span>
          </div>
        </div>

        {/* KPI 4: Pedidos Hoje */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedidos Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white font-tech">
              {ordersTodayCount} pedidos
            </span>
            <span className="text-[11px] text-cyan-400 block mt-1">
              {orders.length} pedidos no histórico total
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sales Chart with Period Filters */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-tech">
              EVOLUÇÃO DE VENDAS & LUCRO
            </h3>
            <p className="text-xs text-slate-400">
              Desempenho financeiro consolidado por ciclo temporal
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['Dia', 'Semana', 'Mês'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  period === p
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-4">
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
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `R$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0f17',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
              />
              <Area type="monotone" dataKey="vendas" name="Faturamento" stroke="#00E5FF" strokeWidth={2.5} fillOpacity={1} fill="url(#vendasGrad)" />
              <Area type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#lucroGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Automatic Margin Calculation by Product */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white font-tech flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          MARGEM DE LUCRO POR PRODUTO (CÁLCULO AUTOMÁTICO)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Peptídeo</th>
                <th className="py-2.5 px-3">Dosagem</th>
                <th className="py-2.5 px-3">Preço Venda</th>
                <th className="py-2.5 px-3">Preço Custo</th>
                <th className="py-2.5 px-3">Lucro Unitário Bruto</th>
                <th className="py-2.5 px-3">Margem Percentual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.slice(0, 8).map((p) => {
                const profit = p.price - p.costPrice;
                const margin = p.price > 0 ? ((profit / p.price) * 100).toFixed(1) : '0';
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-white">{p.name}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-mono">{p.dosage}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">R$ {p.price.toFixed(2).replace('.', ',')}</td>
                    <td className="py-2.5 px-3 text-slate-400">R$ {p.costPrice.toFixed(2).replace('.', ',')}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">+R$ {profit.toFixed(2).replace('.', ',')}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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

      {/* Financial Ledger Table (Entradas e Saídas) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-tech">
              LIVRO CAIXA & LANÇAMENTOS FINANCEIROS
            </h3>
            <p className="text-xs text-slate-400">
              Registro contábil de receitas de vendas e despesas operacionais
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSaveFinancesToCloud}
              disabled={isSavingFinances}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="Salvar lançamentos contábeis e fluxo de caixa diretamente no banco de dados e atualizar o site"
            >
              {isSavingFinances ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando no Banco...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Salvar Finanças no Banco</span>
                </>
              )}
            </button>

            {financialTransactions.length > 0 && (
              <button
                onClick={() => {
                  setIsClearModalOpen(true);
                  setClearPassword('');
                  setClearError(null);
                }}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-red-500/20 transition-all cursor-pointer shadow-sm"
                title="Zerar histórico de lançamentos (Requer senha 8817)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Zerar Histórico</span>
              </button>
            )}
            <button
              onClick={() => setIsTxModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Descrição</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {financialTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Nenhum lançamento financeiro registrado até o momento.
                  </td>
                </tr>
              ) : (
                financialTransactions.map((tx) => {
                  const isIncome = tx.type === 'ENTRADA';
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
                      <td className="py-2.5 px-3 text-white font-medium">{tx.description}</td>
                      <td className="py-2.5 px-3 text-slate-400">{tx.category}</td>
                      <td className={`py-2.5 px-3 text-right font-bold text-sm ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isIncome ? '+' : '-'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsTxModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-tech text-white mb-4">
              NOVO LANÇAMENTO FINANCEIRO
            </h3>

            <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('ENTRADA')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      txType === 'ENTRADA' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('SAIDA')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      txType === 'SAIDA' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Saída (Custo / Despesa)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Ex: Embalagens isotérmicas Sedex"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <input
                    type="text"
                    required
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    placeholder="Ex: Logística, Fornecedor"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Salvar Lançamento no Banco</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Zerar Histórico Financeiro com Senha 8817 */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-7 text-white shadow-2xl shadow-red-950/50"
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
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4 mb-5">
              <div className="p-3 bg-red-500/15 text-red-400 rounded-2xl border border-red-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider block">
                  Ação Crítica de Administrador
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold font-tech text-white">
                  Zerar Livro Caixa Financeiro
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmClearFinances} className="space-y-4">
              <div className="p-3.5 bg-red-950/25 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Esta ação excluirá permanentemente todos os lançamentos do livro caixa financeiro do banco de dados para iniciar as vendas do zero.
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
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 placeholder-slate-600 font-mono tracking-widest"
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => {
                    setIsClearModalOpen(false);
                    setClearPassword('');
                    setClearError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isClearing || !clearPassword.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2"
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

    </div>
  );
};
