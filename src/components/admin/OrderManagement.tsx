import React, { useState } from 'react';
import { Search, Eye, Truck, CheckCircle2, Clock, X, MapPin, Phone, Mail, FileText, CheckCircle, MessageSquare, ShieldCheck, Package, CreditCard, Trash2, Lock, AlertTriangle, KeyRound, UploadCloud, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { PeptideVial } from '../PeptideVial';

export const OrderManagement: React.FC = () => {
  const { orders, updateOrderStatus, clearOrderManually, deleteOrder, currentUser, storeSettings, saveAllOrdersToCloud } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSaveOrdersToCloud = async () => {
    setIsSavingOrders(true);
    const success = await saveAllOrdersToCloud();
    setIsSavingOrders(false);
    if (success) {
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // Manual clearance modal state
  const [clearingOrder, setClearingOrder] = useState<Order | null>(null);
  const [clearStatus, setClearStatus] = useState<OrderStatus>('Pago');
  const [clearNotes, setClearNotes] = useState('');
  const [operatorName, setOperatorName] = useState(currentUser?.name || 'Administrador');

  // Delete Order with Password 8817 state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statuses: OrderStatus[] = [
    'Pendente',
    'Pago',
    'Em Separação',
    'Enviado',
    'Entregue',
    'Cancelado',
  ];

  const statusOptions: { status: OrderStatus; label: string; icon: any; color: string; desc: string }[] = [
    { status: 'Pendente', label: 'Pendente', icon: Clock, color: 'border-amber-500/50 bg-amber-500/10 text-amber-400', desc: 'Aguardando baixa' },
    { status: 'Pago', label: 'Pago', icon: CheckCircle, color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400', desc: 'Comprovante conferido' },
    { status: 'Em Separação', label: 'Em Separação', icon: Package, color: 'border-purple-500/50 bg-purple-500/10 text-purple-400', desc: 'Embalagem térmica' },
    { status: 'Enviado', label: 'Enviado', icon: Truck, color: 'border-blue-500/50 bg-blue-500/10 text-blue-400', desc: 'Despachado' },
    { status: 'Entregue', label: 'Entregue', icon: ShieldCheck, color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400', desc: 'Pedido concluído' },
    { status: 'Cancelado', label: 'Cancelado', icon: X, color: 'border-red-500/50 bg-red-500/10 text-red-400', desc: 'Cancelado' },
  ];

  const filteredOrders = orders.filter((order) => {
    let matchesStatus = true;
    if (statusFilter === 'Aguardando Baixa') {
      matchesStatus = order.status === 'Pendente' || !order.clearedManuallyAt;
    } else if (statusFilter !== 'Todos') {
      matchesStatus = order.status === statusFilter;
    }

    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (order.orderNumber || '').toLowerCase().includes(q) ||
      (order.customer?.name || '').toLowerCase().includes(q) ||
      (order.customer?.email || '').toLowerCase().includes(q) ||
      (typeof order.customer?.phone === 'string' && order.customer.phone.includes(q));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Entregue':
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'Entregue' };
      case 'Enviado':
        return { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40', text: 'Enviado' };
      case 'Em Separação':
        return { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', text: 'Em Separação' };
      case 'Pago':
        return { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', text: 'Pago' };
      case 'Cancelado':
        return { bg: 'bg-red-500/20 text-red-300 border-red-500/40', text: 'Cancelado' };
      default:
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', text: 'Pendente' };
    }
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setTrackingInput(order.trackingCode || '');
  };

  const handleUpdateStatus = (status: OrderStatus) => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, status, trackingInput || selectedOrder.trackingCode);
    setSelectedOrder({
      ...selectedOrder,
      status,
      trackingCode: trackingInput || selectedOrder.trackingCode,
    });
  };

  const handleOpenClearModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setClearingOrder(order);
    setClearStatus('Pago');
    setClearNotes(order.notes || 'Comprovante conferido e validado via WhatsApp. Pagamento recebido.');
    setOperatorName(currentUser?.name || 'Administrador');
  };

  const handleConfirmClear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearingOrder) return;

    clearOrderManually(clearingOrder.id, clearStatus, operatorName, clearNotes);

    if (selectedOrder && selectedOrder.id === clearingOrder.id) {
      setSelectedOrder({
        ...selectedOrder,
        status: clearStatus,
        clearedManuallyAt: new Date().toLocaleString('pt-BR'),
        clearedBy: operatorName,
        notes: clearNotes,
      });
    }

    setClearingOrder(null);
  };

  const handleOpenDeleteModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOrderToDelete(order);
    setDeletePassword('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToDelete) return;

    if (deletePassword.trim() !== '8817') {
      setDeleteError('Senha incorreta! Digite a senha 8817 para autorizar a exclusão.');
      return;
    }

    try {
      setIsDeleting(true);
      const targetId = orderToDelete.id;
      await deleteOrder(targetId);

      if (selectedOrder && selectedOrder.id === targetId) {
        setSelectedOrder(null);
      }
      setOrderToDelete(null);
      setDeletePassword('');
      setDeleteError(null);
    } catch (err) {
      console.error('Error executing delete order:', err);
      setDeleteError('Ocorreu um erro ao excluir o pedido. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCustomerWhatsappUrl = (order: Order) => {
    const cleanPhone = (order.customer?.phone || '').replace(/\D/g, '');
    const customerName = order.customer?.name || 'Cliente';
    const msg = `Olá ${customerName}, aqui é da equipe ${storeSettings.storeName || 'PEPTIDE IMPORTS FARMA'}. Estamos em contato a respeito do seu pedido ${order.orderNumber}!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const pendingCount = orders.filter((o) => o.status === 'Pendente' || !o.clearedManuallyAt).length;

  return (
    <div className="space-y-6">
      
      {/* Top Bar Summary & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-tech tracking-wide">
                Controle de Pedidos e Baixa Manual
              </h2>
              <p className="text-xs text-slate-400">
                Localize o pedido, confira as informações e realize a baixa manual com segurança.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Aguardando Baixa ({pendingCount})</span>
          </div>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nº do pedido, cliente ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['Todos', ...statuses].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={() => setStatusFilter('Aguardando Baixa')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              statusFilter === 'Aguardando Baixa'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-950 text-amber-300/80 border-amber-500/20 hover:bg-amber-500/10'
            }`}
          >
            Filtros
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-5 whitespace-nowrap">Pedido</th>
                <th className="py-4 px-5">Cliente / Contato</th>
                <th className="py-4 px-5">Itens</th>
                <th className="py-4 px-5 whitespace-nowrap">Total</th>
                <th className="py-4 px-5 whitespace-nowrap">Pagamento</th>
                <th className="py-4 px-5 whitespace-nowrap">Status / Baixa</th>
                <th className="py-4 px-5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                        <Package className="w-7 h-7 text-cyan-400" />
                      </div>
                      <p className="text-white font-bold text-sm sm:text-base">
                        {orders.length === 0
                          ? 'Nenhum pedido registrado no momento'
                          : 'Nenhum pedido encontrado com os filtros selecionados'}
                      </p>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {orders.length === 0
                          ? 'O sistema está zerado e pronto para o início das vendas reais! Conforme novos pedidos forem realizados, eles serão sincronizados aqui em tempo real.'
                          : 'Tente alterar os termos de busca ou o filtro de status para ver os pedidos cadastrados.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-bold text-cyan-400 block text-sm font-tech tracking-wide">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-100 block text-sm">{order.customer?.name || 'Cliente'}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{order.customer?.phone || '-'}</span>
                          {order.customer?.phone && (
                            <a
                              href={getCustomerWhatsappUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                              title="Conversar no WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-200">
                          {(order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)} frasco(s)
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                          {(order.items || []).map((i) => i.product?.name || 'Item').join(', ')}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-5 font-extrabold text-white text-sm whitespace-nowrap">
                        R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-700/80 text-slate-300 whitespace-nowrap shadow-sm">
                          {(order.paymentMethod || '').includes('WhatsApp') && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                          )}
                          {(order.paymentMethod || '').includes('PIX') && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
                          )}
                          {(order.paymentMethod || '').includes('Cartão') && (
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{order.paymentMethod || 'A Combinar'}</span>
                        </span>
                      </td>

                      {/* Status & Baixa indicator */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${badge.bg}`}>
                            {badge.text}
                          </span>
                          {order.clearedManuallyAt ? (
                            <span className="block text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Baixa por {order.clearedBy}
                            </span>
                          ) : (
                            <span className="block text-[11px] text-amber-400 font-medium">
                              Aguardando baixa manual
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          <button
                            onClick={(e) => handleOpenClearModal(order, e)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                            title="Dar baixa manual neste pedido"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Baixa</span>
                          </button>
                          <button
                            onClick={() => handleOpenDetail(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-800 cursor-pointer"
                            title="Ver detalhes do pedido"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(order, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all border border-red-500/20 cursor-pointer shadow-sm"
                            title="Excluir pedido (Requer senha 8817)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 text-center">
          Mostrando {filteredOrders.length} de {orders.length} pedidos
        </div>
      </div>

      {/* Modal: Manual Clearance (Baixa Manual) - Redesigned */}
      {clearingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setClearingOrder(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4 mb-5">
              <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Conferência de Pedido</span>
                <h3 className="text-xl font-extrabold font-tech text-white">
                  Dar baixa manual: {clearingOrder.orderNumber}
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmClear} className="space-y-6 text-xs">
              
              {/* Big Summary Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CLIENTE</span>
                  <p className="font-bold text-white text-sm mt-0.5">{clearingOrder.customer?.name || 'Cliente'}</p>
                  <p className="text-slate-400 text-[11px]">{clearingOrder.customer?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">VALOR TOTAL</span>
                  <p className="font-extrabold text-cyan-400 text-sm mt-0.5 font-tech">
                    R$ {(clearingOrder.total || 0).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PAGAMENTO</span>
                  <p className="font-bold text-slate-200 text-xs mt-0.5 truncate">{clearingOrder.paymentMethod || 'A Combinar'}</p>
                </div>
              </div>

              {/* Status Selection Cards */}
              <div className="space-y-2.5">
                <label className="block text-slate-200 font-bold text-xs tracking-wide">
                  Qual será o novo status do pedido?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {statusOptions.map((opt) => {
                    const isSelected = clearStatus === opt.status;
                    return (
                      <div
                        key={opt.status}
                        onClick={() => setClearStatus(opt.status)}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/15 shadow-md shadow-cyan-500/10'
                            : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <opt.icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                            isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block">{opt.label}</span>
                          <span className="text-[10px] text-slate-400 leading-tight block">{opt.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-1 flex items-center gap-2 text-xs text-cyan-300 font-semibold bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                  <span>Status selecionado:</span>
                  <span className="font-extrabold underline">✓ {clearStatus}</span>
                </div>
              </div>

              {/* Operator & Payment display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Forma de Pagamento
                  </label>
                  <input
                    type="text"
                    disabled
                    value={clearingOrder.paymentMethod}
                    className="w-full px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-xs cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Operador / Atendente Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  value={clearNotes}
                  onChange={(e) => setClearNotes(e.target.value)}
                  placeholder="Digite uma observação sobre este pedido..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
              </div>

              {/* Items Summary */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                  Itens do Pedido ({(clearingOrder.items || []).reduce((s, i) => s + (i.quantity || 0), 0)} frascos)
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(clearingOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        {item.quantity} frasco(s) — {item.product?.name || 'Produto'} ({item.product?.dosage || '-'})
                      </span>
                      <span className="font-bold text-white">
                        R$ {((item.product?.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Confirmation Box */}
              <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl space-y-1.5">
                <p className="text-xs font-bold text-cyan-300">Confira os dados antes de confirmar a baixa:</p>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <p>• Pedido: <strong>{clearingOrder.orderNumber}</strong></p>
                  <p>• Novo status: <strong className="text-cyan-400">{clearStatus}</strong></p>
                  <p>• Valor total: <strong>R$ {(clearingOrder.total || 0).toFixed(2).replace('.', ',')}</strong></p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClearingOrder(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>✓ Confirmar Baixa Manual</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Gestão do Pedido</span>
                <h3 className="text-2xl font-extrabold font-tech text-white">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenDeleteModal(selectedOrder)}
                  className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-red-500/30 cursor-pointer shadow-sm"
                  title="Excluir este pedido definitivamente (requer senha 8817)"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Pedido</span>
                </button>
                <button
                  onClick={() => handleOpenClearModal(selectedOrder)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Dar Baixa Manual</span>
                </button>
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${getStatusBadge(selectedOrder.status).bg}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Clearance Audit Info */}
            {selectedOrder.clearedManuallyAt && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 mb-6 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Baixa Manual Efetuada no Sistema</p>
                  <p className="text-[11px] text-emerald-200/80">
                    Realizada em {selectedOrder.clearedManuallyAt} por <strong>{selectedOrder.clearedBy}</strong>.
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-[11px] text-slate-300 mt-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <strong>Obs:</strong> {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
              {/* Customer Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Dados do Cliente
                  </h4>
                  {selectedOrder.customer?.phone && (
                    <a
                      href={getCustomerWhatsappUrl(selectedOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
                <p className="text-white font-bold text-sm">{selectedOrder.customer?.name || 'Cliente'}</p>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {selectedOrder.customer?.email || '-'}
                </p>
                <p className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {selectedOrder.customer?.phone || '-'}
                </p>
                {selectedOrder.customer?.cpf && (
                  <p className="text-slate-500 font-mono">CPF: {selectedOrder.customer.cpf}</p>
                )}
              </div>

              {/* Delivery Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Endereço de Entrega
                </h4>
                <p className="text-white font-medium leading-relaxed">
                  {selectedOrder.address?.street || ''}, {selectedOrder.address?.number || ''}
                  {selectedOrder.address?.complement && ` (${selectedOrder.address.complement})`}
                </p>
                <p className="text-slate-400">
                  {selectedOrder.address?.neighborhood || ''} - {selectedOrder.address?.city || ''}/{selectedOrder.address?.state || ''}
                </p>
                <p className="text-slate-500 font-mono">CEP: {selectedOrder.address?.zipCode || '-'}</p>
              </div>
            </div>

            {/* Tracking Code input */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full text-xs">
                <label className="block text-slate-400 font-semibold mb-1">
                  Código de Rastreio Sedex / Transportadora:
                </label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Ex: BR984210345SP"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedOrder.status)}
                className="w-full sm:w-auto mt-2 sm:mt-5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Salvar Rastreio
              </button>
            </div>

            {/* Purchased Items list */}
            <div className="space-y-3 mb-6">
              <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wide">
                Itens Comprados ({(selectedOrder.items || []).length})
              </h4>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-slate-900 rounded flex items-center justify-center shrink-0">
                        <PeptideVial capColor={item.product?.capColor} size="sm" />
                      </div>
                      <div>
                        <span className="font-bold text-white">{item.product?.name || 'Produto'}</span>
                        <span className="text-slate-400 text-[11px] block">{item.product?.dosage || '-'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">{item.quantity}x R$ {(item.product?.price || 0).toFixed(2).replace('.', ',')}</span>
                      <span className="font-bold text-white">R$ {((item.product?.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-400 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-semibold">R$ {(selectedOrder.subtotal ?? (selectedOrder.total || 0)).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Importação</span>
                <span className="text-white font-semibold">
                  R$ {(selectedOrder.shipping || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
              {(selectedOrder.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto Aplicado</span>
                  <span>- R$ {(selectedOrder.discount || 0).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2 mt-1">
                <span>Total Faturado</span>
                <span className="text-cyan-400 font-tech">R$ {(selectedOrder.total || 0).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Change Status Fast Buttons */}
            <div className="border-t border-slate-800 pt-4 flex flex-wrap gap-2 justify-end">
              <span className="text-xs text-slate-400 self-center mr-2">Alterar Status Rápido:</span>
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrder.status === st
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Exclusão Segura com Senha 8817 */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-7 text-white shadow-2xl shadow-red-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (!isDeleting) {
                  setOrderToDelete(null);
                  setDeletePassword('');
                  setDeleteError(null);
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
                  Excluir Pedido {orderToDelete.orderNumber}
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              {/* Order Info Summary */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="text-white font-semibold">{orderToDelete.customer?.name || 'Cliente'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-emerald-400 font-bold">R$ {(orderToDelete.total || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Atual:</span>
                  <span className="text-cyan-400 font-semibold">{orderToDelete.status}</span>
                </div>
              </div>

              <div className="p-3.5 bg-red-950/25 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Esta ação excluirá permanentemente o pedido do banco de dados. Para prosseguir, confirme a senha de segurança:
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
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError(null);
                    }}
                    placeholder="Digite a senha 8817"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 placeholder-slate-600 font-mono tracking-widest"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setOrderToDelete(null);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isDeleting ? (
                    <span>Excluindo...</span>
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
    </div>
  );
};
