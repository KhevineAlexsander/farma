import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, QrCode, CreditCard, ShieldCheck, Truck, MessageSquare, ExternalLink, Store, Tag, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PeptideVial } from './PeptideVial';
import { Order } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartTotal,
    currentUser,
    createOrder,
    currentView,
    setCurrentView,
    storeSettings,
    deliveryFee,
    appliedCoupon,
    couponDiscount,
    applyCouponCode,
    removeCoupon,
  } = useApp();

  useEffect(() => {
    if (currentView === 'checkout') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView]);

  // Customer state - left empty for user to fill in their own information
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');

  // Address state - left empty for user to fill in their own address
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');

  // Shipping & Payment
  const [shippingMethod, setShippingMethod] = useState<'entrega' | 'retirada'>('entrega');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Cartão de Crédito' | 'Boleto' | 'WhatsApp / A Combinar'>('PIX');

  // Coupon state in checkout
  const [checkoutCouponInput, setCheckoutCouponInput] = useState('');
  const [checkoutCouponMsg, setCheckoutCouponMsg] = useState<{ success?: string; error?: string }>({});

  // Success State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string>('');

  // Shipping & Financial calculations
  const subtotal = Number(cartTotal.toFixed(2));
  const currentCouponDiscount = storeSettings.couponsEnabled !== false && appliedCoupon
    ? appliedCoupon.type === 'PERCENTAGE'
      ? Number(((subtotal * appliedCoupon.value) / 100).toFixed(2))
      : Number(Math.min(subtotal, appliedCoupon.value).toFixed(2))
    : 0;

  const subtotalAfterCoupon = Math.max(0, subtotal - currentCouponDiscount);
  const importTax = 100.00;
  const pixDiscount = 0;
  const totalDiscount = Number(currentCouponDiscount.toFixed(2));
  const grandTotal = Number(Math.max(0, subtotal + importTax - totalDiscount).toFixed(2));

  const handleApplyCheckoutCoupon = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!checkoutCouponInput.trim()) return;
    const res = applyCouponCode(checkoutCouponInput);
    if (res.success) {
      setCheckoutCouponMsg({ success: res.message });
      setCheckoutCouponInput('');
    } else {
      setCheckoutCouponMsg({ error: res.message });
    }
  };

  const buildWhatsappMessage = (order: Order) => {
    const itemsList = order.items
      .map(
        (item) =>
          `• ${item.quantity}x ${item.product.name} (${item.product.dosage}) - R$ ${(item.product.price * item.quantity).toFixed(2).replace('.', ',')}`
      )
      .join('\n');

    const addressBlock = `📍 *ENDEREÇO DE ENTREGA:*
${order.address.street}, ${order.address.number}${order.address.complement ? ` (${order.address.complement})` : ''}
Bairro: ${order.address.neighborhood}
Cidade/UF: ${order.address.city}/${order.address.state}
CEP: ${order.address.zipCode}`;

    const couponLine = appliedCoupon && currentCouponDiscount > 0
      ? `🏷️ *Cupom (${appliedCoupon.code}):* -R$ ${currentCouponDiscount.toFixed(2).replace('.', ',')}\n`
      : '';

    const siteUrl = storeSettings.siteUrl || window.location.origin;

    const message = `🧬 *NOVO PEDIDO - ${storeSettings.storeName || 'PEPTIDE IMPORTS FARMA'}*
────────────────────────
Olá! Acabei de finalizar meu pedido no site.

📌 *NÚMERO DO PEDIDO:* ${order.orderNumber}
🌐 *Loja:* ${siteUrl}

👤 *DADOS DO CLIENTE:*
• Nome: ${order.customer.name}
• WhatsApp: ${order.customer.phone}
• E-mail: ${order.customer.email}

${addressBlock}

📦 *ITENS DO PEDIDO:*
${itemsList}

────────────────────────
📊 *RESUMO FINANCEIRO:*
• Subtotal dos Produtos: R$ ${order.subtotal.toFixed(2).replace('.', ',')}
• Taxa de Envio/Entrega: R$ ${order.shipping.toFixed(2).replace('.', ',')}
${couponLine}💳 *Forma de Pagamento:* A Combinar no WhatsApp
💰 *TOTAL A PAGAR: R$ ${order.total.toFixed(2).replace('.', ',')}*
────────────────────────
Por favor, confirme os dados do pedido ${order.orderNumber} para liberação e envio!`;

    const cleanNumber = (storeSettings.whatsappNumber || '5511993456789').replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !street || !number || !city) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const order = createOrder({
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        cpf: customerCpf,
      },
      address: {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
      },
      paymentMethod: 'WhatsApp / A Combinar',
      shipping: 100.00,
      discount: totalDiscount,
      couponCode: appliedCoupon?.code,
      notes,
    });

    const link = buildWhatsappMessage(order);
    setWhatsappLink(link);
    setCompletedOrder(order);

    // Open WhatsApp in new tab automatically
    try {
      window.open(link, '_blank');
    } catch {
      // Handled by explicit button in the success view
    }
  };

  // Only render if the current view is specifically 'checkout'
  if (currentView !== 'checkout') {
    return null;
  }

  // Handle empty cart state
  if (cart.length === 0 && !completedOrder) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-[#0B0F17]">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-tech">Seu Carrinho está Vazio</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Você ainda não adicionou nenhum item para finalizar o pedido. Explore nossos compostos e adicione os itens desejados.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('store')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            Explorar Catálogo de Peptídeos
          </button>
        </div>
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center">
          
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
            PEDIDO GERADO COM SUCESSO!
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Localizador do Pedido: <strong className="text-cyan-700 text-lg font-mono">{completedOrder.orderNumber}</strong>
          </p>

          {/* WhatsApp Direct Action Highlight */}
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-left shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/20 rounded-2xl shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-base">Finalização & Atendimento via WhatsApp</h3>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  O resumo do seu pedido com o número <strong>{completedOrder.orderNumber}</strong> foi gerado. Clique no botão abaixo para abrir a conversa no WhatsApp oficial da loja. Nossa equipe fará a conferência e dará baixa no sistema para despacho imediato!
                </p>
                <div className="mt-4">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
                  >
                    <span>ABRIR WHATSAPP E ENVIAR PEDIDO</span>
                    <ExternalLink className="w-4 h-4 text-emerald-700" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
              <span className="text-slate-500">Status atual no painel:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {completedOrder.status} (Aguardando Baixa Manual)
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Forma de Pagamento:</span>
              <span className="font-semibold text-slate-800">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Destinatário:</span>
              <span className="font-semibold text-slate-800">{completedOrder.customer.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Endereço de Envio:</span>
              <span className="font-medium text-slate-700 truncate max-w-[280px]">
                {completedOrder.address.street}, {completedOrder.address.number} - {completedOrder.address.city}/{completedOrder.address.state}
              </span>
            </div>
            <div className="flex justify-between items-center text-base font-bold border-t border-slate-200 pt-2 text-slate-900">
              <span>Valor Total:</span>
              <span className="text-cyan-700">R$ {completedOrder.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setCurrentView('my-account')}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition-colors"
            >
              Acompanhar em Minha Conta
            </button>
            <button
              onClick={() => setCurrentView('store')}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
            >
              Voltar para a Loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Back Link */}
        <button
          onClick={() => setCurrentView('store')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao catálogo</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech mb-8">
          CHECKOUT & <span className="text-cyan-600">CONFIRMAÇÃO VIA WHATSAPP</span>
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Customer, Address & Payment */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* WhatsApp notice banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs">
              <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {storeSettings.checkoutNotice ||
                  'Ao confirmar, você será direcionado ao nosso WhatsApp oficial para validação do pedido e envio imediato!'}
              </span>
            </div>

            {/* 1. Customer Data */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                Dados Pessoais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ex: Seu Nome Completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">E-mail para Notificações *</label>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    placeholder="seuemail@exemplo.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">WhatsApp com DDD *</label>
                  <input
                    type="tel"
                    required
                    maxLength={25}
                    placeholder="(11) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">CPF (Opcional p/ Nota Fiscal)</label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="000.000.000-00"
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>
            </div>

            {/* 2. Address */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Endereço de Entrega (Transporte Climatizado)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">CEP *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="00000-000"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Logradouro / Rua *</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="Ex: Av. Paulista ou Rua das Flores"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Número *</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="123"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="Ex: Bela Vista"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cidade / UF *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-2/3 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600"
                    />
                    <input
                      type="text"
                      required
                      value={state}
                      maxLength={2}
                      placeholder="UF"
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className="w-1/3 px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-center font-bold focus:outline-none focus:border-cyan-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Instruções ou Observações para a Entrega</label>
                <input
                  type="text"
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Deixar na portaria, entregar em horário comercial, etc."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>

          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-24 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 font-tech border-b border-slate-100 pb-3">
                RESUMO DO PEDIDO
              </h3>

              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 text-xs">
                    <div className="w-10 h-12 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                      <PeptideVial
                        capColor={item.product.capColor}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-slate-500">{item.product.dosage} • {item.quantity} un.</p>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Form in Checkout */}
              {storeSettings.couponsEnabled !== false && (
                <div className="pt-2">
                  {!appliedCoupon ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={checkoutCouponInput}
                            onChange={(e) => setCheckoutCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCheckoutCoupon();
                              }
                            }}
                            placeholder="CUPOM DE DESCONTO"
                            className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 uppercase focus:outline-none focus:border-cyan-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCheckoutCoupon()}
                          className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                      {checkoutCouponMsg.error && (
                        <p className="text-[11px] text-red-500 font-medium">{checkoutCouponMsg.error}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-emerald-800 tracking-wider">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[11px] text-emerald-600 block">
                            {appliedCoupon.type === 'PERCENTAGE'
                              ? `${appliedCoupon.value}% de desconto`
                              : `R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')} OFF`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeCoupon();
                          setCheckoutCouponMsg({});
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal dos produtos</span>
                  <span className="font-semibold text-slate-900">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {storeSettings.couponsEnabled !== false && appliedCoupon && currentCouponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Cupom ({appliedCoupon.code})</span>
                    <span>- R$ {currentCouponDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Taxa de Importação</span>
                  <span className="font-semibold text-slate-900">R$ 100,00</span>
                </div>

                <div className="flex justify-between text-lg font-extrabold text-slate-950 border-t border-slate-200 pt-3">
                  <span>Total a Pagar</span>
                  <span className="text-cyan-700 font-tech">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* WhatsApp Checkout Submit CTA */}
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>FINALIZAR E ENVIAR NO WHATSAPP</span>
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                Ao clicar, o pedido será registrado com número de identificação e encaminhado para o WhatsApp oficial <strong>{storeSettings.whatsappDisplay}</strong>.
              </p>

              <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Compra protegida com certificado SSL 256-bit</span>
              </div>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

