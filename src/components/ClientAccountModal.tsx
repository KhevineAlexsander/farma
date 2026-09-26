import React, { useState } from 'react';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  User,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Syringe,
  Activity,
  BookmarkCheck,
  Trash2,
  ArrowRight,
  Gift,
  TrendingUp,
  DollarSign,
  BarChart3,
  Sparkles,
  Tag,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PeptideVial } from './PeptideVial';
import { OrderStatus, SavedDoseProtocol } from '../types';

export const ClientAccountModal: React.FC = () => {
  const {
    currentUser,
    orders,
    updateUserProfile,
    deleteDoseProtocol,
    deleteInjectionRecord,
    getClientActiveBenefit,
    storeSettings,
    deliveryFee,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'benefits' | 'reports' | 'protocols' | 'diet' | 'profile' | 'address'>('orders');

  // Filter orders to only display those belonging to the authenticated client (IDOR/BOLA protection)
  const clientOrders = orders.filter(
    (o) =>
      (currentUser?.email &&
        o.customer?.email &&
        o.customer.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
      (currentUser?.id && (o as any).userId === currentUser.id)
  );

  const activeBenefit = getClientActiveBenefit(currentUser);

  // Client personal metrics
  const totalSpent = clientOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalDiscountEarned = clientOrders.reduce((acc, o) => acc + (o.discount || 0), 0);
  const averageTicket = clientOrders.length > 0 ? totalSpent / clientOrders.length : 0;
  const totalItemsPurchased = clientOrders.reduce(
    (acc, o) => acc + (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
    0
  );

  // Form states for profile
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [cpf, setCpf] = useState(currentUser?.cpf || '');

  // Address
  const defaultAddr = currentUser?.addresses?.[0] || {
    street: 'Av. Paulista',
    number: '1842',
    complement: 'Apto 114B',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-200',
  };
  const [street, setStreet] = useState(defaultAddr.street);
  const [number, setNumber] = useState(defaultAddr.number);
  const [neighborhood, setNeighborhood] = useState(defaultAddr.neighborhood);
  const [city, setCity] = useState(defaultAddr.city);
  const [state, setState] = useState(defaultAddr.state);
  const [zipCode, setZipCode] = useState(defaultAddr.zipCode);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, phone, email, cpf });
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      addresses: [{ street, number, neighborhood, city, state, zipCode }],
    });
  };

  const handleLoadProtocolInCalculator = (proto: SavedDoseProtocol) => {
    setCurrentView('dosage-calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Entregue':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Em Separação':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Pago':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Link */}
        <button
          onClick={() => setCurrentView('store')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para a Loja</span>
        </button>

        {/* User Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold font-tech shadow-md">
              {currentUser?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-tech">
                  {currentUser?.name || 'Cliente'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                  {currentUser?.role || 'CLIENTE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-cyan-400 font-bold text-xs flex items-center gap-1.5 shadow-sm border border-slate-700 transition-colors cursor-pointer"
                title="Acessar Painel ERP"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Painel ERP</span>
              </button>
            )}
            <span className="text-xs text-slate-500 font-medium">Perfil Seguro na Nuvem (Firebase)</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-8 space-x-6 text-sm font-semibold overflow-x-auto pb-1">
          {[
            { id: 'orders', label: 'Meus Pedidos', icon: Package, badge: clientOrders.length },
            { id: 'benefits', label: 'Benefícios & Cupons', icon: Gift, badge: activeBenefit.isActive ? 'Ativo' : undefined },
            { id: 'reports', label: 'Meus Relatórios', icon: BarChart3 },
            { id: 'protocols', label: 'Protocolos de Doses', icon: Syringe, badge: currentUser?.savedDoseProtocols?.length || 0 },
            { id: 'diet', label: 'Metas & Dieta', icon: Activity },
            { id: 'profile', label: 'Dados Pessoais', icon: User },
            { id: 'address', label: 'Endereço de Entrega', icon: MapPin },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3.5 transition-colors relative cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    tab.id === 'benefits' && activeBenefit.isActive
                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                      : 'bg-cyan-100 text-cyan-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Benefits & 7-Day Automatic Coupon */}
        {activeTab === 'benefits' && (
          <div className="space-y-6">
            {/* 7-Day Automatic Repurchase Benefit Main Card */}
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
              activeBenefit.isActive
                ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white border-emerald-500/50 shadow-emerald-900/20'
                : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-md ${
                      activeBenefit.isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 animate-bounce'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      🎁
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg sm:text-xl font-extrabold font-tech ${
                          activeBenefit.isActive ? 'text-white' : 'text-slate-900'
                        }`}>
                          Cupom Automático de Frete Grátis (7 Dias)
                        </h3>
                        {activeBenefit.isActive ? (
                          <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-400 text-slate-950 shadow-xs uppercase tracking-wider">
                            ATIVO NO SEU PERFIL
                          </span>
                        ) : activeBenefit.isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                            EXPIRADO
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            DISPONÍVEL NA 1ª COMPRA
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${activeBenefit.isActive ? 'text-emerald-200' : 'text-slate-500'}`}>
                        Benefício de recompra automática vinculado ao seu cadastro
                      </p>
                    </div>
                  </div>

                  <p className={`text-xs sm:text-sm leading-relaxed max-w-2xl ${
                    activeBenefit.isActive ? 'text-emerald-100/90' : 'text-slate-600'
                  }`}>
                    Regra oficial: <strong>Ao comprar pela primeira vez com taxa de entrega</strong>, você ganha <strong>7 dias corridos de Frete Grátis</strong> para todas as suas recompras adicionais. Se comprar novamente após os 7 dias, a taxa de entrega volta a ser cobrada normalmente.
                  </p>

                  {/* Status Box */}
                  {activeBenefit.isActive ? (
                    <div className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Tempo Restante de Frete Grátis:</p>
                        <p className="text-xl sm:text-2xl font-black text-white font-tech">
                          {activeBenefit.daysRemaining} {activeBenefit.daysRemaining === 1 ? 'Dia Restante' : 'Dias Restantes'}
                        </p>
                        <p className="text-xs text-emerald-200/80">
                          Válido até: <strong>{activeBenefit.expiresAtFormatted}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => setCurrentView('store')}
                        className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-emerald-400/20 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Comprar c/ Frete Grátis</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : activeBenefit.isExpired ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <p className="text-xs text-slate-700">
                        ⏱️ Seu último período de 7 dias com frete grátis expirou em <strong>{activeBenefit.expiresAtFormatted}</strong>.
                      </p>
                      <p className="text-xs text-slate-500">
                        Ao realizar uma nova compra com taxa de entrega normal, um novo ciclo de 7 dias de Frete Grátis será ativado para você!
                      </p>
                      <button
                        onClick={() => setCurrentView('store')}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>Ir para a Loja</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-2 text-cyan-950">
                      <p className="text-xs font-bold">
                        Como ativar seu benefício de 7 dias:
                      </p>
                      <p className="text-xs text-cyan-800 leading-relaxed">
                        Faça seu primeiro pedido na loja pagando a taxa de entrega. Imediatamente após a finalização, o sistema libera o <strong>Cupom Automático de Frete Grátis</strong> válido por 7 dias para suas próximas compras!
                      </p>
                      <button
                        onClick={() => setCurrentView('store')}
                        className="mt-1 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>Explorar Catálogo</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* How It Works Informational Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-900">Primeira Compra com Taxa</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Realize seu pedido inicial pagando a taxa de frete padrão com entrega segura em embalagem térmica.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-900">Janela de 7 Dias Grátis</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Durante 7 dias após o primeiro pedido, todas as suas compras no site têm taxa de entrega zerada automaticamente.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-900">Após os 7 Dias</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Se comprar após o término dos 7 dias, a taxa normal é cobrada e você ganha um novo ciclo de benefícios.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Personal Reports & Client Analytics */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-tech">
                    MEU RELATÓRIO DE COMPRAS & ECONOMIA
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Resumo analítico individual das suas aquisições e protocolos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                    {clientOrders.length} {clientOrders.length === 1 ? 'Pedido' : 'Pedidos Realizados'}
                  </span>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Investido</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 font-tech">
                    R$ {totalSpent.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[10px] text-slate-400">Em compostos e pureza HPLC</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Economia c/ Cupons</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-800 font-tech">
                    R$ {totalDiscountEarned.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[10px] text-emerald-600">Descontos obtidos</p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-1">
                  <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">Ticket Médio</p>
                  <p className="text-lg sm:text-xl font-black text-cyan-800 font-tech">
                    R$ {averageTicket.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[10px] text-cyan-600">Média por pedido</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                  <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Frascos Adquiridos</p>
                  <p className="text-lg sm:text-xl font-black text-purple-800 font-tech">
                    {totalItemsPurchased} un.
                  </p>
                  <p className="text-[10px] text-purple-600">Total de unidades</p>
                </div>
              </div>

              {/* Engagement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-cyan-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Protocolos Salvos na Calculadora</h4>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 font-tech">
                    {currentUser?.savedDoseProtocols?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    Protocolos clínicos personalizados salvos no seu perfil para cálculo automático de reconstituição.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Aplicações Registradas</h4>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 font-tech">
                    {currentUser?.injectionLogs?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    Histórico de dosagens e horários de injeção acompanhados com segurança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Orders History */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {clientOrders.length > 0 ? (
              clientOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-extrabold text-slate-900 font-tech">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500">Valor Total:</p>
                      <p className="text-lg font-black text-slate-900 font-tech">
                        R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Produtos no Pedido:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                            <PeptideVial
                              capColor={item.product?.capColor}
                              name={item.product?.name || ''}
                              dosage={item.product?.dosage || ''}
                              size="sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.product?.name}</p>
                            <p className="text-[11px] text-slate-500">{item.quantity}x • {item.product?.dosage} • R$ {((item.product?.price || 0) * item.quantity).toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer / Tracking */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Truck className="w-4 h-4 text-cyan-600" />
                      <span>
                        Entrega para: <strong>{order.address?.street}, {order.address?.number} - {order.address?.city}/{order.address?.state}</strong>
                      </span>
                    </div>
                    {order.trackingCode && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-800 font-mono font-bold">
                        <span>Rastreio: {order.trackingCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Você ainda não possui pedidos</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Explore o catálogo de peptídeos importados de pureza certificada e faça seu primeiro pedido com total segurança.
                </p>
                <button
                  onClick={() => setCurrentView('store')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Ver Produtos na Loja
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Dose Protocols */}
        {activeTab === 'protocols' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Seus Protocolos Farmacêuticos Salvos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protocolos calculados na calculadora de doses salvos diretamente na nuvem no seu perfil.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('dosage-calculator')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>Nova Calculadora</span>
              </button>
            </div>

            {currentUser?.savedDoseProtocols && currentUser.savedDoseProtocols.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentUser.savedDoseProtocols.map((proto) => (
                  <div
                    key={proto.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 hover:border-cyan-400 hover:shadow-md transition-all relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800">
                          {proto.dosageLabel}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1">
                          {proto.productName}
                        </h4>
                      </div>
                      <button
                        onClick={() => deleteDoseProtocol(proto.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir protocolo salvo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Frasco</span>
                        <strong className="text-slate-800">{proto.vialMg} mg</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Diluente</span>
                        <strong className="text-slate-800">{proto.waterMl} ml</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Aspirar</span>
                        <strong className="text-cyan-700">{proto.syringeUnits} UI</strong>
                      </div>
                    </div>

                    {proto.notes && (
                      <p className="text-xs text-slate-500 italic bg-cyan-50/50 p-2 rounded-lg border border-cyan-100">
                        {proto.notes}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        Frequência: <strong>{proto.frequency}</strong>
                      </span>
                      <button
                        onClick={() => handleLoadProtocolInCalculator(proto)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                      >
                        <span>Abrir na Calculadora</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Nenhum protocolo de dose salvo ainda</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Utilize nossa calculadora farmacêutica para calcular e salvar seus protocolos de reconstituição no seu perfil.
                </p>
                <button
                  onClick={() => setCurrentView('dosage-calculator')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Acessar Calculadora de Doses
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Diet & Biometrics Summary */}
        {activeTab === 'diet' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Suas Metas & Registro de Aplicações</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Resumo do seu perfil metabólico e histórico de injeções salvas na nuvem.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('diet-control')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Abrir Diário de Dieta</span>
              </button>
            </div>

            {/* Biometric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Peso Atual</span>
                <span className="text-xl font-black text-slate-900 font-tech">
                  {currentUser?.dietProfile?.weightKg || 82} kg
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Altura</span>
                <span className="text-xl font-black text-slate-900 font-tech">
                  {currentUser?.dietProfile?.heightCm || 178} cm
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Idade</span>
                <span className="text-xl font-black text-slate-900 font-tech">
                  {currentUser?.dietProfile?.age || 32} anos
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Protocolo Ativo</span>
                <span className="text-sm font-black text-emerald-700 font-tech uppercase">
                  {currentUser?.dietProfile?.peptideProtocol === 'glp1'
                    ? 'GLP-1 / GIP'
                    : currentUser?.dietProfile?.peptideProtocol === 'gh'
                    ? 'Secretagogos GH'
                    : currentUser?.dietProfile?.peptideProtocol === 'cutting'
                    ? 'Cutting Extremo'
                    : 'Longevidade'}
                </span>
              </div>
            </div>

            {/* Injections history */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Histórico de Aplicações de Peptídeos</h4>
              {currentUser?.injectionLogs && currentUser.injectionLogs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {currentUser.injectionLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900">{log.peptideName}</strong>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {log.dosage}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {log.date} às {log.time} • Local: {log.site} {log.notes && `• "${log.notes}"`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteInjectionRecord(log.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Remover aplicação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Nenhuma aplicação registrada ainda. Abra o Diário de Dieta para registrar suas doses.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Profile Edit */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Informações da Conta</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">CPF (opcional)</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        )}

        {/* Tab 5: Address Edit */}
        {activeTab === 'address' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Endereço Principal de Entrega</h3>
            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">CEP</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Número</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Bairro</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">UF</label>
                  <input
                    type="text"
                    value={state}
                    maxLength={2}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-center font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Atualizar Endereço
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
