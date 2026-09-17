import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, CheckCircle2, XCircle, Copy, Check, Percent, DollarSign, Calendar, TrendingUp, Sparkles, AlertCircle, UploadCloud, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Coupon } from '../../types';

export const CouponManagement: React.FC = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, showToast, saveAllCouponsToCloud } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSavingCoupons, setIsSavingCoupons] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSaveCouponsToCloud = async () => {
    setIsSavingCoupons(true);
    const success = await saveAllCouponsToCloud();
    setIsSavingCoupons(false);
    if (success) {
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(150);
  const [maxUsage, setMaxUsage] = useState<number | ''>(100);
  const [expiresAt, setExpiresAt] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setType('PERCENTAGE');
    setValue(10);
    setMinOrderAmount(150);
    setMaxUsage(100);
    setExpiresAt('');
    setDescription('');
    setStatus('Ativo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setType(c.type);
    setValue(c.value);
    setMinOrderAmount(c.minOrderAmount ?? '');
    setMaxUsage(c.maxUsage ?? '');
    setExpiresAt(c.expiresAt ?? '');
    setDescription(c.description ?? '');
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
    if (!cleanCode) {
      alert('Informe um código de cupom válido (apenas letras, números, hífen ou underline).');
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      alert('O valor do desconto deve ser maior que zero.');
      return;
    }

    if (type === 'PERCENTAGE' && numValue > 100) {
      alert('O desconto em porcentagem não pode ultrapassar 100%.');
      return;
    }

    // Check duplicate code on create or edit
    const isDuplicate = coupons.some(
      (c) => c.code === cleanCode && (!editingCoupon || c.id !== editingCoupon.id)
    );
    if (isDuplicate) {
      alert(`Já existe um cupom com o código "${cleanCode}".`);
      return;
    }

    const payload = {
      code: cleanCode,
      type,
      value: Number(value),
      minOrderAmount: minOrderAmount !== '' ? Number(minOrderAmount) : undefined,
      maxUsage: maxUsage !== '' ? Number(maxUsage) : undefined,
      expiresAt: expiresAt ? expiresAt : undefined,
      description: description.trim() || undefined,
      status,
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, payload);
    } else {
      addCoupon(payload);
    }

    setIsModalOpen(false);
  };

  const handleCopyCode = (cCode: string) => {
    navigator.clipboard.writeText(cCode);
    setCopiedCode(cCode);
    showToast(`Código "${cCode}" copiado para a área de transferência!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = (c: Coupon) => {
    if (window.confirm(`Tem certeza que deseja excluir o cupom "${c.code}"?`)) {
      deleteCoupon(c.id);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPIs
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.status === 'Ativo').length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-tech flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-cyan-400" />
            GESTÃO DE CUPONS DE DESCONTO
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crie cupons promocionais para seus clientes com porcentagem, desconto em reais, limite de pedido mínimo e controle de uso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleSaveCouponsToCloud}
            disabled={isSavingCoupons}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Salvar todos os cupons e regras de desconto diretamente no banco de dados e atualizar o site"
          >
            {isSavingCoupons ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gravando no Banco...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Salvar Cupons no Banco</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Cupom</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Total de Cupons</span>
            <span className="text-xl font-bold font-tech text-white">{totalCoupons}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Cupons Ativos</span>
            <span className="text-xl font-bold font-tech text-emerald-400">{activeCoupons}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Utilizações Registradas</span>
            <span className="text-xl font-bold font-tech text-cyan-400">{totalUsages} usos</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código ou descrição do cupom..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <span className="text-slate-400 text-xs shrink-0">Status:</span>
          {(['Todos', 'Ativo', 'Inativo'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Tag className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">Nenhum cupom encontrado</p>
          <p className="text-xs text-slate-500">Crie seu primeiro cupom promocional para alavancar suas vendas no site!</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Primeiro Cupom</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((c) => {
            const isPercentage = c.type === 'PERCENTAGE';
            const usagePercent = c.maxUsage ? Math.min(100, Math.round((c.usageCount / c.maxUsage) * 100)) : null;

            return (
              <div
                key={c.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all ${
                  c.status === 'Ativo' ? 'border-slate-800 hover:border-cyan-500/50' : 'border-slate-800/60 opacity-70'
                }`}
              >
                <div>
                  {/* Top card bar: Code and Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-cyan-300 tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                        {c.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Copiar código"
                      >
                        {copiedCode === c.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCouponStatus(c.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        c.status === 'Ativo'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                      }`}
                      title="Clique para alternar o status"
                    >
                      {c.status}
                    </button>
                  </div>

                  {/* Value / Discount Badge */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-black font-tech text-white">
                      {isPercentage ? `${c.value}% OFF` : `R$ ${c.value.toFixed(2).replace('.', ',')} OFF`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isPercentage ? 'Desconto percentual' : 'Desconto fixo'}
                    </span>
                  </div>

                  {/* Rules & description */}
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                    <p className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Pedido Mínimo:</span>
                      <strong className="text-slate-200">
                        {c.minOrderAmount ? `R$ ${c.minOrderAmount.toFixed(2).replace('.', ',')}` : 'Sem valor mínimo'}
                      </strong>
                    </p>

                    <p className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Validade:</span>
                      <strong className="text-slate-200">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : 'Indeterminada'}
                      </strong>
                    </p>

                    {c.description && (
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 leading-relaxed italic">
                        "{c.description}"
                      </p>
                    )}
                  </div>

                  {/* Usages Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                      <span>Utilizações:</span>
                      <span className="text-cyan-400">
                        {c.usageCount} {c.maxUsage ? `/ ${c.maxUsage} permitidos` : 'usos (ilimitado)'}
                      </span>
                    </div>
                    {c.maxUsage && (
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (usagePercent ?? 0) >= 90
                              ? 'bg-red-500'
                              : (usagePercent ?? 0) >= 60
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white animate-fade-in max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-tech text-white">
                    {editingCoupon ? 'EDITAR CUPOM PROMOCIONAL' : 'CRIAR NOVO CUPOM'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina as regras de desconto que serão validadas no carrinho e checkout.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Coupon Code */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Código do Cupom * (letras maiúsculas e números)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: PEPTIDE15, BEMVINDO, VIP50"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase font-bold focus:outline-none focus:border-cyan-500 tracking-wider"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  O cliente digitará exatamente este código para aplicar o desconto no carrinho ou no checkout.
                </span>
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Desconto</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {type === 'PERCENTAGE' ? 'Porcentagem de Desconto (%) *' : 'Valor do Desconto (R$) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={type === 'PERCENTAGE' ? '1' : '0.01'}
                      min="0.01"
                      required
                      value={value}
                      onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {type === 'PERCENTAGE' ? '%' : 'R$'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Min Cart and Max Usages */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Valor Mínimo do Pedido (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ex: 200 (vazio = sem mínimo)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Limite Máximo de Usos
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="Ex: 50 (vazio = ilimitado)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Data de Expiração (Opcional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Descrição / Finalidade da Campanha
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Cupom especial distribuído para novos clientes no direct do Instagram ou WhatsApp."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status do Cupom</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="couponStatus"
                      checked={status === 'Ativo'}
                      onChange={() => setStatus('Ativo')}
                      className="accent-cyan-500"
                    />
                    <span>Ativo (Clientes podem aplicar)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="couponStatus"
                      checked={status === 'Inativo'}
                      onChange={() => setStatus('Inativo')}
                      className="accent-red-500"
                    />
                    <span>Inativo (Pausado temporariamente)</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{editingCoupon ? 'Salvar Alterações no Banco' : 'Salvar Cupom no Banco'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
