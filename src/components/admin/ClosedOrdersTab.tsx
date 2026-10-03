import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  CheckCircle2,
  Edit3,
  Clock,
  AlertTriangle,
  ChevronDown,
  Eye,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ShoppingBag,
  User,
  Phone,
  Package,
  CreditCard,
  X,
  Copy,
  Check,
  CalendarClock,
  ArrowRight,
  Sparkles,
  Send,
  MessageSquare,
  Printer,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, CashRegisterSession } from '../../types';
import { PeptideVial } from '../PeptideVial';
import { exportOrdersListToExcel, exportOrdersListToTxt } from '../../utils/exportUtils';

export interface ClosedOrdersTabProps {
  onReturnToOrders?: () => void;
}

export const ClosedOrdersTab: React.FC<ClosedOrdersTabProps> = ({ onReturnToOrders }) => {
  const {
    orders,
    cashRegisterSessions,
    reopenOrderInActiveSession,
    reopenEntireCashSession,
    migrateClosedOrdersToSupabase,
    clearClosedOrderManually,
    currentUser,
    storeSettings,
    isSupabaseActive,
    showToast,
  } = useApp();

  // Sub-views: 'closed' | 'pending' | 'report'
  const [subView, setSubView] = useState<'closed' | 'pending' | 'report'>('closed');

  // Active / Selected session filter
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Clearance & values editing in closed order modal state
  const [clearingOrder, setClearingOrder] = useState<Order | null>(null);
  const [clearPaidAmount, setClearPaidAmount] = useState<string>('');
  const [clearRemainingAmount, setClearRemainingAmount] = useState<string>('');
  const [clearStatus, setClearStatus] = useState<OrderStatus>('Pago');
  const [clearDueDate, setClearDueDate] = useState<string>('');
  const [clearNotes, setClearNotes] = useState<string>('');
  const [clearOperator, setClearOperator] = useState<string>('');
  const [isClearingOrder, setIsClearingOrder] = useState<boolean>(false);

  // Reopen session modal state
  const [sessionToReopen, setSessionToReopen] = useState<CashRegisterSession | null>(null);
  const [reopenPassword, setReopenPassword] = useState<string>('');
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [isReopeningSession, setIsReopeningSession] = useState<boolean>(false);

  // Reopen single order modal state
  const [orderToReopen, setOrderToReopen] = useState<Order | null>(null);
  const [isReopeningOrder, setIsReopeningOrder] = useState<boolean>(false);

  // WhatsApp Order Summary / Relatório Modal State
  const [summaryOrder, setSummaryOrder] = useState<Order | null>(null);
  const [summaryWhatsAppPhone, setSummaryWhatsAppPhone] = useState<string>('');
  const [summaryCopied, setSummaryCopied] = useState<boolean>(false);

  const handleOpenOrderSummaryModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSummaryOrder(order);
    setSummaryWhatsAppPhone(order.customer?.phone || '');
    setSummaryCopied(false);
  };

  const generateOrderSummaryText = (order: Order): string => {
    const brand = storeSettings.storeName || 'PEPTIDE IMPORTS FARMA';
    const customerName = order.customer?.name || 'Cliente';
    const totalItems = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
    const totalStr = (order.total || 0).toFixed(2).replace('.', ',');
    const isPaid = order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Enviado';
    const paidAmountVal = order.paidAmount !== undefined ? Number(order.paidAmount) : (isPaid ? Number(order.total || 0) : 0);
    const paidStr = paidAmountVal.toFixed(2).replace('.', ',');
    const remainingAmountVal = order.remainingAmount !== undefined ? Number(order.remainingAmount) : (isPaid ? 0 : Math.max(0, Number(order.total || 0) - paidAmountVal));
    const remainingStr = remainingAmountVal.toFixed(2).replace('.', ',');
    const itemsList = (order.items || []).map((i) => `• ${i.quantity}x ${i.product?.name || 'Produto'} (${i.product?.dosage || ''}) - R$ ${((i.product?.price || 0) * (i.quantity || 1)).toFixed(2).replace('.', ',')}`).join('\n');

    return `📦 *RELATÓRIO DO PEDIDO - ${brand}*
----------------------------------------
*Pedido:* ${order.orderNumber}
${order.closedSessionName ? `*Sessão de Caixa:* ${order.closedSessionName}\n` : ''}*Data do Pedido:* ${new Date(order.createdAt).toLocaleDateString('pt-BR')} às ${new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
*Status:* ${order.status}
${order.trackingCode ? `*Rastreio:* ${order.trackingCode}\n` : ''}
👤 *DADOS DO CLIENTE:*
• *Nome:* ${customerName}
• *Telefone:* ${order.customer?.phone || '-'}
• *Email:* ${order.customer?.email || '-'}
• *Endereço:* ${order.address?.street || ''}, ${order.address?.number || ''} ${order.address?.complement || ''} - ${order.address?.neighborhood || ''}, ${order.address?.city || ''}/${order.address?.state || ''} - CEP: ${order.address?.zipCode || '-'}

💊 *ITENS DO PEDIDO (${totalItems} frascos):*
${itemsList}

💰 *FINANCEIRO:*
• *Subtotal:* R$ ${(order.subtotal || 0).toFixed(2).replace('.', ',')}
• *Frete:* R$ ${(order.shipping || 0).toFixed(2).replace('.', ',')}
${(order.additionalAmount || 0) > 0 ? `• *Valor Adicional:* R$ ${(order.additionalAmount || 0).toFixed(2).replace('.', ',')}\n` : ''}${(order.discount || 0) > 0 ? `• *Desconto:* R$ ${(order.discount || 0).toFixed(2).replace('.', ',')}\n` : ''}• *TOTAL:* *R$ ${totalStr}*
• *Valor Pago:* R$ ${paidStr}
${(order.status === 'Pago Parcial' || remainingAmountVal > 0) ? `• *SALDO RESTANTE:* *R$ ${remainingStr}*\n` : ''}• *Forma de Pagamento:* ${order.paymentMethod || 'A Combinar'}

${order.notes ? `📝 *Observações:* ${order.notes}\n` : ''}Atenciosamente,
*${brand}*`;
  };

  const handleCopyOrderSummary = async () => {
    if (!summaryOrder) return;
    const text = generateOrderSummaryText(summaryOrder);
    try {
      await navigator.clipboard.writeText(text);
      setSummaryCopied(true);
      showToast('📋 Relatório do pedido copiado!');
      setTimeout(() => setSummaryCopied(false), 2500);
    } catch (err) {
      console.error(err);
      showToast('Erro ao copiar relatório.');
    }
  };

  const handleSendOrderWhatsApp = () => {
    if (!summaryOrder) return;
    const rawPhone = summaryWhatsAppPhone || summaryOrder.customer?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      showToast('⚠️ Informe um número de WhatsApp válido.');
      return;
    }
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = generateOrderSummaryText(summaryOrder);
    const url = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast(`🚀 Relatório enviado no WhatsApp!`);
  };

  const handleOpenClearModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const total = order.total || 0;
    const isPaid = order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Enviado';
    const currentPaid = order.paidAmount !== undefined ? order.paidAmount : (isPaid ? total : 0);
    const currentRemaining = order.remainingAmount !== undefined ? order.remainingAmount : (isPaid ? 0 : total);

    setClearingOrder(order);
    setClearPaidAmount(String(currentPaid));
    setClearRemainingAmount(String(currentRemaining));
    setClearStatus(order.status || (currentRemaining <= 0 ? 'Pago' : (currentPaid > 0 ? 'Pago Parcial' : 'Pendente')));
    setClearDueDate(order.dueDate || '');
    setClearNotes(order.notes || '');
    setClearOperator(currentUser?.name || currentUser?.email || 'Administrador');
  };

  const handlePaidChange = (val: string) => {
    setClearPaidAmount(val);
    const numPaid = parseFloat(val);
    if (!isNaN(numPaid) && clearingOrder) {
      const total = clearingOrder.total || 0;
      const rem = Math.max(0, Number((total - numPaid).toFixed(2)));
      setClearRemainingAmount(String(rem));
      if (rem <= 0) {
        setClearStatus('Pago');
      } else if (numPaid > 0) {
        setClearStatus('Pago Parcial');
      } else {
        setClearStatus('Pendente');
      }
    }
  };

  const handleRemainingChange = (val: string) => {
    setClearRemainingAmount(val);
    const numRem = parseFloat(val);
    if (!isNaN(numRem) && clearingOrder) {
      const total = clearingOrder.total || 0;
      const paid = Math.max(0, Number((total - numRem).toFixed(2)));
      setClearPaidAmount(String(paid));
      if (numRem <= 0) {
        setClearStatus('Pago');
      } else if (paid > 0) {
        setClearStatus('Pago Parcial');
      } else {
        setClearStatus('Pendente');
      }
    }
  };

  const handleSetPreset = (type: 'full' | 'half' | 'none') => {
    if (!clearingOrder) return;
    const total = clearingOrder.total || 0;
    if (type === 'full') {
      setClearPaidAmount(String(total));
      setClearRemainingAmount('0');
      setClearStatus('Pago');
    } else if (type === 'half') {
      const half = Number((total / 2).toFixed(2));
      setClearPaidAmount(String(half));
      setClearRemainingAmount(String(Number((total - half).toFixed(2))));
      setClearStatus('Pago Parcial');
    } else if (type === 'none') {
      setClearPaidAmount('0');
      setClearRemainingAmount(String(total));
      setClearStatus('Pendente');
    }
  };

  const handleConfirmClearClosedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearingOrder) return;
    setIsClearingOrder(true);
    try {
      const parsedPaid = clearPaidAmount !== '' && !isNaN(Number(clearPaidAmount)) ? Number(clearPaidAmount) : 0;
      const parsedRemaining = clearRemainingAmount !== '' && !isNaN(Number(clearRemainingAmount))
        ? Number(clearRemainingAmount)
        : Math.max(0, Number(((clearingOrder.total || 0) - parsedPaid).toFixed(2)));

      const res = await clearClosedOrderManually(clearingOrder.id, {
        status: clearStatus,
        paidAmount: parsedPaid,
        remainingAmount: parsedRemaining,
        dueDate: clearDueDate.trim() || undefined,
        notes: clearNotes.trim() || undefined,
        clearedBy: clearOperator.trim() || undefined,
      });

      if (res.success) {
        if (selectedOrder && selectedOrder.id === clearingOrder.id) {
          setSelectedOrder({
            ...selectedOrder,
            status: clearStatus,
            paidAmount: parsedPaid,
            remainingAmount: parsedRemaining,
            dueDate: clearDueDate.trim() || undefined,
            clearedManuallyAt: new Date().toLocaleString('pt-BR'),
            clearedBy: clearOperator.trim() || 'Administrador',
            notes: clearNotes.trim() || selectedOrder.notes,
          });
        }
        setClearingOrder(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar valores do pedido fechado.');
    } finally {
      setIsClearingOrder(false);
    }
  };

  // All closed orders
  const allClosedOrders = useMemo(() => {
    return orders.filter((o) => Boolean(o.isClosed || o.closedAt));
  }, [orders]);

  // Helper function to normalize text (remove accents and casing for accurate search)
  const normalizeText = (text: string | null | undefined): string => {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Orders matching selected session and search query (before status filter is applied)
  const sessionAndSearchClosedOrders = useMemo(() => {
    const qRaw = (searchTerm || '').toLowerCase().trim();
    const qNorm = normalizeText(searchTerm);
    const digitsOnly = qRaw.replace(/\D/g, '');

    return allClosedOrders.filter((order) => {
      // 1. Session filter
      if (selectedSessionId !== 'all') {
        if (order.closedSessionId !== selectedSessionId) {
          return false;
        }
      }

      // 2. Search filter
      if (qRaw) {
        const matchesNumber = (order.orderNumber || '').toLowerCase().includes(qRaw);
        const matchesName = normalizeText(order.customer?.name).includes(qNorm);
        const matchesEmail = (order.customer?.email || '').toLowerCase().includes(qRaw);
        const phoneRaw = (order.customer?.phone || '').toLowerCase();
        const phoneDigits = (order.customer?.phone || '').replace(/\D/g, '');
        const matchesPhone = Boolean(
          phoneRaw.includes(qRaw) ||
          (digitsOnly.length >= 2 && phoneDigits.includes(digitsOnly))
        );
        const cpfDigits = (order.customer?.cpf || '').replace(/\D/g, '');
        const matchesCpf = Boolean(
          digitsOnly.length >= 3 && cpfDigits.includes(digitsOnly)
        );
        const matchesSessionName = normalizeText(order.closedSessionName).includes(qNorm);
        const matchesNotes = normalizeText(order.notes).includes(qNorm);
        const matchesItems = (order.items || []).some((it) => {
          const pName = normalizeText(it.product?.name || (it as any).name);
          const pDosage = normalizeText(it.product?.dosage || (it as any).dosage);
          const combined = `${pName} ${pDosage}`.trim();
          return pName.includes(qNorm) || pDosage.includes(qNorm) || combined.includes(qNorm);
        });

        if (
          !matchesNumber &&
          !matchesName &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesCpf &&
          !matchesSessionName &&
          !matchesNotes &&
          !matchesItems
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allClosedOrders, selectedSessionId, searchTerm]);

  // Accurate counts for the Status Filter chips based on the current session and search results
  const statusCounts = useMemo(() => {
    let all = sessionAndSearchClosedOrders.length;
    let paid = 0;
    let pendingOrPartial = 0;
    let waitingClearance = 0;
    let cancelled = 0;

    sessionAndSearchClosedOrders.forEach((o) => {
      const isPaid = o.status === 'Pago' || o.status === 'Entregue' || o.status === 'Enviado';
      if (isPaid) {
        paid++;
      }
      if (
        o.status === 'Pendente' ||
        o.status === 'Pago Parcial' ||
        (o.remainingAmount !== undefined && o.remainingAmount > 0 && o.status !== 'Pago' && o.status !== 'Cancelado')
      ) {
        pendingOrPartial++;
      }
      if (!o.clearedManuallyAt && !isPaid && o.status !== 'Cancelado') {
        waitingClearance++;
      }
      if (o.status === 'Cancelado') {
        cancelled++;
      }
    });

    return { all, paid, pendingOrPartial, waitingClearance, cancelled };
  }, [sessionAndSearchClosedOrders]);

  // Filtered closed orders based on selected session, search query, AND status filter
  const filteredClosedOrders = useMemo(() => {
    if (statusFilter === 'Todos') return sessionAndSearchClosedOrders;

    return sessionAndSearchClosedOrders.filter((order) => {
      if (statusFilter === 'Pagos') {
        return order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Enviado';
      }
      if (statusFilter === 'Pendentes / Parciais') {
        return (
          order.status === 'Pendente' ||
          order.status === 'Pago Parcial' ||
          (order.remainingAmount !== undefined && order.remainingAmount > 0 && order.status !== 'Pago' && order.status !== 'Cancelado')
        );
      }
      if (statusFilter === 'Aguardando Baixa') {
        const isPaid = order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Enviado';
        return !order.clearedManuallyAt && !isPaid && order.status !== 'Cancelado';
      }
      if (statusFilter === 'Cancelados') {
        return order.status === 'Cancelado';
      }
      return true;
    });
  }, [sessionAndSearchClosedOrders, statusFilter]);

  // Pending closed orders (orders that were closed but still have outstanding debt or pending clearance)
  const pendingClosedOrders = useMemo(() => {
    const qRaw = (searchTerm || '').toLowerCase().trim();
    const qNorm = normalizeText(searchTerm);
    const digitsOnly = qRaw.replace(/\D/g, '');

    return allClosedOrders.filter((order) => {
      // Session filter
      if (selectedSessionId !== 'all') {
        if (order.closedSessionId !== selectedSessionId) {
          return false;
        }
      }

      const isPaid = order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Enviado';
      const hasDebt = order.remainingAmount !== undefined ? order.remainingAmount > 0 : !isPaid;
      if (!hasDebt || order.status === 'Cancelado') return false;

      if (qRaw) {
        const matchesNumber = (order.orderNumber || '').toLowerCase().includes(qRaw);
        const matchesName = normalizeText(order.customer?.name).includes(qNorm);
        const matchesEmail = (order.customer?.email || '').toLowerCase().includes(qRaw);
        const phoneRaw = (order.customer?.phone || '').toLowerCase();
        const phoneDigits = (order.customer?.phone || '').replace(/\D/g, '');
        const matchesPhone = Boolean(
          phoneRaw.includes(qRaw) ||
          (digitsOnly.length >= 2 && phoneDigits.includes(digitsOnly))
        );
        const cpfDigits = (order.customer?.cpf || '').replace(/\D/g, '');
        const matchesCpf = Boolean(
          digitsOnly.length >= 3 && cpfDigits.includes(digitsOnly)
        );
        const matchesSessionName = normalizeText(order.closedSessionName).includes(qNorm);
        const matchesNotes = normalizeText(order.notes).includes(qNorm);
        const matchesItems = (order.items || []).some((it) => {
          const pName = normalizeText(it.product?.name || (it as any).name);
          const pDosage = normalizeText(it.product?.dosage || (it as any).dosage);
          const combined = `${pName} ${pDosage}`.trim();
          return pName.includes(qNorm) || pDosage.includes(qNorm) || combined.includes(qNorm);
        });

        if (
          !matchesNumber &&
          !matchesName &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesCpf &&
          !matchesSessionName &&
          !matchesNotes &&
          !matchesItems
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allClosedOrders, selectedSessionId, searchTerm]);

  // Financial Metrics for the current view
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let waitingClearanceCount = 0;
    let cancelCount = 0;

    const paymentMethodsMap: Record<string, { count: number; total: number }> = {};

    filteredClosedOrders.forEach((o) => {
      const isPaid = o.status === 'Pago' || o.status === 'Entregue' || o.status === 'Enviado';
      const isCancelled = o.status === 'Cancelado';

      if (!isCancelled) {
        totalRevenue += Number(o.total || 0);
        const paid = o.paidAmount !== undefined ? o.paidAmount : (isPaid ? o.total : 0);
        const pending = o.remainingAmount !== undefined ? o.remainingAmount : (!isPaid ? o.total : 0);
        totalPaid += Number(paid || 0);
        totalPending += Number(pending || 0);
      }

      if (isPaid) paidCount++;
      else if (o.status === 'Pago Parcial') partialCount++;
      else if (o.status === 'Cancelado') cancelCount++;
      else pendingCount++;

      if (!o.clearedManuallyAt && !isPaid && !isCancelled) {
        waitingClearanceCount++;
      }

      const method = o.paymentMethod || 'PIX';
      if (!paymentMethodsMap[method]) {
        paymentMethodsMap[method] = { count: 0, total: 0 };
      }
      paymentMethodsMap[method].count++;
      if (!isCancelled) {
        paymentMethodsMap[method].total += Number(o.total || 0);
      }
    });

    const averageTicket = filteredClosedOrders.length > 0 ? totalRevenue / Math.max(1, filteredClosedOrders.length - cancelCount) : 0;

    return {
      totalOrders: filteredClosedOrders.length,
      totalRevenue,
      totalPaid,
      totalPending,
      averageTicket,
      paidCount,
      partialCount,
      pendingCount,
      waitingClearanceCount,
      cancelCount,
      paymentMethodsMap,
    };
  }, [filteredClosedOrders]);

  // Top products sold in closed orders for report
  const topProductsSold = useMemo(() => {
    const map = new Map<string, { name: string; dosage: string; quantity: number; revenue: number }>();
    filteredClosedOrders.forEach((order) => {
      if (order.status === 'Cancelado') return;
      (order.items || []).forEach((item) => {
        const name = (item.product?.name || (item as any).name || 'Peptídeo').trim();
        const dosage = (item.product?.dosage || (item as any).dosage || '').trim();
        const key = `${name}__${dosage}`.toLowerCase();
        const existing = map.get(key) || { name, dosage, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity || 1;
        existing.revenue += (item.product?.price || 0) * (item.quantity || 1);
        map.set(key, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [filteredClosedOrders]);

  // Selected session details if a specific one is selected
  const activeSessionDetails = useMemo(() => {
    if (selectedSessionId === 'all') return null;
    return cashRegisterSessions.find((s) => s.id === selectedSessionId) || null;
  }, [cashRegisterSessions, selectedSessionId]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (filteredClosedOrders.length === 0) {
      showToast('Nenhum pedido fechado para exportar.');
      return;
    }
    const sessionLabel = activeSessionDetails ? activeSessionDetails.name : 'Todos os Caixas Fechados';
    const filename = exportOrdersListToExcel(
      filteredClosedOrders,
      `Relatório de Pedidos Fechados - ${sessionLabel}`,
      storeSettings?.storeName || 'Peptide Imports Farma'
    );
    showToast(`📊 Planilha Excel baixada com sucesso: ${filename}`);
  };

  // Handle Export to TXT
  const handleExportTxt = () => {
    if (filteredClosedOrders.length === 0) {
      showToast('Nenhum pedido fechado para exportar.');
      return;
    }
    const sessionLabel = activeSessionDetails ? activeSessionDetails.name : 'Todos os Caixas Fechados';
    const filename = exportOrdersListToTxt(
      filteredClosedOrders,
      `Relatório de Pedidos Fechados - ${sessionLabel}`,
      storeSettings?.storeName || 'Peptide Imports Farma'
    );
    showToast(`📄 Relatório TXT baixado com sucesso: ${filename}`);
  };

  // Confirm Reopen entire session
  const handleConfirmReopenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToReopen) return;
    if (reopenPassword.trim() !== '8817') {
      setReopenError('Senha incorreta! Digite a senha 8817.');
      return;
    }
    setIsReopeningSession(true);
    setReopenError(null);
    try {
      const res = await reopenEntireCashSession(sessionToReopen.id, reopenPassword);
      if (res.success) {
        setSessionToReopen(null);
        setReopenPassword('');
        setSelectedSessionId('all');
      } else {
        setReopenError(res.message);
      }
    } finally {
      setIsReopeningSession(false);
    }
  };

  // Confirm Reopen single order
  const handleConfirmReopenOrder = async () => {
    if (!orderToReopen) return;
    setIsReopeningOrder(true);
    try {
      await reopenOrderInActiveSession(orderToReopen.id);
      setOrderToReopen(null);
      if (selectedOrder?.id === orderToReopen.id) {
        setSelectedOrder(null);
      }
    } finally {
      setIsReopeningOrder(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-extrabold text-white font-tech tracking-wide">
                PEDIDOS FECHADOS & HISTÓRICO DE CAIXAS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                {allClosedOrders.length} {allClosedOrders.length === 1 ? 'pedido fechado' : 'pedidos fechados'}
              </span>
              {isSupabaseActive && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Banco Principal: Supabase</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consulte os pedidos arquivados no fechamento de caixa, acompanhe pendências e emita relatórios.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onReturnToOrders && (
            <button
              onClick={onReturnToOrders}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer min-h-[36px]"
              title="Voltar para a tela de Pedidos Ativos & Baixas"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Pedidos Ativos</span>
            </button>
          )}

          <button
            onClick={async () => {
              await migrateClosedOrdersToSupabase();
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer min-h-[36px]"
            title="Enviar e migrar todos os pedidos fechados para a tabela 'closed_orders' no Supabase"
          >
            <Archive className="w-4 h-4 text-amber-400" />
            <span>Migrar p/ Supabase</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer min-h-[36px]"
            title="Exportar pedidos fechados para planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportTxt}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer min-h-[36px]"
            title="Exportar relatório em arquivo texto (.txt)"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">TXT</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-md">
        <button
          onClick={() => setSubView('closed')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[36px] ${
            subView === 'closed'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Pedidos Fechados</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] font-mono">
            {allClosedOrders.length}
          </span>
        </button>

        <button
          onClick={() => setSubView('pending')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[36px] ${
            subView === 'pending'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pendentes & Cobrança</span>
          {pendingClosedOrders.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
              {pendingClosedOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubView('report')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[36px] ${
            subView === 'report'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Relatório do Caixa</span>
          {cashRegisterSessions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] font-mono">
              {cashRegisterSessions.length} {cashRegisterSessions.length === 1 ? 'caixa' : 'caixas'}
            </span>
          )}
        </button>
      </div>

      {/* Financial Metric Cards for the Closed Orders / Session */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Faturado */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Faturamento do Caixa
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
              R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {metrics.totalOrders} pedidos considerados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Recebido / Baixado */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Recebido (Baixado)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
              R$ {metrics.totalPaid.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
              {metrics.paidCount} pedidos 100% quitados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Pendente / A Receber */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Saldo Pendente (A Receber)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block">
              R$ {metrics.totalPending.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-amber-400/80 mt-0.5 block">
              {metrics.pendingCount + metrics.partialCount} pedidos com saldo aberto
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Ticket Médio & Sessão */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Ticket Médio
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
              R$ {metrics.averageTicket.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate max-w-[170px]">
              {activeSessionDetails ? activeSessionDetails.name : 'Média de todos os caixas'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* VIEW 1: All Closed Orders */}
      {subView === 'closed' && (
        <div className="space-y-4">
          {/* Session Filter Ribbon & Search Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
              {/* Seletor de Sessão de Caixa */}
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sessão do Caixa:</span>
                </span>
                <div className="relative flex-1 sm:max-w-md">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">📦 Todos os Caixas Fechados ({allClosedOrders.length} pedidos)</option>
                    {cashRegisterSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        🔒 {s.name} ({s.totalOrders} pedidos • R$ {s.totalRevenue.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botão de Reabrir Caixa se sessão específica estiver selecionada */}
                {activeSessionDetails && (
                  <button
                    type="button"
                    onClick={() => {
                      setSessionToReopen(activeSessionDetails);
                      setReopenPassword('');
                      setReopenError(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="Reabrir este caixa e retornar todos os pedidos para o painel de pedidos ativos (requer senha 8817)"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reabrir Este Caixa</span>
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar cliente, tel, nº ou peptídeo..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                    title="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Status Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 mr-1.5 shrink-0">Filtrar Status:</span>
              {[
                { id: 'Todos', label: `Todos (${statusCounts.all})` },
                { id: 'Pagos', label: `Pagos / Baixados (${statusCounts.paid})` },
                { id: 'Pendentes / Parciais', label: `Pendentes & Parciais (${statusCounts.pendingOrPartial})` },
                { id: 'Aguardando Baixa', label: `Aguardando Baixa (${statusCounts.waitingClearance})` },
                { id: 'Cancelados', label: `Cancelados (${statusCounts.cancelled})` },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Table Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span>Listagem de Pedidos Fechados</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                  {filteredClosedOrders.length} encontrados
                </span>
              </span>
              <span className="text-[11px] text-slate-500">
                Clique no pedido para visualizar todos os itens e comprovante
              </span>
            </div>

            {filteredClosedOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Archive className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Nenhum pedido fechado nesta visualização</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Quando você clicar em <strong>"Fechar o Caixa"</strong> na aba de Pedidos (usando a senha 8817),
                  todos os pedidos abertos daquele período serão transferidos para cá e a tela principal ficará limpa.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Pedido / Caixa</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Itens / Peptídeos</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Baixa Financeira</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredClosedOrders.map((order) => {
                      const isPaid = order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Enviado';
                      const remaining = order.remainingAmount ?? (isPaid ? 0 : order.total);
                      const paid = order.paidAmount ?? (isPaid ? order.total : 0);

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          {/* Pedido & Caixa */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono text-sm group-hover:text-cyan-400 transition-colors">
                                {order.orderNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                              {order.closedSessionName || 'Caixa Fechado'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Cliente */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white truncate max-w-[180px]">
                              {order.customer?.name || 'Cliente'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{order.customer?.phone || 'Sem telefone'}</span>
                            </div>
                            {order.customer?.cpf && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                CPF: {order.customer.cpf}
                              </div>
                            )}
                          </td>

                          {/* Itens */}
                          <td className="py-3 px-4 max-w-[220px]">
                            <div className="space-y-1">
                              {(order.items || []).slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px] truncate">
                                  <span className="w-4 h-4 rounded bg-slate-800 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                                    {item.quantity}x
                                  </span>
                                  <span className="truncate text-slate-200">
                                    {item.product?.name} ({item.product?.dosage})
                                  </span>
                                </div>
                              ))}
                              {(order.items || []).length > 2 && (
                                <span className="text-[10px] text-cyan-400 font-bold">
                                  +{(order.items || []).length - 2} outro(s) item(ns)...
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-white font-mono text-sm block">
                              R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {order.paymentMethod || 'PIX'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : order.status === 'Pago Parcial'
                                  ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                                  : order.status === 'Cancelado'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>

                          {/* Baixa Financeira */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-mono text-xs">
                              <span className="text-emerald-400 font-semibold block">
                                Pago: R$ {paid.toFixed(2).replace('.', ',')}
                              </span>
                              {remaining > 0 ? (
                                <span className="text-amber-400 font-semibold block text-[11px]">
                                  Resta: R$ {remaining.toFixed(2).replace('.', ',')}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px] block">
                                  Quitado 100%
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenOrderSummaryModal(order, e)}
                              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-colors cursor-pointer"
                              title="Enviar relatório individual do pedido no WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleOpenClearModal(order, e)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                                order.status === 'Pago Parcial' || (order.remainingAmount !== undefined && order.remainingAmount > 0) || order.status === 'Pendente'
                                  ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border-amber-500/40 shadow-xs'
                                  : 'bg-emerald-950/60 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/30'
                              }`}
                              title="Editar pagamento, saldo pendente e valor que falta pagar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                              title="Ver detalhes completos do pedido"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setOrderToReopen(order)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-colors cursor-pointer"
                              title="Reabrir este pedido para o caixa ativo"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
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

      {/* VIEW 2: Pending & Unpaid Closed Orders */}
      {subView === 'pending' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">Pedidos Fechados com Saldos Pendentes</h3>
                <p className="text-xs text-amber-200/80">
                  Estes pedidos foram arquivados no fechamento do caixa, mas ainda possuem pagamentos parciais ou pendentes em aberto para cobrança.
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-amber-500/40 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total a Cobrar</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                R$ {pendingClosedOrders.reduce((sum, o) => {
                  const rem = o.remainingAmount !== undefined ? o.remainingAmount : (o.status === 'Pago' ? 0 : o.total);
                  return sum + Number(rem || 0);
                }, 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {pendingClosedOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Nenhum pedido pendente em caixas fechados</h3>
                <p className="text-xs text-slate-500">
                  Todos os pedidos dos caixas anteriores foram devidamente quitados e baixados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Pedido / Caixa</th>
                      <th className="py-3 px-4">Cliente & Contato</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Pago</th>
                      <th className="py-3 px-4">Saldo Pendente</th>
                      <th className="py-3 px-4 text-right">Cobrança & Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {pendingClosedOrders.map((order) => {
                      const isPaid = order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Enviado';
                      const remaining = order.remainingAmount ?? (isPaid ? 0 : order.total);
                      const paid = order.paidAmount ?? (isPaid ? order.total : 0);
                      const cleanPhone = (order.customer?.phone || '').replace(/\D/g, '');

                      const chargeMsg = encodeURIComponent(
                        `Olá, ${order.customer?.name || 'Cliente'}! Tudo bem? Passando para lembrar sobre o saldo pendente de R$ ${remaining.toFixed(2).replace('.', ',')} referente ao seu pedido ${order.orderNumber} na ${storeSettings?.storeName || 'Peptide Imports Farma'}. Qualquer dúvida estamos à disposição!`
                      );

                      return (
                        <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-white font-mono text-sm block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-amber-400/90 font-mono block">
                              {order.closedSessionName || 'Caixa Fechado'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{order.customer?.name}</div>
                            <div className="text-[11px] text-slate-400">{order.customer?.phone}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-white">
                            R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-400">
                            R$ {paid.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-amber-400 text-sm">
                            R$ {remaining.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={(e) => handleOpenClearModal(order, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
                              title="Editar valor pago e o que falta pagar (pendente / parcial)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar / Baixa</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleOpenOrderSummaryModal(order, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                              title="Enviar relatório completo do pedido para o WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Relatório WhatsApp</span>
                            </button>

                            {cleanPhone && (
                              <a
                                href={`https://wa.me/55${cleanPhone}?text=${chargeMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors shadow-xs"
                                title="Enviar lembrete de cobrança no WhatsApp"
                              >
                                <Send className="w-3.5 h-3.5 text-amber-400" />
                                <span>Cobrar WhatsApp</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setOrderToReopen(order)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-colors cursor-pointer"
                              title="Reabrir este pedido para o caixa ativo"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
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

      {/* VIEW 3: Closure Report & Cashier Sessions History */}
      {subView === 'report' && (
        <div className="space-y-6">
          {/* Report Summary Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-tech">RELATÓRIO FINANCEIRO DE CAIXAS</h3>
                  <p className="text-xs text-slate-400">
                    Demonstrativo consolidado dos períodos fechados e formas de pagamento
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Baixar Planilha Excel</span>
                </button>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Distribuição por Forma de Pagamento</span>
                </span>
                <div className="space-y-2 text-xs">
                  {Object.entries(metrics.paymentMethodsMap).map(([method, data]: [string, { count: number; total: number }]) => {
                    const percent = metrics.totalRevenue > 0 ? (data.total / metrics.totalRevenue) * 100 : 0;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="font-semibold">{method} ({data.count} pedidos)</span>
                          <span className="font-mono font-bold text-white">
                            R$ {data.total.toFixed(2).replace('.', ',')}{' '}
                            <span className="text-slate-500 text-[10px]">({percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(metrics.paymentMethodsMap).length === 0 && (
                    <p className="text-slate-500 text-xs py-2 text-center">Nenhum dado financeiro para exibir.</p>
                  )}
                </div>
              </div>

              {/* Top Products in Closed Periods */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Top Peptídeos Vendidos nos Caixas Fechados</span>
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                  {topProductsSold.slice(0, 5).map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="truncate font-bold text-white text-xs">
                          {prod.name} <span className="text-slate-400 font-normal">({prod.dosage})</span>
                        </span>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-cyan-400 font-bold block">{prod.quantity} un.</span>
                        <span className="text-[10px] text-slate-500">R$ {prod.revenue.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  ))}
                  {topProductsSold.length === 0 && (
                    <p className="text-slate-500 text-xs py-2 text-center">Nenhum peptídeo registrado ainda.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* History of All Cash Register Sessions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-tech">HISTÓRICO DE SESSÕES DE CAIXA</h3>
                  <p className="text-xs text-slate-400">
                    Registro detalhado de cada fechamento de caixa executado
                  </p>
                </div>
              </div>
            </div>

            {cashRegisterSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <p className="text-xs text-slate-500">Nenhum fechamento de caixa realizado até o momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {cashRegisterSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 space-y-3 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <span className="font-bold text-white text-xs font-mono truncate">
                        🔒 {session.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                        {session.totalOrders} pedidos
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Faturamento:</span>
                        <span className="font-mono font-bold text-cyan-400">
                          R$ {session.totalRevenue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Quitado:</span>
                        <span className="font-mono text-emerald-400">
                          R$ {session.totalPaid.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {session.totalPending > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>Pendente:</span>
                          <span className="font-mono text-amber-400 font-bold">
                            R$ {session.totalPending.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                        <span>Fechado por:</span>
                        <span className="text-slate-400">{session.closedBy}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>Data:</span>
                        <span>{new Date(session.closedAt).toLocaleString('pt-BR')}</span>
                      </div>
                      {session.notes && (
                        <p className="text-[11px] text-amber-200/90 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2 italic">
                          "{session.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          setSubView('closed');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ver Pedidos ({session.totalOrders})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSessionToReopen(session);
                          setReopenPassword('');
                          setReopenError(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Reabrir este caixa (senha 8817)"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Reabrir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Order Details Viewer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Pedido {selectedOrder.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                      {selectedOrder.closedSessionName || 'Caixa Fechado'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registrado em {new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dados do Cliente</span>
                </span>
                <p className="text-white font-bold">{selectedOrder.customer?.name}</p>
                <p className="text-slate-400">WhatsApp: <strong className="text-slate-200">{selectedOrder.customer?.phone}</strong></p>
                {selectedOrder.customer?.email && <p className="text-slate-400">Email: {selectedOrder.customer.email}</p>}
                {selectedOrder.customer?.cpf && <p className="text-slate-400 font-mono">CPF: {selectedOrder.customer.cpf}</p>}
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resumo Financeiro</span>
                </span>
                <p className="text-slate-400">Método: <strong className="text-white">{selectedOrder.paymentMethod}</strong></p>
                <p className="text-slate-400">Status: <strong className="text-cyan-400">{selectedOrder.status}</strong></p>
                <p className="text-slate-400">Valor Pago: <strong className="text-emerald-400 font-mono">R$ {(selectedOrder.paidAmount ?? (selectedOrder.status === 'Pago' ? selectedOrder.total : 0)).toFixed(2).replace('.', ',')}</strong></p>
                <p className="text-slate-400">Saldo Restante: <strong className="text-amber-400 font-mono">R$ {(selectedOrder.remainingAmount ?? (selectedOrder.status === 'Pago' ? 0 : selectedOrder.total)).toFixed(2).replace('.', ',')}</strong></p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span>Itens Comprados</span>
              </span>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {it.product?.imageUrl ? (
                          <img src={it.product.imageUrl} alt={it.product.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <PeptideVial capColor={it.product?.capColor || '#0088FF'} size="sm" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{it.product?.name} ({it.product?.dosage})</p>
                        <p className="text-[11px] text-slate-400">{it.quantity} unidade(s) x R$ {(it.product?.price || 0).toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-cyan-300 font-mono">
                      R$ {((it.product?.price || 0) * it.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>R$ {(selectedOrder.subtotal || 0).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Frete:</span>
                <span>R$ {(selectedOrder.shipping || 0).toFixed(2).replace('.', ',')}</span>
              </div>
              {(selectedOrder.additionalAmount || 0) > 0 && (
                <div className="flex justify-between text-teal-400">
                  <span>Valor Adicional:</span>
                  <span>+ R$ {selectedOrder.additionalAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {(selectedOrder.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto:</span>
                  <span>- R$ {selectedOrder.discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                <span>Total Geral:</span>
                <span className="text-cyan-400">R$ {(selectedOrder.total || 0).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenOrderSummaryModal(selectedOrder)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer"
                  title="Enviar relatório formatado do pedido para o WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar Relatório no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenClearModal(selectedOrder)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                  title="Editar valor pago e o que falta pagar"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Pagamento / Falta Pagar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderToReopen(selectedOrder)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reabrir Pedido no Caixa Ativo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reopen Single Order Confirmation */}
      {orderToReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reabrir Pedido {orderToReopen.orderNumber}?</h3>
                <p className="text-xs text-slate-400">Mover de volta para o painel de pedidos ativos</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O pedido do cliente <strong>{orderToReopen.customer?.name}</strong> no valor de{' '}
              <strong className="text-cyan-400">R$ {(orderToReopen.total || 0).toFixed(2).replace('.', ',')}</strong>{' '}
              será desmarcado do caixa fechado e voltará a aparecer imediatamente na tela de <strong>Pedidos Ativos</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isReopeningOrder}
                onClick={() => setOrderToReopen(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isReopeningOrder}
                onClick={handleConfirmReopenOrder}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/20"
              >
                {isReopeningOrder ? 'Reabrindo...' : 'Sim, Reabrir Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reopen Entire Cash Register Session (Requires Password 8817) */}
      {sessionToReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleConfirmReopenSession}
            className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reabrir Sessão de Caixa</h3>
                <p className="text-xs text-amber-300/80">{sessionToReopen.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Esta ação desfaz o fechamento deste caixa e traz todos os{' '}
              <strong>{sessionToReopen.totalOrders} pedidos</strong> (totalizando{' '}
              <strong className="text-cyan-400">R$ {sessionToReopen.totalRevenue.toFixed(2).replace('.', ',')}</strong>)
              de volta para o painel de pedidos ativos.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Digite a senha de segurança (8817):</span>
              </label>
              <input
                type="password"
                value={reopenPassword}
                onChange={(e) => {
                  setReopenPassword(e.target.value);
                  setReopenError(null);
                }}
                placeholder="Digite a senha 8817"
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white font-mono text-sm focus:outline-none"
              />
              {reopenError && (
                <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{reopenError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isReopeningSession}
                onClick={() => setSessionToReopen(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isReopeningSession || !reopenPassword}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isReopeningSession ? 'Reabrindo Caixa...' : 'Confirmar & Reabrir Caixa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Payment & Values in Closed Order (Editar Valores Pagos e Saldo que Falta Pagar) */}
      {clearingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setClearingOrder(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4 pr-10">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl sm:rounded-2xl border border-amber-500/30 shrink-0">
                <Edit3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase tracking-wider block">
                  Caixa Fechado • Edição Financeira
                </span>
                <h3 className="text-base sm:text-xl font-extrabold font-tech text-white">
                  Editar Valores: {clearingOrder.orderNumber}
                </h3>
              </div>
            </div>

            {/* Information Banner: Safe and isolated from open register */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-emerald-200 text-xs mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Movimentação Exclusiva deste Caixa Fechado</span>
                <span>Qualquer alteração em valores pagos ou pendentes atualiza apenas este caixa fechado. <strong>Não interfere no caixa aberto atual</strong> nem altera o relatório de vendas ativo.</span>
              </div>
            </div>

            <form onSubmit={handleConfirmClearClosedOrder} className="space-y-4 sm:space-y-5 text-xs">
              {/* Summary Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CLIENTE</span>
                  <p className="font-bold text-white text-xs sm:text-sm mt-0.5 truncate">{clearingOrder.customer?.name || 'Cliente'}</p>
                  <p className="text-slate-400 text-[11px]">{clearingOrder.customer?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CAIXA FECHADO</span>
                  <p className="font-bold text-cyan-400 text-xs sm:text-sm mt-0.5 truncate">
                    {clearingOrder.closedSessionName || 'Sessão Arquivada'}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {clearingOrder.closedAt ? new Date(clearingOrder.closedAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">VALOR TOTAL DO PEDIDO</span>
                  <p className="font-mono font-bold text-cyan-400 text-sm sm:text-base mt-0.5">
                    R$ {(clearingOrder.total || 0).toFixed(2).replace('.', ',')}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Status Atual: <strong className="text-white">{clearingOrder.status}</strong>
                  </span>
                </div>
              </div>

              {/* Fast Presets Bar */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block">Atalhos de Ajuste Rápido:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetPreset('full')}
                    className="py-1.5 px-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    ⚡ Quitar 100% (Falta R$ 0)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPreset('half')}
                    className="py-1.5 px-2 rounded-xl bg-amber-950/60 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    ⚡ Metade (50% / 50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPreset('none')}
                    className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    ⚡ 100% Pendente
                  </button>
                </div>
              </div>

              {/* Form Inputs: Two synchronized fields for paid and remaining */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div>
                  <label className="block text-emerald-400 font-bold mb-1 flex items-center justify-between">
                    <span>Quanto o Cliente Já Pagou (R$)</span>
                    <span className="text-[10px] font-normal text-slate-400">Entrada</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={clearingOrder.total || 999999}
                    required
                    value={clearPaidAmount}
                    onChange={(e) => handlePaidChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Valor computado como recebido neste caixa.
                  </p>
                </div>

                <div>
                  <label className="block text-amber-400 font-bold mb-1 flex items-center justify-between">
                    <span>Quanto Falta Pagar / Pendente (R$)</span>
                    <span className="text-[10px] font-normal text-slate-400">Saldo Devedor</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={clearingOrder.total || 999999}
                    required
                    value={clearRemainingAmount}
                    onChange={(e) => handleRemainingChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/40 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Saldo que restará a ser cobrado do cliente.
                  </p>
                </div>
              </div>

              {/* Status and details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Status Financeiro *
                  </label>
                  <select
                    value={clearStatus}
                    onChange={(e) => setClearStatus(e.target.value as OrderStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pago">Pago (Totalmente Quitado - R$ 0 a Pagar)</option>
                    <option value="Pago Parcial">Pago Parcial (Existe Saldo a Pagar)</option>
                    <option value="Pendente">Pendente (Nenhum Pagamento Feito)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Vencimento / Previsão do Saldo (Opcional)
                  </label>
                  <input
                    type="date"
                    value={clearDueDate}
                    onChange={(e) => setClearDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Operador / Atendente
                  </label>
                  <input
                    type="text"
                    value={clearOperator}
                    onChange={(e) => setClearOperator(e.target.value)}
                    placeholder="Nome do operador"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Observações do Saldo / Pagamento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={clearNotes}
                    onChange={(e) => setClearNotes(e.target.value)}
                    placeholder="Ex: Prometeu pagar o saldo dia 10"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClearingOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isClearingOrder}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isClearingOrder ? 'Salvando...' : 'Salvar Valores no Caixa Fechado'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Relatório do Pedido Individual via WhatsApp (Caixa Fechado) */}
      {summaryOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSummaryOrder(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4 pr-10">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl sm:rounded-2xl border border-emerald-500/30 shrink-0">
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                  Caixa Fechado • Relatório Individual
                </span>
                <h3 className="text-base sm:text-xl font-extrabold font-tech text-white">
                  Relatório do Pedido: {summaryOrder.orderNumber}
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* WhatsApp Destination Phone Input */}
              <div className="p-3.5 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-slate-200 font-bold text-xs flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Número de WhatsApp para Envio:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={summaryWhatsAppPhone}
                    onChange={(e) => setSummaryWhatsAppPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999 ou 5511999999999"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Você pode digitar ou alterar o número acima para quem deseja enviar o relatório do pedido.
                </p>
              </div>

              {/* Message Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Prévia do Resumo Formatado:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyOrderSummary}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {summaryCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap select-all selection:bg-cyan-500 selection:text-slate-950">
                  {generateOrderSummaryText(summaryOrder)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSummaryOrder(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleCopyOrderSummary}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px]"
                >
                  {summaryCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-extrabold">Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Resumo</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSendOrderWhatsApp}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
