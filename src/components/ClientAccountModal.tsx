import React, { useState } from 'react';
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, User, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PeptideVial } from './PeptideVial';
import { OrderStatus } from '../types';

export const ClientAccountModal: React.FC = () => {
  const { currentUser, orders, updateUserProfile, setCurrentView } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'address'>('orders');

  // Filter orders to only display those belonging to the authenticated client (IDOR/BOLA protection)
  const clientOrders = orders.filter(
    (o) =>
      (currentUser?.email && o.customer?.email?.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
      (currentUser?.id && (o as any).userId === currentUser.id)
  );

  // Form states for profile
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');

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
    updateUserProfile({ name, phone, email });
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      addresses: [{ street, number, neighborhood, city, state, zipCode }],
    });
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Cadastrado desde: <strong>Setembro/2026</strong></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-8 space-x-6 text-sm font-semibold">
          {[
            { id: 'orders', label: 'Meus Pedidos', icon: Package },
            { id: 'profile', label: 'Dados Pessoais', icon: User },
            { id: 'address', label: 'Endereço de Entrega', icon: MapPin },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3.5 transition-colors relative cursor-pointer ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

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
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Data do pedido: {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-500 block">Total do Pedido</span>
                      <span className="text-lg font-black text-slate-900">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Order Tracking Timeline */}
                  <div className="py-2">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-cyan-600" />
                      Linha do Tempo de Entrega
                    </p>
                    <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs">
                      {[
                        { label: 'Pendente', done: true },
                        { label: 'Pago', done: ['Pago', 'Em Separação', 'Enviado', 'Entregue'].includes(order.status) },
                        { label: 'Separação', done: ['Em Separação', 'Enviado', 'Entregue'].includes(order.status) },
                        { label: 'Enviado', done: ['Enviado', 'Entregue'].includes(order.status) },
                        { label: 'Entregue', done: order.status === 'Entregue' },
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center mb-1 text-[11px] font-bold ${
                              step.done
                                ? 'bg-cyan-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`font-semibold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking Code if Available */}
                  {order.trackingCode && (
                    <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-cyan-700" />
                        <span>Código de Rastreio Sedex: <strong className="font-mono text-cyan-900">{order.trackingCode}</strong></span>
                      </div>
                      <span className="text-cyan-700 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        Ver Rastreio <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  )}

                  {/* Items in Order */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-800">Itens do Pedido ({order.items.length}):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="w-8 h-10 bg-white rounded flex items-center justify-center shrink-0">
                            <PeptideVial capColor={item.product.capColor} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{item.product.name} ({item.product.dosage})</p>
                            <p className="text-slate-500">{item.quantity}x • R$ {item.product.price.toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Entrega: {order.address.street}, {order.address.number} - {order.address.neighborhood}, {order.address.city}/{order.address.state}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Você ainda não realizou pedidos</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Explore nosso catálogo para adquirir os peptídeos importados.</p>
                <button
                  onClick={() => setCurrentView('store')}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Ir às Compras
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile Edit */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Editar Informações Cadastrais</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Address Edit */}
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
                className="px-6 py-2.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
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
