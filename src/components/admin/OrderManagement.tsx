import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  X,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  MessageSquare,
  ShieldCheck,
  Package,
  CreditCard,
  Trash2,
  Lock,
  AlertTriangle,
  KeyRound,
  UploadCloud,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  ShoppingBag,
  User,
  PlusCircle,
  MinusCircle,
  Edit3,
  Tag,
  DollarSign,
  Copy,
  Send,
  Share2,
  Check,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, CartItem, Product } from '../../types';
import { PeptideVial } from '../PeptideVial';
import {
  exportOrdersListToExcel,
  exportOrdersListToTxt,
} from '../../utils/exportUtils';

export interface OrderManagementProps {
  initialEditingOrderId?: string | null;
  onClearInitialEditingOrder?: () => void;
  onReturnToReports?: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  initialEditingOrderId,
  onClearInitialEditingOrder,
  onReturnToReports,
}) => {
  const {
    orders,
    products,
    updateProduct,
    createManualOrder,
    updateOrder,
    updateOrderStatus,
    clearOrderManually,
    deleteOrder,
    currentUser,
    storeSettings,
    saveAllOrdersToCloud,
    refreshSalesData,
    showToast,
  } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchFilter, setProductSearchFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Manual Order Creation State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custCpf, setCustCpf] = useState('');

  // Delivery / Address
  const [isPickup, setIsPickup] = useState(true);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('01000-000');

  // Items for Manual Order
  const [manualCart, setManualCart] = useState<CartItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [manualProdSearch, setManualProdSearch] = useState<string>('');
  const [selectedProdPrice, setSelectedProdPrice] = useState<string | number>('');
  const [updateCatalogPriceToo, setUpdateCatalogPriceToo] = useState<boolean>(false);
  const [isProdSearchOpen, setIsProdSearchOpen] = useState<boolean>(false);

  // Financials for Manual Order
  const [manualShipping, setManualShipping] = useState<number>(0);
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar'>('PIX');
  const [manualStatus, setManualStatus] = useState<OrderStatus>('Pago');
  const [manualOperator, setManualOperator] = useState(currentUser?.name || 'Administrador');
  const [manualNotes, setManualNotes] = useState('Pedido manual registrado diretamente no painel administrativo.');
  const [isSubmittingManualOrder, setIsSubmittingManualOrder] = useState(false);
  const [manualFormError, setManualFormError] = useState<string | null>(null);

  // Active Selected Product
  const currentSelectedProduct =
    products.find((p) => p.id === (selectedProdId || products[0]?.id)) || products[0];

  // Filtered products for search
  const filteredManualProducts = products.filter((p) => {
    if (!manualProdSearch.trim()) return true;
    const term = manualProdSearch.toLowerCase().trim();
    const nameMatch = (p.name || '').toLowerCase().includes(term);
    const dosageMatch = (p.dosage || '').toLowerCase().includes(term);
    const catMatch = (p.category || '').toLowerCase().includes(term);
    return nameMatch || dosageMatch || catMatch;
  });

  const handleSelectProduct = (prod: Product) => {
    setSelectedProdId(prod.id);
    setSelectedProdPrice(prod.price);
    setManualProdSearch(`${prod.name} ${prod.dosage || ''}`.trim());
    setIsProdSearchOpen(false);
  };

  const handleSelectDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      handleSelectProduct(prod);
    }
  };

  const handleAddProductToManualOrder = async () => {
    const targetProd = currentSelectedProduct;
    if (!targetProd) return;

    const parsedPrice =
      selectedProdPrice !== '' && !isNaN(Number(selectedProdPrice))
        ? Math.max(0, Number(selectedProdPrice))
        : targetProd.price;

    // Se o usuário solicitou salvar no catálogo geral da loja
    if (updateCatalogPriceToo && parsedPrice !== targetProd.price) {
      await updateProduct(targetProd.id, { price: parsedPrice });
    }

    setManualCart((prev) => {
      const existing = prev.find((item) => item.product.id === targetProd.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === targetProd.id
            ? {
                ...item,
                product: { ...targetProd, price: parsedPrice },
                quantity: item.quantity + selectedQty,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product: { ...targetProd, price: parsedPrice },
          quantity: selectedQty,
        },
      ];
    });

    setSelectedQty(1);
    setUpdateCatalogPriceToo(false);
  };

  const handleRemoveManualItem = (prodId: string) => {
    setManualCart((prev) => prev.filter((i) => i.product.id !== prodId));
  };

  const handleUpdateManualItemQty = (prodId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveManualItem(prodId);
      return;
    }
    setManualCart((prev) =>
      prev.map((i) => (i.product.id === prodId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleUpdateManualItemPrice = (prodId: string, newPrice: number) => {
    const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    setManualCart((prev) =>
      prev.map((item) =>
        item.product.id === prodId
          ? {
              ...item,
              product: {
                ...item.product,
                price: validPrice,
              },
            }
          : item
      )
    );
  };

  const manualSubtotal = manualCart.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  );
  const manualTotal = Math.max(
    0,
    manualSubtotal + (Number(manualShipping) || 0) - (Number(manualDiscount) || 0)
  );

  const handleResetManualOrderForm = () => {
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustCpf('');
    setIsPickup(true);
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('São Paulo');
    setState('SP');
    setZipCode('01000-000');
    setManualCart([]);
    const firstProd = products[0];
    setSelectedProdId(firstProd?.id || '');
    setSelectedQty(1);
    setManualProdSearch('');
    setSelectedProdPrice(firstProd?.price !== undefined ? firstProd.price : '');
    setUpdateCatalogPriceToo(false);
    setIsProdSearchOpen(false);
    setManualShipping(0);
    setManualDiscount(0);
    setManualPaymentMethod('PIX');
    setManualStatus('Pago');
    setManualOperator(currentUser?.name || 'Administrador');
    setManualNotes('Pedido manual registrado via painel ERP.');
    setManualFormError(null);
  };

  const handleSubmitManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualFormError(null);

    if (!custName.trim()) {
      setManualFormError('Informe o nome do cliente.');
      return;
    }
    if (!custPhone.trim()) {
      setManualFormError('Informe o telefone / WhatsApp do cliente.');
      return;
    }
    if (manualCart.length === 0) {
      setManualFormError('Adicione pelo menos um produto ao pedido.');
      return;
    }

    try {
      setIsSubmittingManualOrder(true);

      const addressData = isPickup
        ? {
            street: 'Balcão / Retirada Loja Física',
            number: 'S/N',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000',
          }
        : {
            street: street.trim() || 'Balcão',
            number: number.trim() || 'S/N',
            complement: complement.trim(),
            neighborhood: neighborhood.trim() || 'Centro',
            city: city.trim() || 'São Paulo',
            state: state.trim() || 'SP',
            zipCode: zipCode.trim() || '01000-000',
          };

      await createManualOrder({
        customer: {
          name: custName.trim(),
          phone: custPhone.trim(),
          email: custEmail.trim() || undefined,
          cpf: custCpf.trim() || undefined,
        },
        address: addressData,
        items: manualCart,
        subtotal: manualSubtotal,
        shipping: Number(manualShipping) || 0,
        discount: Number(manualDiscount) || 0,
        paymentMethod: manualPaymentMethod,
        status: manualStatus,
        notes: manualNotes.trim() || 'Pedido manual registrado via painel ERP.',
        clearedBy: manualOperator,
      });

      handleResetManualOrderForm();
      setIsManualModalOpen(false);
    } catch (err) {
      console.error('Error submitting manual order:', err);
      setManualFormError('Erro ao registrar pedido manual. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmittingManualOrder(false);
    }
  };

  const handleSaveOrdersToCloud = async () => {
    setIsSavingOrders(true);
    // 1. Refresh from both Firestore and Supabase to ensure all 53 orders are unified
    await refreshSalesData(true);
    // 2. Persist full list to both cloud storages
    const success = await saveAllOrdersToCloud();
    setIsSavingOrders(false);
    if (success) {
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // --- Edit Order State & Handlers ---
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustCpf, setEditCustCpf] = useState('');
  const [editIsPickup, setEditIsPickup] = useState(true);
  const [editStreet, setEditStreet] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editComplement, setEditComplement] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editCity, setEditCity] = useState('São Paulo');
  const [editState, setEditState] = useState('SP');
  const [editZipCode, setEditZipCode] = useState('01000-000');
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editCart, setEditCart] = useState<CartItem[]>([]);
  const [editSelectedProdId, setEditSelectedProdId] = useState<string>('');
  const [editSelectedQty, setEditSelectedQty] = useState<number>(1);
  const [editProdSearch, setEditProdSearch] = useState<string>('');
  const [editSelectedProdPrice, setEditSelectedProdPrice] = useState<string | number>('');
  const [editUpdateCatalogPriceToo, setEditUpdateCatalogPriceToo] = useState<boolean>(false);
  const [isEditProdSearchOpen, setIsEditProdSearchOpen] = useState<boolean>(false);
  const [editShipping, setEditShipping] = useState<number>(0);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editPaidAmount, setEditPaidAmount] = useState<string | number>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar'>('PIX');
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pago');
  const [editOperator, setEditOperator] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSubmittingEditOrder, setIsSubmittingEditOrder] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Active Selected Product for Editing
  const currentEditSelectedProduct =
    products.find((p) => p.id === (editSelectedProdId || products[0]?.id)) || products[0];

  const filteredEditProducts = products.filter((p) => {
    if (!editProdSearch.trim()) return true;
    const term = editProdSearch.toLowerCase().trim();
    const nameMatch = (p.name || '').toLowerCase().includes(term);
    const dosageMatch = (p.dosage || '').toLowerCase().includes(term);
    const catMatch = (p.category || '').toLowerCase().includes(term);
    return nameMatch || dosageMatch || catMatch;
  });

  const handleSelectEditProduct = (prod: Product) => {
    setEditSelectedProdId(prod.id);
    setEditSelectedProdPrice(prod.price);
    setEditProdSearch(`${prod.name} ${prod.dosage || ''}`.trim());
    setIsEditProdSearchOpen(false);
  };

  const handleOpenEditModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingOrder(order);
    setEditCustName(order.customer?.name || '');
    setEditCustPhone(order.customer?.phone || '');
    setEditCustEmail(order.customer?.email || '');
    setEditCustCpf(order.customer?.cpf || '');

    const isStreetPickup = !order.address?.street || order.address?.street.toLowerCase().includes('balcão') || order.address?.street.toLowerCase().includes('retirada');
    setEditIsPickup(isStreetPickup);
    setEditStreet(order.address?.street || '');
    setEditNumber(order.address?.number || '');
    setEditComplement(order.address?.complement || '');
    setEditNeighborhood(order.address?.neighborhood || '');
    setEditCity(order.address?.city || 'São Paulo');
    setEditState(order.address?.state || 'SP');
    setEditZipCode(order.address?.zipCode || '01000-000');
    setEditTrackingCode(order.trackingCode || '');

    setEditCart(JSON.parse(JSON.stringify(order.items || [])));

    const firstProd = products[0];
    setEditSelectedProdId(firstProd?.id || '');
    setEditSelectedQty(1);
    setEditProdSearch('');
    setEditSelectedProdPrice(firstProd?.price !== undefined ? firstProd.price : '');
    setEditUpdateCatalogPriceToo(false);
    setIsEditProdSearchOpen(false);

    setEditShipping(order.shipping || 0);
    setEditDiscount(order.discount || 0);

    const initialPaid = order.paidAmount !== undefined 
      ? order.paidAmount 
      : (order.status === 'Pago' || order.status === 'Entregue' || order.status === 'Em Separação' || order.status === 'Enviado' ? (order.total || 0) : 0);
    setEditPaidAmount(initialPaid);

    setEditPaymentMethod(order.paymentMethod || 'PIX');
    setEditStatus(order.status || 'Pendente');
    setEditOperator(order.clearedBy || currentUser?.name || 'Administrador');
    setEditNotes(order.notes || '');
    setEditFormError(null);
  };

  // Automatically open order in edit mode when redirected from Sales Reports or external tab
  React.useEffect(() => {
    if (initialEditingOrderId && orders.length > 0) {
      const orderToEdit = orders.find((o) => o.id === initialEditingOrderId);
      if (orderToEdit) {
        handleOpenEditModal(orderToEdit);
        if (onClearInitialEditingOrder) {
          onClearInitialEditingOrder();
        }
      }
    }
  }, [initialEditingOrderId, orders]);

  const handleAddProductToEditOrder = async () => {
    const targetProd = currentEditSelectedProduct;
    if (!targetProd) return;

    const parsedPrice =
      editSelectedProdPrice !== '' && !isNaN(Number(editSelectedProdPrice))
        ? Math.max(0, Number(editSelectedProdPrice))
        : targetProd.price;

    if (editUpdateCatalogPriceToo && parsedPrice !== targetProd.price) {
      await updateProduct(targetProd.id, { price: parsedPrice });
    }

    setEditCart((prev) => {
      const existing = prev.find((item) => item.product.id === targetProd.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === targetProd.id
            ? {
                ...item,
                product: { ...targetProd, price: parsedPrice },
                quantity: item.quantity + editSelectedQty,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product: { ...targetProd, price: parsedPrice },
          quantity: editSelectedQty,
        },
      ];
    });

    setEditSelectedQty(1);
    setEditUpdateCatalogPriceToo(false);
  };

  const handleRemoveEditItem = (prodId: string) => {
    setEditCart((prev) => prev.filter((i) => i.product.id !== prodId));
  };

  const handleUpdateEditItemQty = (prodId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveEditItem(prodId);
      return;
    }
    setEditCart((prev) =>
      prev.map((i) => (i.product.id === prodId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleUpdateEditItemPrice = (prodId: string, newPrice: number) => {
    const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    setEditCart((prev) =>
      prev.map((item) =>
        item.product.id === prodId
          ? {
              ...item,
              product: {
                ...item.product,
                price: validPrice,
              },
            }
          : item
      )
    );
  };

  const editSubtotal = editCart.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  );
  const editTotal = Math.max(
    0,
    editSubtotal + (Number(editShipping) || 0) - (Number(editDiscount) || 0)
  );

  const handleSaveEditedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setEditFormError(null);

    if (!editCustName.trim()) {
      setEditFormError('Informe o nome do cliente.');
      return;
    }
    if (!editCustPhone.trim()) {
      setEditFormError('Informe o WhatsApp / telefone do cliente.');
      return;
    }
    if (editCart.length === 0) {
      setEditFormError('O pedido deve conter pelo menos 1 produto.');
      return;
    }

    try {
      setIsSubmittingEditOrder(true);

      const addressData = editIsPickup
        ? {
            street: 'Balcão / Retirada Loja Física',
            number: 'S/N',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000',
          }
        : {
            street: editStreet.trim() || 'Balcão',
            number: editNumber.trim() || 'S/N',
            complement: editComplement.trim(),
            neighborhood: editNeighborhood.trim() || 'Centro',
            city: editCity.trim() || 'São Paulo',
            state: editState.trim() || 'SP',
            zipCode: editZipCode.trim() || '01000-000',
          };

      const isNowPaid = editStatus === 'Pago' || editStatus === 'Entregue' || editStatus === 'Em Separação' || editStatus === 'Enviado';
      const parsedPaidAmount = editPaidAmount !== '' && !isNaN(Number(editPaidAmount)) ? Math.max(0, Number(editPaidAmount)) : (isNowPaid ? editTotal : 0);
      const computedRemaining = Math.max(0, Number((editTotal - parsedPaidAmount).toFixed(2)));

      const updatedPayload: Partial<Order> = {
        customer: {
          name: editCustName.trim(),
          phone: editCustPhone.trim(),
          email: editCustEmail.trim() || 'cliente@peptideimports.com.br',
          cpf: editCustCpf.trim() || undefined,
        },
        address: addressData,
        trackingCode: editTrackingCode.trim() || undefined,
        items: editCart,
        subtotal: editSubtotal,
        shipping: Number(editShipping) || 0,
        discount: Number(editDiscount) || 0,
        total: editTotal,
        paidAmount: parsedPaidAmount,
        remainingAmount: computedRemaining,
        paymentMethod: editPaymentMethod,
        status: editStatus,
        notes: editNotes.trim() || undefined,
        clearedBy: (isNowPaid || editStatus === 'Pago Parcial') ? (editOperator.trim() || currentUser?.name || 'Administrador') : undefined,
        clearedManuallyAt: (isNowPaid || editStatus === 'Pago Parcial') ? (editingOrder.clearedManuallyAt || new Date().toLocaleString('pt-BR')) : undefined,
      };

      await updateOrder(editingOrder.id, updatedPayload);

      if (selectedOrder && selectedOrder.id === editingOrder.id) {
        setSelectedOrder({
          ...selectedOrder,
          ...updatedPayload,
          customer: {
            ...selectedOrder.customer,
            ...updatedPayload.customer,
          },
          address: {
            ...selectedOrder.address,
            ...updatedPayload.address,
          },
        } as Order);
      }

      setEditingOrder(null);
    } catch (err) {
      console.error('Error saving edited order:', err);
      setEditFormError('Erro ao atualizar o pedido. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmittingEditOrder(false);
    }
  };

  // Manual clearance modal state (supports full or partial clearance)
  const [clearingOrder, setClearingOrder] = useState<Order | null>(null);
  const [clearStatus, setClearStatus] = useState<OrderStatus>('Pago');
  const [clearPaidAmount, setClearPaidAmount] = useState<string | number>('');
  const [clearNotes, setClearNotes] = useState('');
  const [operatorName, setOperatorName] = useState(currentUser?.name || 'Administrador');

  // WhatsApp Order Summary / Relatório Modal State
  const [summaryOrder, setSummaryOrder] = useState<Order | null>(null);
  const [summaryWhatsAppPhone, setSummaryWhatsAppPhone] = useState('');
  const [summaryCopied, setSummaryCopied] = useState(false);

  // Delete Order with Password 8817 state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statuses: OrderStatus[] = [
    'Pendente',
    'Pago Parcial',
    'Pago',
    'Em Separação',
    'Enviado',
    'Entregue',
    'Cancelado',
  ];

  const statusOptions: { status: OrderStatus; label: string; icon: any; color: string; desc: string }[] = [
    { status: 'Pendente', label: 'Pendente', icon: Clock, color: 'border-amber-500/50 bg-amber-500/10 text-amber-400', desc: 'Aguardando baixa' },
    { status: 'Pago Parcial', label: 'Pago Parcial', icon: DollarSign, color: 'border-orange-500/50 bg-orange-500/10 text-orange-400', desc: 'Baixa parcial (resta saldo)' },
    { status: 'Pago', label: 'Pago', icon: CheckCircle, color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400', desc: 'Comprovante conferido' },
    { status: 'Em Separação', label: 'Em Separação', icon: Package, color: 'border-purple-500/50 bg-purple-500/10 text-purple-400', desc: 'Embalagem térmica' },
    { status: 'Enviado', label: 'Enviado', icon: Truck, color: 'border-blue-500/50 bg-blue-500/10 text-blue-400', desc: 'Despachado' },
    { status: 'Entregue', label: 'Entregue', icon: ShieldCheck, color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400', desc: 'Pedido concluído' },
    { status: 'Cancelado', label: 'Cancelado', icon: X, color: 'border-red-500/50 bg-red-500/10 text-red-400', desc: 'Cancelado' },
  ];

  // Distinct list of products available across catalog and existing orders
  const availableProductOptions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      const label = `${p.name}${p.dosage ? ` (${p.dosage})` : ''}`.trim();
      if (label) map.set(label.toLowerCase(), label);
    });
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const pName = (item.product?.name || (item as any).name || '').trim();
        const pDosage = (item.product?.dosage || (item as any).dosage || '').trim();
        if (pName) {
          const label = `${pName}${pDosage ? ` (${pDosage})` : ''}`.trim();
          map.set(label.toLowerCase(), label);
        }
      });
    });
    return Array.from(map.values()).sort();
  }, [products, orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      let matchesStatus = true;
      if (statusFilter === 'Aguardando Baixa') {
        matchesStatus = order.status === 'Pendente' || order.status === 'Pago Parcial' || !order.clearedManuallyAt;
      } else if (statusFilter !== 'Todos') {
        matchesStatus = order.status === statusFilter;
      }

      // Filter by dedicated product selection / search
      const pFilter = (productSearchFilter || '').toLowerCase().trim();
      const matchesProductFilter =
        !pFilter ||
        (order.items || []).some((item) => {
          const pName = (item.product?.name || (item as any).name || '').toLowerCase();
          const pDosage = (item.product?.dosage || (item as any).dosage || '').toLowerCase();
          const pCategory = (item.product?.category || (item as any).category || '').toLowerCase();
          const combined = `${pName} ${pDosage} ${pCategory}`.toLowerCase();
          return pName.includes(pFilter) || pDosage.includes(pFilter) || combined.includes(pFilter);
        });

      // General search term matches order #, client name, email, phone OR any product item inside the order
      const q = (searchTerm || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        (order.orderNumber || '').toLowerCase().includes(q) ||
        (order.customer?.name || '').toLowerCase().includes(q) ||
        (order.customer?.email || '').toLowerCase().includes(q) ||
        (typeof order.customer?.phone === 'string' && order.customer.phone.includes(q)) ||
        (order.items || []).some((item) => {
          const pName = (item.product?.name || (item as any).name || '').toLowerCase();
          const pDosage = (item.product?.dosage || (item as any).dosage || '').toLowerCase();
          const combined = `${pName} ${pDosage}`.toLowerCase();
          return pName.includes(q) || combined.includes(q);
        });

      return matchesStatus && matchesSearch && matchesProductFilter;
    });
  }, [orders, statusFilter, searchTerm, productSearchFilter]);

  const handleExportOrdersExcel = () => {
    try {
      const title = statusFilter === 'Todos' ? 'todos_pedidos' : statusFilter.toLowerCase().replace(/\s+/g, '_');
      const filename = exportOrdersListToExcel(filteredOrders, title, storeSettings?.storeName || 'Peptide Imports Farma');
      showToast(`📊 Planilha Excel com ${filteredOrders.length} pedidos baixada: ${filename}`);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao exportar pedidos em Excel.');
    }
  };

  const handleExportOrdersTxt = () => {
    try {
      const title = statusFilter === 'Todos' ? 'todos_pedidos' : statusFilter.toLowerCase().replace(/\s+/g, '_');
      const filename = exportOrdersListToTxt(filteredOrders, title, storeSettings?.storeName || 'Peptide Imports Farma');
      showToast(`📄 Arquivo TXT com ${filteredOrders.length} pedidos baixado: ${filename}`);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao exportar pedidos em TXT.');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Entregue':
        return { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', text: 'Entregue' };
      case 'Enviado':
        return { bg: 'bg-blue-500/15 text-blue-300 border-blue-500/40', text: 'Enviado' };
      case 'Em Separação':
        return { bg: 'bg-purple-500/15 text-purple-300 border-purple-500/40', text: 'Em Separação' };
      case 'Pago':
        return { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40', text: 'Pago' };
      case 'Pago Parcial':
        return { bg: 'bg-orange-500/15 text-orange-300 border-orange-500/40', text: 'Pago Parcial' };
      case 'Cancelado':
        return { bg: 'bg-red-500/15 text-red-300 border-red-500/40', text: 'Cancelado' };
      default:
        return { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40', text: 'Pendente' };
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
    setClearPaidAmount(order.paidAmount !== undefined ? order.paidAmount : (order.total || 0));
    setClearNotes(order.notes || 'Comprovante conferido e validado via WhatsApp.');
    setOperatorName(currentUser?.name || 'Administrador');
  };

  const handleConfirmClear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearingOrder) return;

    const parsedPaid = clearPaidAmount !== '' && !isNaN(Number(clearPaidAmount))
      ? Math.max(0, Number(clearPaidAmount))
      : (clearStatus === 'Pago' || clearStatus === 'Entregue' ? clearingOrder.total : clearingOrder.paidAmount);
    
    const parsedRemaining = parsedPaid !== undefined
      ? Math.max(0, Number(((clearingOrder.total || 0) - parsedPaid).toFixed(2)))
      : clearingOrder.remainingAmount;

    clearOrderManually(clearingOrder.id, clearStatus, operatorName, clearNotes, parsedPaid, parsedRemaining);

    if (selectedOrder && selectedOrder.id === clearingOrder.id) {
      setSelectedOrder({
        ...selectedOrder,
        status: clearStatus,
        paidAmount: parsedPaid,
        remainingAmount: parsedRemaining,
        clearedManuallyAt: new Date().toLocaleString('pt-BR'),
        clearedBy: operatorName,
        notes: clearNotes,
      });
    }

    setClearingOrder(null);
  };

  // WhatsApp Order Summary Generation & Dispatch
  const generateOrderSummaryText = (order: Order): string => {
    const brand = storeSettings.storeName || 'PEPTIDE IMPORTS FARMA';
    const dateFormatted = new Date(order.createdAt).toLocaleDateString('pt-BR');
    const timeFormatted = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const isPickupAddr = !order.address?.street || order.address?.street.toLowerCase().includes('balcão') || order.address?.street.toLowerCase().includes('retirada');
    const deliveryType = isPickupAddr ? 'Retirada no Balcão' : 'Envio / Entrega';

    const itemsText = (order.items || [])
      .map((it, idx) => {
        const itemTotal = ((it.product?.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',');
        return `${idx + 1}. *${it.quantity}x* ${it.product?.name || 'Produto'} ${it.product?.dosage || ''} - R$ ${itemTotal}`;
      })
      .join('\n');

    const subtotalFormatted = (order.subtotal ?? order.total ?? 0).toFixed(2).replace('.', ',');
    const shippingFormatted = (order.shipping || 0).toFixed(2).replace('.', ',');
    const discountFormatted = (order.discount || 0) > 0 ? `\n• *Desconto:* -R$ ${(order.discount || 0).toFixed(2).replace('.', ',')}` : '';
    const totalFormatted = (order.total || 0).toFixed(2).replace('.', ',');

    const paidInfo = order.paidAmount !== undefined
      ? `\n• *Valor Pago:* R$ ${Number(order.paidAmount).toFixed(2).replace('.', ',')}`
      : (order.status === 'Pago' || order.status === 'Entregue' ? `\n• *Valor Pago:* R$ ${totalFormatted}` : '');

    const remainingInfo = order.remainingAmount !== undefined && order.remainingAmount > 0
      ? `\n• *SALDO PENDENTE:* R$ ${Number(order.remainingAmount).toFixed(2).replace('.', ',')}`
      : (order.status === 'Pago Parcial' && order.paidAmount !== undefined ? `\n• *SALDO PENDENTE:* R$ ${Math.max(0, (order.total || 0) - (order.paidAmount || 0)).toFixed(2).replace('.', ',')}` : '');

    return `*RESUMO DO PEDIDO - ${brand}*
📋 *Pedido:* ${order.orderNumber}
📅 *Data:* ${dateFormatted} às ${timeFormatted}
🏷️ *Status:* ${order.status}

👤 *DADOS DO CLIENTE:*
• *Nome:* ${order.customer?.name || 'Cliente'}
• *WhatsApp:* ${order.customer?.phone || '-'}${order.customer?.email ? `\n• *E-mail:* ${order.customer.email}` : ''}${order.customer?.cpf ? `\n• *CPF:* ${order.customer.cpf}` : ''}

📦 *ENTREGA & ENDEREÇO:*
• *Modalidade:* ${deliveryType}
• *Endereço:* ${order.address?.street || 'Balcão'}, ${order.address?.number || 'S/N'}${order.address?.complement ? ` (${order.address.complement})` : ''} - ${order.address?.neighborhood || ''}, ${order.address?.city || ''}/${order.address?.state || ''}
• *CEP:* ${order.address?.zipCode || '-'}${order.trackingCode ? `\n• *Código de Rastreio:* ${order.trackingCode}` : ''}

🛒 *ITENS DO PEDIDO:*
${itemsText || 'Nenhum item discriminado'}

💰 *VALORES & PAGAMENTO:*
• *Subtotal:* R$ ${subtotalFormatted}
• *Frete:* R$ ${shippingFormatted}${discountFormatted}
• *VALOR TOTAL:* R$ ${totalFormatted}
• *Forma de Pagamento:* ${order.paymentMethod || 'A Combinar'}${paidInfo}${remainingInfo}${order.notes ? `\n\n📝 *Observações:* ${order.notes}` : ''}
-------------------------------------------
_Peptide Imports Farma - Pureza e Procedência HPLC 99.5%_`;
  };

  const handleOpenOrderSummaryModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSummaryOrder(order);
    setSummaryWhatsAppPhone(order.customer?.phone || '');
    setSummaryCopied(false);
  };

  const handleSendOrderWhatsApp = () => {
    if (!summaryOrder) return;
    const cleanPhone = (summaryWhatsAppPhone || summaryOrder.customer?.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Por favor, informe um número de WhatsApp válido.');
      return;
    }
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const summaryText = generateOrderSummaryText(summaryOrder);
    const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(summaryText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyOrderSummary = () => {
    if (!summaryOrder) return;
    const summaryText = generateOrderSummaryText(summaryOrder);
    navigator.clipboard.writeText(summaryText);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2500);
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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 w-full overflow-hidden">
      
      {/* Top Bar Summary & Header (Mobile Responsive) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl sm:rounded-2xl shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
              Pedidos & Baixas Manuais
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Conferência rápida de pagamentos, baixa no estoque e rastreio
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0">
          <button
            onClick={() => {
              handleResetManualOrderForm();
              setIsManualModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer min-h-[36px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Novo Pedido Manual</span>
          </button>

          <button
            onClick={() => setStatusFilter('Aguardando Baixa')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px] ${
              statusFilter === 'Aguardando Baixa'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span>Aguardando Baixa: <strong>{pendingCount}</strong></span>
          </button>

          <button
            onClick={handleSaveOrdersToCloud}
            disabled={isSavingOrders}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
            title="Sincronizar pedidos com a nuvem"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSavingOrders ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSavingOrders ? 'Salvando...' : 'Nuvem'}</span>
            {lastSaved && <span className="text-[10px] text-emerald-400 font-mono hidden md:inline">({lastSaved})</span>}
          </button>

          <button
            onClick={handleExportOrdersExcel}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
            title="Exportar pedidos da listagem em planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportOrdersTxt}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
            title="Exportar pedidos da listagem em arquivo TXT (.txt)"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">TXT</span>
          </button>
        </div>
      </div>

      {/* Search and Horizontal Filter Pills (Mobile & Desktop Optimized) */}
      <div className="space-y-2.5 bg-slate-900/70 border border-slate-800 p-3 sm:p-4 rounded-2xl">
        
        {/* Search Bar & Product Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          
          {/* General Search Input */}
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nº, cliente, telefone ou produto..."
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dedicated Product Filter Dropdown & Search */}
          <div className="sm:col-span-5 relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <Package className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={productSearchFilter}
                onChange={(e) => setProductSearchFilter(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 sm:py-2.5 bg-slate-950 border rounded-xl text-xs focus:outline-none focus:border-cyan-500 min-h-[40px] cursor-pointer appearance-none ${
                  productSearchFilter
                    ? 'border-cyan-500/60 text-cyan-300 font-bold bg-cyan-950/20'
                    : 'border-slate-800 text-slate-300'
                }`}
                title="Filtrar pedidos pelo produto comprado"
              >
                <option value="">📦 Todos os Produtos (Sem filtro)</option>
                {availableProductOptions.map((prodName, idx) => (
                  <option key={idx} value={prodName}>
                    {prodName}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>

            {productSearchFilter && (
              <button
                onClick={() => setProductSearchFilter('')}
                className="p-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title="Remover filtro de produto"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Active Product Filter Pill indicator */}
        {productSearchFilter && (
          <div className="flex items-center justify-between bg-cyan-950/30 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-cyan-300 animate-in fade-in">
            <div className="flex items-center gap-2 truncate">
              <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Filtrando por produto:</span>
              <strong className="text-white truncate">{productSearchFilter}</strong>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>
            <button
              onClick={() => setProductSearchFilter('')}
              className="text-xs text-cyan-400 hover:text-white underline ml-2 shrink-0 cursor-pointer"
            >
              Limpar Filtro
            </button>
          </div>
        )}

        {/* Scrollable Pills for Mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setStatusFilter('Todos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs min-h-[36px] flex items-center gap-1 ${
              statusFilter === 'Todos'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('Aguardando Baixa')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs min-h-[36px] flex items-center gap-1.5 border ${
              statusFilter === 'Aguardando Baixa'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                : 'bg-slate-950 text-amber-400/90 border-amber-500/30 hover:bg-amber-500/10'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Aguardando Baixa ({pendingCount})</span>
          </button>
          {statuses.map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs min-h-[36px] flex items-center gap-1 ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{st}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List: Mobile Cards (< md) & Desktop Table (>= md) */}
      
      {/* 1. Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
            <Package className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
            <p className="text-white font-bold text-sm">Nenhum pedido encontrado</p>
            <p className="text-slate-400 text-xs">Tente alterar os termos de busca ou o filtro de status.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const totalItems = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
            return (
              <div
                key={order.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-lg hover:border-slate-700 transition-colors"
              >
                {/* Header: Order Number, Date & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="font-extrabold text-cyan-400 text-sm font-tech tracking-wide block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badge.bg}`}>
                    {badge.text}
                  </span>
                </div>

                {/* Customer info & WhatsApp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-white font-bold text-xs truncate block">
                      {order.customer?.name || 'Cliente'}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {order.customer?.phone || '-'}
                    </span>
                  </div>
                  {order.customer?.phone && (
                    <a
                      href={getCustomerWhatsappUrl(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 shrink-0 min-h-[36px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Items & Payment Info */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Itens</span>
                    <span className="text-slate-200 font-bold block">{totalItems} frasco(s)</span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                      {(order.items || []).map((i) => i.product?.name).filter(Boolean).join(', ') || 'Produtos'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Valor Total</span>
                    <span className="text-emerald-400 font-extrabold font-mono text-sm block">
                      R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                      {order.paymentMethod || 'A Combinar'}
                    </span>
                  </div>
                </div>

                {/* Baixa audit notice if already cleared */}
                {order.clearedManuallyAt ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Baixa por <strong>{order.clearedBy}</strong> ({order.clearedManuallyAt})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-950/20 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Aguardando baixa manual do atendente</span>
                  </div>
                )}

                {/* Mobile Action Buttons */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <button
                    onClick={(e) => handleOpenClearModal(order, e)}
                    className="px-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-600/20 min-h-[38px]"
                    title="Dar baixa no pedido"
                  >
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Baixa</span>
                  </button>
                  <button
                    onClick={() => handleOpenDetail(order)}
                    className="px-1.5 py-2 rounded-xl bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-800 min-h-[38px] cursor-pointer"
                    title="Ver detalhes"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenEditModal(order, e)}
                    className="px-1.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border border-cyan-500/30 cursor-pointer min-h-[38px]"
                    title="Editar informações do pedido"
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenOrderSummaryModal(order, e)}
                    className="px-1.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500 hover:text-slate-950 text-teal-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border border-teal-500/30 cursor-pointer min-h-[38px]"
                    title="Enviar resumo do pedido para o WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Relatório</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenDeleteModal(order, e)}
                    className="px-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border border-red-500/20 cursor-pointer min-h-[38px]"
                    title="Excluir pedido"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Table View (>= md) */}
      <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950">
          <table className="w-full min-w-[960px] text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Pedido</th>
                <th className="py-3.5 px-4">Cliente / Contato</th>
                <th className="py-3.5 px-4">Itens</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Total</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Pagamento</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status / Baixa</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 z-20 bg-slate-950 border-l border-slate-800 shadow-[-10px_0_15px_-4px_rgba(0,0,0,0.6)]">
                  Ações
                </th>
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
                    <tr key={order.id} className="group hover:bg-slate-800/30 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-cyan-400 block text-sm font-tech tracking-wide">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-100 block text-sm leading-snug">{order.customer?.name || 'Cliente'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
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
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200">
                          {(order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)} frasco(s)
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                          {(order.items || []).map((i) => i.product?.name || 'Item').join(', ')}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 font-extrabold text-white text-sm whitespace-nowrap">
                        R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-700/80 text-slate-300 whitespace-nowrap shadow-sm">
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
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badge.bg}`}>
                            {badge.text}
                          </span>
                          {order.clearedManuallyAt ? (
                            <span className="block text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              Baixa por {order.clearedBy}
                            </span>
                          ) : (
                            <span className="block text-[10px] text-amber-400 font-medium">
                              Aguardando baixa
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sticky Actions Column - NEVER gets hidden */}
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap sticky right-0 z-10 bg-slate-900 group-hover:bg-[#161f30] border-l border-slate-800 shadow-[-10px_0_15px_-4px_rgba(0,0,0,0.6)] transition-colors">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            onClick={(e) => handleOpenClearModal(order, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm shrink-0 min-h-[34px]"
                            title="Dar baixa manual neste pedido"
                          >
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Baixa</span>
                          </button>
                          <button
                            onClick={() => handleOpenDetail(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-800 cursor-pointer shrink-0 min-h-[34px]"
                            title="Ver detalhes do pedido"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenEditModal(order, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-all border border-cyan-500/30 cursor-pointer shadow-sm shrink-0 min-h-[34px]"
                            title="Editar dados deste pedido"
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenOrderSummaryModal(order, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500 hover:text-slate-950 text-teal-300 text-xs font-semibold flex items-center gap-1 transition-all border border-teal-500/30 cursor-pointer shadow-sm shrink-0 min-h-[34px]"
                            title="Gerar e enviar resumo do pedido para o WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>Relatório</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(order, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all border border-red-500/20 cursor-pointer shadow-sm shrink-0 min-h-[34px]"
                            title="Excluir pedido (Requer senha 8817)"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Excluir</span>
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
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Mostrando {filteredOrders.length} de {orders.length} pedidos</span>
          <span className="text-[11px] text-slate-500">Dica: A coluna de ações fica fixada à direita para acesso imediato.</span>
        </div>
      </div>

      {/* Modal: Manual Clearance (Baixa Manual) - Responsive */}
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
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl sm:rounded-2xl border border-emerald-500/30 shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                  Conferência de Pedido
                </span>
                <h3 className="text-base sm:text-xl font-extrabold font-tech text-white">
                  Dar baixa manual: {clearingOrder.orderNumber}
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmClear} className="space-y-4 sm:space-y-5 text-xs">
              {/* Summary Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CLIENTE</span>
                  <p className="font-bold text-white text-xs sm:text-sm mt-0.5 truncate">{clearingOrder.customer?.name || 'Cliente'}</p>
                  <p className="text-slate-400 text-[11px]">{clearingOrder.customer?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">VALOR TOTAL DO PEDIDO</span>
                  <p className="font-extrabold text-cyan-400 text-xs sm:text-sm mt-0.5 font-tech">
                    R$ {(clearingOrder.total || 0).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">FORMA PAGAMENTO</span>
                  <p className="font-bold text-slate-200 text-xs mt-0.5 truncate">{clearingOrder.paymentMethod || 'A Combinar'}</p>
                </div>
              </div>

              {/* Baixa Parcial / Valor Pago */}
              <div className="p-3.5 bg-slate-950/90 rounded-xl sm:rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Valor Pago pelo Cliente (Baixa Total ou Parcial)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total: R$ {(clearingOrder.total || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="sm:col-span-6 relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-xs">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={clearingOrder.total || 999999}
                      value={clearPaidAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClearPaidAmount(val);
                        const numVal = parseFloat(val) || 0;
                        if (numVal >= (clearingOrder.total || 0)) {
                          setClearStatus('Pago');
                        } else if (numVal > 0) {
                          setClearStatus('Pago Parcial');
                        } else {
                          setClearStatus('Pendente');
                        }
                      }}
                      className="w-full px-3 py-2 pl-9 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl text-white font-mono font-bold text-sm focus:outline-none min-h-[40px]"
                      placeholder="0,00"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="sm:col-span-6 flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setClearPaidAmount(clearingOrder.total || 0);
                        setClearStatus('Pago');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      100% (Total)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const half = Number(((clearingOrder.total || 0) / 2).toFixed(2));
                        setClearPaidAmount(half);
                        setClearStatus('Pago Parcial');
                      }}
                      className="px-2.5 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      50% (Entrada)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClearPaidAmount(0);
                        setClearStatus('Pendente');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Zerar (0)
                    </button>
                  </div>
                </div>

                {/* Calculation indicator */}
                {(() => {
                  const paid = clearPaidAmount !== '' && !isNaN(Number(clearPaidAmount)) ? Number(clearPaidAmount) : 0;
                  const total = clearingOrder.total || 0;
                  const remaining = Math.max(0, Number((total - paid).toFixed(2)));
                  const isPartial = paid > 0 && paid < total;
                  const isFullyPaid = paid >= total && total > 0;

                  return (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Status financeiro:</span>
                        {isFullyPaid && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                            ✓ Pagamento 100% Quitado
                          </span>
                        )}
                        {isPartial && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] font-bold">
                            ⚠️ Baixa Parcial (Resta Saldo)
                          </span>
                        )}
                        {paid === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                            Pendente Integral
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-right text-[11px]">
                        <span className="text-slate-400">Saldo Pendente (A Pagar): </span>
                        <strong className={remaining > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          R$ {remaining.toFixed(2).replace('.', ',')}
                        </strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Status Selection Cards */}
              <div className="space-y-2">
                <label className="block text-slate-200 font-bold text-xs tracking-wide">
                  Qual será o novo status do pedido?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {statusOptions.map((opt) => {
                    const isSelected = clearStatus === opt.status;
                    return (
                      <div
                        key={opt.status}
                        onClick={() => setClearStatus(opt.status)}
                        className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-1 min-h-[64px] ${
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
                          <span className="text-[10px] text-slate-400 leading-tight block truncate">{opt.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-1 flex items-center gap-2 text-xs text-cyan-300 font-semibold bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20">
                  <span>Status selecionado:</span>
                  <span className="font-extrabold underline">✓ {clearStatus}</span>
                </div>
              </div>

              {/* Operator & Payment display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Forma de Pagamento
                  </label>
                  <input
                    type="text"
                    disabled
                    value={clearingOrder.paymentMethod || 'A Combinar'}
                    className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-xs cursor-not-allowed min-h-[38px]"
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 min-h-[38px]"
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500 resize-none"
                />
              </div>

              {/* Items Summary */}
              <div className="p-3 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1">
                  Itens do Pedido ({(clearingOrder.items || []).reduce((s, i) => s + (i.quantity || 0), 0)} frascos)
                </span>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {(clearingOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 truncate max-w-[220px]">
                        {item.quantity}x {item.product?.name || 'Produto'}
                      </span>
                      <span className="font-bold text-white shrink-0">
                        R$ {((item.product?.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Confirmation Box */}
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-cyan-300">Resumo da baixa manual:</p>
                <div className="text-[10px] text-slate-300 space-y-0.5 font-mono">
                  <p>• Pedido: <strong>{clearingOrder.orderNumber}</strong> | Novo status: <strong className="text-cyan-400">{clearStatus}</strong></p>
                  <p>• Valor total: <strong>R$ {(clearingOrder.total || 0).toFixed(2).replace('.', ',')}</strong></p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClearingOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-1.5 min-h-[42px]"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar Baixa</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal (Responsive) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-4 sm:mb-6 gap-3 pr-10 sm:pr-0">
              <div>
                <span className="text-[10px] sm:text-xs text-cyan-400 font-bold uppercase tracking-wider block">
                  Gestão do Pedido
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold font-tech text-white">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    handleOpenEditModal(ord);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  title="Editar dados deste pedido"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleOpenOrderSummaryModal(selectedOrder)}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  title="Enviar resumo do pedido para o WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Relatório WhatsApp</span>
                </button>
                <button
                  onClick={() => handleOpenDeleteModal(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-all border border-red-500/30 cursor-pointer"
                  title="Excluir este pedido definitivamente (requer senha 8817)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
                <button
                  onClick={() => handleOpenClearModal(selectedOrder)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Dar Baixa</span>
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(selectedOrder.status).bg}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Clearance Audit Info */}
            {selectedOrder.clearedManuallyAt && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 mb-4 sm:mb-6 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Baixa Manual Efetuada no Sistema</p>
                  <p className="text-[11px] text-emerald-200/80">
                    Realizada em {selectedOrder.clearedManuallyAt} por <strong>{selectedOrder.clearedBy}</strong>.
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-[11px] text-slate-300 mt-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <strong>Obs:</strong> {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs mb-4 sm:mb-6">
              {/* Customer Box */}
              <div className="p-3.5 sm:p-4 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Dados do Cliente
                  </h4>
                  {selectedOrder.customer?.phone && (
                    <a
                      href={getCustomerWhatsappUrl(selectedOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
                <p className="text-white font-bold text-xs sm:text-sm">{selectedOrder.customer?.name || 'Cliente'}</p>
                <p className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <Mail className="w-3 h-3 text-slate-500 shrink-0" /> {selectedOrder.customer?.email || '-'}
                </p>
                <p className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <Phone className="w-3 h-3 text-slate-500 shrink-0" /> {selectedOrder.customer?.phone || '-'}
                </p>
                {selectedOrder.customer?.cpf && (
                  <p className="text-slate-500 font-mono text-[10px]">CPF: {selectedOrder.customer.cpf}</p>
                )}
              </div>

              {/* Delivery Box */}
              <div className="p-3.5 sm:p-4 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Endereço de Entrega
                </h4>
                <p className="text-white font-medium leading-relaxed text-xs">
                  {selectedOrder.address?.street || ''}, {selectedOrder.address?.number || ''}
                  {selectedOrder.address?.complement && ` (${selectedOrder.address.complement})`}
                </p>
                <p className="text-slate-400 text-[11px]">
                  {selectedOrder.address?.neighborhood || ''} - {selectedOrder.address?.city || ''}/{selectedOrder.address?.state || ''}
                </p>
                <p className="text-slate-500 font-mono text-[10px]">CEP: {selectedOrder.address?.zipCode || '-'}</p>
              </div>
            </div>

            {/* Tracking Code input */}
            <div className="p-3.5 sm:p-4 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 mb-4 sm:mb-6 flex flex-col sm:flex-row items-center gap-2.5">
              <div className="flex-1 w-full text-xs">
                <label className="block text-slate-400 font-semibold mb-1">
                  Código de Rastreio Sedex / Transportadora:
                </label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Ex: BR984210345SP"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 min-h-[38px]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedOrder.status)}
                className="w-full sm:w-auto mt-1 sm:mt-5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[38px]"
              >
                Salvar Rastreio
              </button>
            </div>

            {/* Purchased Items list */}
            <div className="space-y-2 mb-4 sm:mb-6">
              <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wide">
                Itens Comprados ({(selectedOrder.items || []).length})
              </h4>
              <div className="space-y-1.5">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-9 bg-slate-900 rounded flex items-center justify-center shrink-0">
                        <PeptideVial capColor={item.product?.capColor} size="sm" />
                      </div>
                      <div>
                        <span className="font-bold text-white">{item.product?.name || 'Produto'}</span>
                        <span className="text-slate-400 text-[11px] block">{item.product?.dosage || '-'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">{item.quantity}x R$ {(item.product?.price || 0).toFixed(2).replace('.', ',')}</span>
                      <span className="font-bold text-white">R$ {((item.product?.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-400 mb-4 sm:mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-semibold">R$ {(selectedOrder.subtotal ?? (selectedOrder.total || 0)).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Envio</span>
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
              <div className="flex justify-between text-sm sm:text-base font-bold text-white border-t border-slate-800 pt-2 mt-1">
                <span>Total Faturado</span>
                <span className="text-cyan-400 font-tech">R$ {(selectedOrder.total || 0).toFixed(2).replace('.', ',')}</span>
              </div>

              {/* Partial Payment info if applicable */}
              {(selectedOrder.paidAmount !== undefined || selectedOrder.remainingAmount !== undefined || selectedOrder.status === 'Pago Parcial') && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1 bg-slate-900/60 p-2.5 rounded-xl mt-2">
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Valor Pago pelo Cliente:
                    </span>
                    <span className="font-mono">R$ {(selectedOrder.paidAmount ?? (selectedOrder.status === 'Pago' ? selectedOrder.total : 0) ?? 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Saldo Pendente (A Receber):
                    </span>
                    <span className="font-mono">R$ {(selectedOrder.remainingAmount ?? Math.max(0, (selectedOrder.total || 0) - (selectedOrder.paidAmount || 0))).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Change Status Fast Buttons */}
            <div className="border-t border-slate-800 pt-3 flex flex-wrap gap-1.5 justify-end">
              <span className="text-xs text-slate-400 self-center mr-1">Status rápido:</span>
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
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

      {/* Modal: Exclusão Segura com Senha 8817 (Responsive) */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-red-950/50"
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
                  Ação Crítica de Administrador
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Excluir Pedido {orderToDelete.orderNumber}
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-3.5">
              {/* Order Info Summary */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="text-white font-semibold truncate max-w-[200px]">{orderToDelete.customer?.name || 'Cliente'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-emerald-400 font-bold font-mono">R$ {(orderToDelete.total || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Atual:</span>
                  <span className="text-cyan-400 font-semibold">{orderToDelete.status}</span>
                </div>
              </div>

              <div className="p-3 bg-red-950/25 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Esta ação excluirá permanentemente o pedido do banco de dados. Para prosseguir, confirme a senha de segurança:
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
                    setOrderToDelete(null);
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

      {/* Modal: Adicionar Pedido Manual (Mobile & Desktop Responsive) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-2xl my-6 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Adicionar Pedido Manual
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Registra o pedido no ERP com baixa no estoque e lançamento contábil
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isSubmittingManualOrder) {
                    setIsManualModalOpen(false);
                    handleResetManualOrderForm();
                  }
                }}
                className="p-2 text-slate-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitManualOrder} className="space-y-4 overflow-y-auto pr-1 py-3 text-xs flex-1">
              {/* Section 1: Dados do Cliente */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>1. Dados do Cliente</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="Ex: Dr. Roberto Guimarães"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">WhatsApp / Telefone *</label>
                    <input
                      type="text"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">E-mail (Opcional)</label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">CPF (Opcional)</label>
                    <input
                      type="text"
                      value={custCpf}
                      onChange={(e) => setCustCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Modalidade de Entrega e Endereço */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>2. Endereço / Entrega</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsPickup(true)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        isPickup ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Retirada / Balcão
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPickup(false)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        !isPickup ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Entrega / Envio
                    </button>
                  </div>
                </div>

                {!isPickup ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 animate-in fade-in">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-slate-400 font-medium mb-1">CEP</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 min-h-[38px]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-400 font-medium mb-1">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Av. Paulista"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 min-h-[38px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="1000"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 min-h-[38px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Bairro</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Bela Vista"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 min-h-[38px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Cidade / UF</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="São Paulo"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 min-h-[38px]"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="SP"
                          maxLength={2}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-center uppercase min-h-[38px]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Retirada em mãos / Balcão da distribuidora (Sem taxa de frete de envio).</span>
                  </div>
                )}
              </div>

              {/* Section 3: Produtos do Pedido com Pesquisa e Edição de Preço */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    <span>3. Produtos / Peptídeos do Pedido</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    {manualCart.length} item(ns)
                  </span>
                </div>

                {/* Bloco de Pesquisa e Seleção do Produto */}
                <div className="space-y-2.5">
                  {/* Campo de Pesquisa Ativa */}
                  <div className="relative">
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-cyan-400" />
                        Pesquisar Peptídeo no Catálogo:
                      </span>
                      <span className="text-[10px] text-slate-500">Busque por nome, dosagem ou categoria</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={manualProdSearch}
                        onChange={(e) => {
                          setManualProdSearch(e.target.value);
                          setIsProdSearchOpen(true);
                        }}
                        onFocus={() => setIsProdSearchOpen(true)}
                        placeholder="Ex: Tirzepatida, Retatrutida, 60mg, Semaglutida, BPC..."
                        className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs min-h-[40px]"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      {manualProdSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setManualProdSearch('');
                            setIsProdSearchOpen(false);
                          }}
                          className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Menu Flutuante de Resultados da Busca */}
                    {isProdSearchOpen && (
                      <div
                        className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl shadow-black/90 p-1.5 space-y-1"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {filteredManualProducts.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            Nenhum produto encontrado para "{manualProdSearch}".
                          </div>
                        ) : (
                          filteredManualProducts.slice(0, 15).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectProduct(p)}
                              className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                                p.id === currentSelectedProduct?.id
                                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-white'
                                  : 'hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <PeptideVial color={p.vialColor || '#06b6d4'} size="sm" />
                                <div className="min-w-0">
                                  <span className="font-bold text-white block truncate">
                                    {p.name} {p.dosage ? `(${p.dosage})` : ''}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {p.category || 'Peptídeos'} • Estoque: {p.stock || 0} un.
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 font-mono font-bold text-emerald-400">
                                R$ {(p.price || 0).toFixed(2).replace('.', ',')}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seleção Alternativa Rápida via Dropdown */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                      <span>Ou escolha na lista de produtos:</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{products.length} cadastrados</span>
                    </label>
                    <select
                      value={currentSelectedProduct?.id || ''}
                      onChange={handleSelectDropdownChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500 text-xs min-h-[40px]"
                    >
                      {filteredManualProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.dosage ? `(${p.dosage})` : ''} — R$ {(p.price || 0).toFixed(2).replace('.', ',')} [Estoque: {p.stock || 0}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cartão do Produto Selecionado com Edição de Preço e Quantidade */}
                  {currentSelectedProduct && (
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                      {/* Linha de Identificação do Produto */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PeptideVial color={currentSelectedProduct.vialColor || '#06b6d4'} size="sm" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {currentSelectedProduct.name} {currentSelectedProduct.dosage ? `(${currentSelectedProduct.dosage})` : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Estoque:{' '}
                              <span className={(currentSelectedProduct.stock || 0) > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                {currentSelectedProduct.stock || 0} un.
                              </span>
                              {' • '}
                              Tabela Oficial:{' '}
                              <span className="text-slate-300 font-semibold">
                                R$ {(currentSelectedProduct.price || 0).toFixed(2).replace('.', ',')}
                              </span>
                            </span>
                          </div>
                        </div>

                        {Number(selectedProdPrice) !== currentSelectedProduct.price && selectedProdPrice !== '' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 font-semibold shrink-0">
                            Preço Personalizado
                          </span>
                        )}
                      </div>

                      {/* Painel de Valor Unitário Editável, Qtd e Botão Adicionar */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        {/* Campo para Editar o Valor do Produto */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] text-cyan-400 font-bold mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Edit3 className="w-3 h-3" />
                              Valor Unitário (R$) *:
                            </span>
                            {Number(selectedProdPrice) !== currentSelectedProduct.price && selectedProdPrice !== '' && (
                              <button
                                type="button"
                                onClick={() => setSelectedProdPrice(currentSelectedProduct.price)}
                                className="text-[10px] text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                              >
                                Restaurar tabela
                              </button>
                            )}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-cyan-400 font-mono text-xs font-bold">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={selectedProdPrice}
                              onChange={(e) => setSelectedProdPrice(e.target.value)}
                              placeholder="0,00"
                              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-cyan-500/60 focus:border-cyan-400 rounded-xl text-white font-mono font-bold text-xs focus:outline-none min-h-[40px]"
                            />
                          </div>
                        </div>

                        {/* Quantidade */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] text-slate-400 font-medium mb-1">Quantidade:</label>
                          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-1.5 py-1 min-h-[40px]">
                            <button
                              type="button"
                              onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={selectedQty}
                              onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full bg-transparent text-white font-bold font-mono text-center text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedQty(selectedQty + 1)}
                              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Botão Adicionar */}
                        <div className="sm:col-span-4">
                          <button
                            type="button"
                            onClick={handleAddProductToManualOrder}
                            className="w-full px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20 min-h-[40px]"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Adicionar</span>
                            <span className="text-[11px] font-mono font-bold ml-1">
                              (R$ {((Number(selectedProdPrice) || currentSelectedProduct.price) * selectedQty).toFixed(2).replace('.', ',')})
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Opção para sincronizar com catálogo da loja se preço alterado */}
                      {Number(selectedProdPrice) !== currentSelectedProduct.price && selectedProdPrice !== '' && (
                        <label className="flex items-center gap-2 text-[11px] text-slate-300 pt-1 cursor-pointer select-none bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <input
                            type="checkbox"
                            checked={updateCatalogPriceToo}
                            onChange={(e) => setUpdateCatalogPriceToo(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer"
                          />
                          <span>
                            Atualizar também o preço padrão de <strong>{currentSelectedProduct.name}</strong> para <strong>R$ {Number(selectedProdPrice).toFixed(2).replace('.', ',')}</strong> no catálogo permanente da loja
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Lista dos Produtos Adicionados ao Pedido com Edição Direta no Carrinho */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>Itens incluídos no pedido:</span>
                    <span className="text-cyan-400 font-mono">
                      Subtotal: R$ {manualSubtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {manualCart.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs">
                      Nenhum produto adicionado ainda. Pesquise e adicione produtos acima.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {manualCart.map((item) => {
                        const itemSubtotal = (item.product.price || 0) * item.quantity;
                        const catalogProd = products.find((p) => p.id === item.product.id);
                        const isPriceCustomized = catalogProd && catalogProd.price !== item.product.price;

                        return (
                          <div
                            key={item.product.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-slate-900 rounded-xl border border-slate-800"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <PeptideVial color={item.product.vialColor || '#06b6d4'} size="sm" />
                              <div className="min-w-0">
                                <h5 className="font-bold text-white truncate text-xs">{item.product.name}</h5>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                  <span>{item.product.dosage}</span>
                                  {isPriceCustomized && (
                                    <span className="text-amber-400 font-medium">
                                      (Tabela: R$ {catalogProd.price.toFixed(2).replace('.', ',')})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 flex-wrap">
                              {/* Edição Rápida do Preço Unitário no Item */}
                              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-slate-500">Un: R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.product.price}
                                  onChange={(e) =>
                                    handleUpdateManualItemPrice(
                                      item.product.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 bg-transparent text-cyan-300 font-bold font-mono text-xs text-right focus:outline-none"
                                  title="Editar valor unitário deste item no pedido"
                                />
                              </div>

                              {/* Controle Qtd +/- */}
                              <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateManualItemQty(item.product.id, item.quantity - 1)
                                  }
                                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center font-bold text-white font-mono text-xs">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateManualItemQty(item.product.id, item.quantity + 1)
                                  }
                                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="font-bold text-emerald-400 font-mono text-xs w-20 text-right">
                                R$ {itemSubtotal.toFixed(2).replace('.', ',')}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveManualItem(item.product.id)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded cursor-pointer"
                                title="Remover item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Valores, Pagamento & Status */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>4. Valores, Pagamento & Status</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Frete (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={manualShipping}
                      onChange={(e) => setManualShipping(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono min-h-[38px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Desconto (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={manualDiscount}
                      onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono min-h-[38px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Forma Pagamento</label>
                    <select
                      value={manualPaymentMethod}
                      onChange={(e) => setManualPaymentMethod(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white min-h-[38px]"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Boleto">Boleto</option>
                      <option value="WhatsApp / A Combinar">WhatsApp / A Combinar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Status Inicial</label>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value as OrderStatus)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white min-h-[38px]"
                    >
                      <option value="Pago">Pago (Baixa Direta)</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Em Separação">Em Separação</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Entregue">Entregue</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Atendente / Operador</label>
                    <input
                      type="text"
                      value={manualOperator}
                      onChange={(e) => setManualOperator(e.target.value)}
                      placeholder="Nome do atendente"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white min-h-[38px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Observações Internas</label>
                    <input
                      type="text"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Ex: Venda direta WhatsApp, retirada agendada"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white min-h-[38px]"
                    />
                  </div>
                </div>

                {/* Final Total Box */}
                <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-950 rounded-xl border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Subtotal: R$ {manualSubtotal.toFixed(2).replace('.', ',')}</span>
                    <span className="text-[11px] text-slate-400 block">Frete: +R$ {(Number(manualShipping) || 0).toFixed(2).replace('.', ',')} | Desconto: -R$ {(Number(manualDiscount) || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider block">Total Faturado</span>
                    <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                      R$ {manualTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {manualFormError && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{manualFormError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 shrink-0">
                <button
                  type="button"
                  disabled={isSubmittingManualOrder}
                  onClick={() => {
                    setIsManualModalOpen(false);
                    handleResetManualOrderForm();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManualOrder || manualCart.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
                >
                  {isSubmittingManualOrder ? (
                    <span>Registrando Pedido...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Pedido no ERP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Editar Pedido Existente (Mobile & Desktop Responsive) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-2xl my-6 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Editar Pedido {editingOrder.orderNumber}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(editStatus).bg}`}>
                      {editStatus}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Ajuste dados do cliente, endereço, itens, valores e status com sincronização automática
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onReturnToReports && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOrder(null);
                      onReturnToReports();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Retornar ao Relatório de Vendas"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Voltar ao Relatório</span>
                    <span className="sm:hidden">Relatório</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!isSubmittingEditOrder) {
                      setEditingOrder(null);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEditedOrder} className="space-y-4 overflow-y-auto pr-1 py-3 text-xs flex-1">
              {/* Section 1: Dados do Cliente */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>1. Dados do Cliente</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={editCustName}
                      onChange={(e) => setEditCustName(e.target.value)}
                      placeholder="Ex: Roberto Silva"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">WhatsApp / Telefone *</label>
                    <input
                      type="text"
                      required
                      value={editCustPhone}
                      onChange={(e) => setEditCustPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">E-mail</label>
                    <input
                      type="email"
                      value={editCustEmail}
                      onChange={(e) => setEditCustEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">CPF (Opcional)</label>
                    <input
                      type="text"
                      value={editCustCpf}
                      onChange={(e) => setEditCustCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Entrega & Endereço */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span>2. Modalidade de Entrega & Rastreio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditIsPickup(true)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        editIsPickup ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Balcão / Retirada
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsPickup(false)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        !editIsPickup ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Entrega / Envio
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-cyan-400" />
                      Código de Rastreio (Correios / Jadlog / Loggi)
                    </label>
                    <input
                      type="text"
                      value={editTrackingCode}
                      onChange={(e) => setEditTrackingCode(e.target.value.toUpperCase())}
                      placeholder="Ex: NL123456789BR"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                </div>

                {!editIsPickup && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-800/60">
                    <div className="sm:col-span-1">
                      <label className="block text-slate-400 font-medium mb-1">CEP</label>
                      <input
                        type="text"
                        value={editZipCode}
                        onChange={(e) => setEditZipCode(e.target.value)}
                        placeholder="01000-000"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-medium mb-1">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={editStreet}
                        onChange={(e) => setEditStreet(e.target.value)}
                        placeholder="Av. Paulista"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Número</label>
                      <input
                        type="text"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        placeholder="1000"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Complemento</label>
                      <input
                        type="text"
                        value={editComplement}
                        onChange={(e) => setEditComplement(e.target.value)}
                        placeholder="Apto 42"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Bairro</label>
                      <input
                        type="text"
                        value={editNeighborhood}
                        onChange={(e) => setEditNeighborhood(e.target.value)}
                        placeholder="Centro"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-medium mb-1">Cidade</label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        placeholder="SP"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Produtos do Pedido com Pesquisa e Edição de Preço */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>3. Produtos / Peptídeos do Pedido</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {editCart.length} item(ns) no pedido
                  </span>
                </div>

                {/* Search / Add more products to existing order */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                  <div className="relative">
                    <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-cyan-400" />
                        Adicionar Novo Peptídeo ao Pedido:
                      </span>
                      {currentEditSelectedProduct && (
                        <span className="text-cyan-400 font-mono text-[11px]">
                          Estoque: {currentEditSelectedProduct.stock} un.
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editProdSearch}
                        onFocus={() => setIsEditProdSearchOpen(true)}
                        onChange={(e) => {
                          setEditProdSearch(e.target.value);
                          setIsEditProdSearchOpen(true);
                        }}
                        placeholder="Digite o nome do peptídeo a adicionar..."
                        className="w-full px-3.5 py-2 pl-9 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      {editProdSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditProdSearch('');
                            setIsEditProdSearchOpen(false);
                          }}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown List */}
                    {isEditProdSearchOpen && filteredEditProducts.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800/80">
                        {filteredEditProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectEditProduct(p)}
                            className="p-2.5 hover:bg-cyan-950/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                                <PeptideVial capColor={p.capColor || '#06b6d4'} labelColor={p.labelColor || '#0891b2'} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white text-xs truncate">
                                  {p.name} <span className="text-cyan-400 font-normal">{p.dosage}</span>
                                </p>
                                <span className="text-[10px] text-slate-400">{p.category} | Estoque: {p.stock} un.</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-emerald-400 shrink-0">
                              R$ {(p.price || 0).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Qty controls */}
                  {currentEditSelectedProduct && (
                    <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      <div className="sm:col-span-5">
                        <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                          <span>Preço Unitário (R$):</span>
                          {editSelectedProdPrice !== '' && Number(editSelectedProdPrice) !== currentEditSelectedProduct.price && (
                            <span className="text-amber-400 font-mono text-[10px] flex items-center gap-0.5">
                              <Tag className="w-3 h-3" /> Preço customizado
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-xs">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editSelectedProdPrice}
                            onChange={(e) => setEditSelectedProdPrice(e.target.value)}
                            placeholder="0,00"
                            className="w-full px-3 py-2 pl-9 bg-slate-950 border border-cyan-500/50 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-400 min-h-[40px]"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-slate-400 font-medium mb-1">Quantidade:</label>
                        <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl p-1 min-h-[40px]">
                          <button
                            type="button"
                            onClick={() => setEditSelectedQty(Math.max(1, editSelectedQty - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={editSelectedQty}
                            onChange={(e) => setEditSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full text-center bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setEditSelectedQty(editSelectedQty + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <button
                          type="button"
                          onClick={handleAddProductToEditOrder}
                          className="w-full px-3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20 min-h-[40px]"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Adicionar ao Pedido</span>
                        </button>
                      </div>

                      {/* Checkbox to also update the product in catalog */}
                      {editSelectedProdPrice !== '' && Number(editSelectedProdPrice) !== currentEditSelectedProduct.price && (
                        <div className="sm:col-span-12 pt-1 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="chkUpdateEditCatalogPrice"
                            checked={editUpdateCatalogPriceToo}
                            onChange={(e) => setEditUpdateCatalogPriceToo(e.target.checked)}
                            className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="chkUpdateEditCatalogPrice" className="text-[11px] text-amber-300 cursor-pointer">
                            Atualizar permanentemente o preço de <strong>{currentEditSelectedProduct.name}</strong> para R$ {Number(editSelectedProdPrice).toFixed(2).replace('.', ',')} no catálogo
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Current Items in Edit Order */}
                {editCart.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {editCart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                            <PeptideVial capColor={item.product.capColor || '#06b6d4'} labelColor={item.product.labelColor || '#0891b2'} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs truncate">
                              {item.product.name}
                            </p>
                            <span className="text-[10px] text-slate-400">{item.product.dosage || ''}</span>
                          </div>
                        </div>

                        {/* Inline price edit, quantity and item subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.product.price}
                              onChange={(e) => handleUpdateEditItemPrice(item.product.id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs text-right focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateEditItemQty(item.product.id, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-1.5 font-mono font-bold text-xs text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateEditItemQty(item.product.id, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-bold font-mono text-emerald-400 text-xs min-w-[70px] text-right">
                            R$ {((item.product.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(item.product.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer"
                            title="Remover produto do pedido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-red-400 py-3 text-xs italic">
                    Nenhum produto no pedido. Adicione pelo menos 1 item.
                  </p>
                )}
              </div>

              {/* Section 4: Valores, Pagamento, Status & Auditoria */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800/80 pb-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  <span>4. Valores, Pagamento, Status & Auditoria</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Frete (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editShipping}
                      onChange={(e) => setEditShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Desconto (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Forma de Pagamento</label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 min-h-[40px] cursor-pointer"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Boleto">Boleto Bancário</option>
                      <option value="WhatsApp / A Combinar">WhatsApp / A Combinar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Status do Pedido</label>
                    <select
                      value={editStatus}
                      onChange={(e) => {
                        const newSt = e.target.value as OrderStatus;
                        setEditStatus(newSt);
                        if (newSt === 'Pago') {
                          setEditPaidAmount(editTotal);
                        } else if (newSt === 'Pendente') {
                          setEditPaidAmount(0);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 min-h-[40px] cursor-pointer"
                    >
                      <option value="Pendente">Pendente (Aguardando Pagamento)</option>
                      <option value="Pago Parcial">Pago Parcial (Baixa Parcial / Resta Saldo)</option>
                      <option value="Pago">Pago (Comprovante OK / Baixa 100%)</option>
                      <option value="Em Separação">Em Separação (Embalagem Térmica)</option>
                      <option value="Enviado">Enviado (Despachado)</option>
                      <option value="Entregue">Entregue (Concluído)</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* Baixa Parcial e Controle de Pagamento */}
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Baixa Parcial / Valor Pago pelo Cliente</span>
                    </label>
                    <span className="text-[11px] text-cyan-400 font-mono font-bold">
                      Total Pedido: R$ {editTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-6 relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPaidAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditPaidAmount(val);
                          const num = parseFloat(val) || 0;
                          if (num >= editTotal && editTotal > 0) {
                            setEditStatus('Pago');
                          } else if (num > 0) {
                            setEditStatus('Pago Parcial');
                          } else {
                            setEditStatus('Pendente');
                          }
                        }}
                        placeholder="0,00"
                        className="w-full px-3 py-2 pl-9 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-white font-mono font-bold text-sm focus:outline-none min-h-[40px]"
                      />
                    </div>

                    <div className="sm:col-span-6 flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setEditPaidAmount(editTotal);
                          setEditStatus('Pago');
                        }}
                        className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        100% (Quitado)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const half = Number((editTotal / 2).toFixed(2));
                          setEditPaidAmount(half);
                          setEditStatus('Pago Parcial');
                        }}
                        className="px-2.5 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        50% (Entrada)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditPaidAmount(0);
                          setEditStatus('Pendente');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Zerar (Pendente)
                      </button>
                    </div>
                  </div>

                  {/* Calculated Balance Indicator */}
                  {(() => {
                    const paid = editPaidAmount !== '' && !isNaN(Number(editPaidAmount)) ? Number(editPaidAmount) : 0;
                    const remaining = Math.max(0, Number((editTotal - paid).toFixed(2)));
                    const isPartial = paid > 0 && paid < editTotal;
                    const isFullyPaid = paid >= editTotal && editTotal > 0;

                    return (
                      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Status financeiro:</span>
                          {isFullyPaid && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                              ✓ 100% Quitado
                            </span>
                          )}
                          {isPartial && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] font-bold">
                              ⚠️ Baixa Parcial (Resta Saldo)
                            </span>
                          )}
                          {paid === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                              Pendente Integral
                            </span>
                          )}
                        </div>

                        <div className="font-mono text-right text-[11px]">
                          <span className="text-slate-400">Saldo Pendente: </span>
                          <strong className={remaining > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                            R$ {remaining.toFixed(2).replace('.', ',')}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Operador / Atendente Responsável</label>
                    <input
                      type="text"
                      value={editOperator}
                      onChange={(e) => setEditOperator(e.target.value)}
                      placeholder="Nome do operador"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Observações Internas</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Ex: Pagamento confirmado via comprovante WhatsApp..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 min-h-[40px]"
                    />
                  </div>
                </div>

                {/* Live Total Card */}
                <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-emerald-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-400">Total Atualizado:</span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Subtotal: R$ {editSubtotal.toFixed(2).replace('.', ',')} | Frete: +R$ {(Number(editShipping) || 0).toFixed(2).replace('.', ',')} | Desc: -R$ {(Number(editDiscount) || 0).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-cyan-400">
                      R$ {editTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {editFormError && (
                <div className="p-3 bg-red-950/70 border border-red-500 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 shrink-0">
                <button
                  type="button"
                  disabled={isSubmittingEditOrder}
                  onClick={() => {
                    setEditingOrder(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditOrder || editCart.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
                >
                  {isSubmittingEditOrder ? (
                    <span>Salvando Alterações...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Relatório do Pedido via WhatsApp */}
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
                  Envio de Resumo / Relatório
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
