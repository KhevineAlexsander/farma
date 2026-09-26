import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  ShieldAlert,
  Users,
  Bell,
  ExternalLink,
  Settings,
  Tag,
  LogOut,
  Crown,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Database,
  BarChart3,
  FilePlus2,
  Lock,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  X,
  Store,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DnaLogo } from '../DnaLogo';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';
import { FinancialManagement } from './FinancialManagement';
import { EmployeeManagement } from './EmployeeManagement';
import { StoreSettingsTab } from './StoreSettingsTab';
import { CouponManagement } from './CouponManagement';
import { SalesReportsTab } from './SalesReportsTab';
import { DatabaseBackupModal } from './DatabaseBackupModal';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    logoutUser,
    setCurrentView,
    orders,
    employees,
    saveEverythingToCloud,
    productRequests,
    storeSettings,
    toggleStorePurchasesSuspension,
  } = useApp();
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionLoading, setSuspensionLoading] = useState(false);
  const [customSuspensionMsg, setCustomSuspensionMsg] = useState(
    storeSettings.suspensionMessage || 'Estamos fechando o caixa no momento. Voltaremos em breve!'
  );
  const [customSuspensionTitle, setCustomSuspensionTitle] = useState(
    storeSettings.suspensionTitle || 'Estamos Fechando o Caixa'
  );

  const isPurchasesSuspended = Boolean(storeSettings.purchasesSuspended);

  const handleToggleSuspension = async (targetState: boolean) => {
    setSuspensionLoading(true);
    await toggleStorePurchasesSuspension(targetState, customSuspensionMsg, customSuspensionTitle);
    setSuspensionLoading(false);
    setShowSuspensionModal(false);
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    const success = await saveEverythingToCloud();
    setIsSavingAll(false);
    if (success) {
      const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
    }
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'Pendente').length;
  const pendingProductRequestsCount = (productRequests || []).filter((r) => r.status === 'Pendente').length;
  const isMasterAdmin = currentUser?.isMaster || currentUser?.email?.toLowerCase().trim() === 'khevineoliveira@gmail.com';

  // Find corresponding employee record if staff
  const staffEmployee = employees.find(
    (e) =>
      (currentUser?.id && e.id === currentUser.id) ||
      (currentUser?.email && e.email && e.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
  );

  const permissions = isMasterAdmin
    ? {
        canManageOrders: true,
        canManageProducts: true,
        canManageFinances: true,
        canManageStaff: true,
        canManageSettings: true,
        canManageCoupons: true,
        canManageReports: true,
      }
    : (currentUser?.permissions || staffEmployee?.permissions || {
        canManageOrders: true,
        canManageProducts: false,
        canManageFinances: false,
        canManageStaff: false,
        canManageSettings: false,
        canManageCoupons: false,
        canManageReports: false,
      });

  const allTabs = [
    {
      id: 'orders' as const,
      label: 'Pedidos & Baixa',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      visible: permissions.canManageOrders,
    },
    {
      id: 'products' as const,
      label: 'Produtos & Ofertas',
      icon: Package,
      badge: pendingProductRequestsCount > 0 ? `${pendingProductRequestsCount} novo` : null,
      visible: permissions.canManageProducts,
    },
    {
      id: 'reports' as const,
      label: 'Relatório de Vendas',
      icon: BarChart3,
      badge: null,
      visible: permissions.canManageReports,
    },
    {
      id: 'coupons' as const,
      label: 'Cupons de Desconto',
      icon: Tag,
      badge: null,
      visible: permissions.canManageCoupons,
    },
    {
      id: 'employees' as const,
      label: 'Gestão de Funcionários',
      icon: Users,
      badge: null,
      visible: permissions.canManageStaff,
    },
    {
      id: 'settings' as const,
      label: 'Frete, Retirada & WhatsApp',
      icon: Settings,
      badge: null,
      visible: permissions.canManageSettings,
    },
    {
      id: 'finances' as const,
      label: 'Controle de Caixa & Despesas',
      icon: DollarSign,
      badge: null,
      visible: permissions.canManageFinances,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.visible);

  const [activeTab, setActiveTab] = useState<'finances' | 'products' | 'orders' | 'employees' | 'settings' | 'coupons' | 'reports'>(() => {
    return (visibleTabs[0]?.id as any) || 'orders';
  });
  const [targetEditingOrderId, setTargetEditingOrderId] = useState<string | null>(null);

  const handleOpenEditOrder = (orderId: string) => {
    setTargetEditingOrderId(orderId);
    setActiveTab('orders');
  };

  // Ensure activeTab is always one of the permitted ones
  React.useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  // If accessed by non-admin, strictly deny access
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-tech text-white">
            ACESSO RESTRITO A ADMINISTRADORES
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta área é de uso estritamente corporativo e confidencial. Clientes não possuem permissão de acesso ao painel de controle.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => setCurrentView('store')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              Voltar para a Loja Virtual
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Admin App Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Brand Logo with Admin Tag */}
            <div className="flex items-center gap-3">
              <DnaLogo size="sm" />
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs ${
                  isMasterAdmin 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950' 
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                }`}>
                  {isMasterAdmin ? 'ADM MASTER' : 'STAFF ERP'}
                </span>
                <span className="text-xs text-slate-400 font-semibold font-tech">PAINEL ADMINISTRATIVO</span>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2.5">
              {/* Cashier & Purchases Suspension Button (Exclusivo Adm Master) */}
              {isMasterAdmin && (
                <button
                  onClick={() => {
                    setCustomSuspensionMsg(storeSettings.suspensionMessage || 'Estamos fechando o caixa no momento. Voltaremos em breve!');
                    setCustomSuspensionTitle(storeSettings.suspensionTitle || 'Estamos Fechando o Caixa');
                    setShowSuspensionModal(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                    isPurchasesSuspended
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-amber-500/10 animate-pulse'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                  title="Clique para suspender compras ou fechar/reabrir caixa da loja"
                >
                  {isPurchasesSuspended ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Compras Suspensas</span>
                      <span className="sm:hidden">Caixa Fechando</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="hidden sm:inline">Loja Ativa • Suspender Compras</span>
                      <span className="sm:hidden">Suspender</span>
                    </>
                  )}
                </button>
              )}

              {/* Automatic Real-Time Sync Indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Firestore Conectado</span>
              </div>

              {/* Database Backup & Restore Button */}
              <button
                onClick={() => setShowBackupModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-slate-800 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-cyan-500/40 cursor-pointer shadow-sm shadow-cyan-500/10"
                title="Backup e Restauração de Produtos e Pedidos no Banco de Dados"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Backup & Restaurar</span>
                <span className="sm:hidden">Backup</span>
              </button>

              {isMasterAdmin && (
                <button
                  onClick={() => setCurrentView('product-request')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-500/30 cursor-pointer"
                  title="Abrir formulário onde o dono solicita cadastro de produtos"
                >
                  <FilePlus2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Pedido de Cadastro (Link)</span>
                  <span className="sm:hidden">Cadastro</span>
                </button>
              )}

              <button
                onClick={() => setCurrentView('store')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700/80 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ver Loja Virtual</span>
                <span className="sm:hidden">Loja</span>
              </button>

              <button
                onClick={() => logoutUser()}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/20 cursor-pointer"
                title="Sair do painel com segurança"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-cyan-500/50"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shadow-md ${
                    isMasterAdmin 
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950' 
                      : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950'
                  }`}>
                    {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className="text-xs font-bold text-white truncate max-w-[150px] flex items-center gap-1">
                    {currentUser?.name || 'Administrador'}
                    {isMasterAdmin && <Crown className="w-3 h-3 text-amber-400" />}
                  </span>
                  <span className="text-[10px] text-cyan-400 mt-0.5 truncate max-w-[150px]">
                    {currentUser?.staffRole || (isMasterAdmin ? 'Admin Master' : 'Funcionário')}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="flex space-x-1 sm:space-x-3 overflow-x-auto admin-nav-scrollbar py-1.5 px-1 scroll-smooth">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-3 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer rounded-xl shrink-0 ${
                    isActive ? 'text-cyan-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {visibleTabs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 max-w-md mx-auto my-12 shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2 font-tech">NENHUMA ABA LIBERADA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O seu usuário corporativo não possui permissão para visualizar abas no momento. Entre em contato com o Administrador Master para liberar seu acesso.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'orders' && permissions.canManageOrders && (
              <OrderManagement
                initialEditingOrderId={targetEditingOrderId}
                onClearInitialEditingOrder={() => setTargetEditingOrderId(null)}
                onReturnToReports={() => setActiveTab('reports')}
              />
            )}
            {activeTab === 'products' && permissions.canManageProducts && <ProductManagement />}
            {activeTab === 'reports' && permissions.canManageReports && (
              <SalesReportsTab onOpenEditOrder={handleOpenEditOrder} />
            )}
            {activeTab === 'coupons' && permissions.canManageProducts && <CouponManagement />}
            {activeTab === 'employees' && permissions.canManageStaff && <EmployeeManagement />}
            {activeTab === 'settings' && permissions.canManageSettings && <StoreSettingsTab />}
            {activeTab === 'finances' && permissions.canManageFinances && <FinancialManagement />}
          </>
        )}
      </main>

      {/* Cashier Closure & Purchases Suspension Modal */}
      {showSuspensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  isPurchasesSuspended
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {isPurchasesSuspended ? <Lock className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-tech">
                    CONTROLE DE CAIXA & COMPRAS NO SITE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Suspender ou reabrir as compras de produtos no site instantaneamente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuspensionModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current State Highlight */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isPurchasesSuspended
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-3.5 h-3.5 rounded-full ${
                  isPurchasesSuspended ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`} />
                <div>
                  <p className="text-sm font-bold">
                    Status Atual: {isPurchasesSuspended ? '⏸️ COMPRAS SUSPENSAS (CAIXA FECHANDO)' : '🟢 LOJA ABERTA (COMPRAS LIBERADAS)'}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isPurchasesSuspended
                      ? 'Visitantes veem a mensagem de fechamento de caixa e botões de compra bloqueados.'
                      : 'Todos os clientes podem adicionar ao carrinho e finalizar pedidos normalmente.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Message & Title Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Título do Aviso no Topo do Site
                </label>
                <input
                  type="text"
                  value={customSuspensionTitle}
                  onChange={(e) => setCustomSuspensionTitle(e.target.value)}
                  placeholder="Ex: Estamos Fechando o Caixa"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mensagem aos Clientes *
                </label>
                <textarea
                  rows={2}
                  value={customSuspensionMsg}
                  onChange={(e) => setCustomSuspensionMsg(e.target.value)}
                  placeholder="Ex: Estamos fechando o caixa no momento. Voltaremos em breve!"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Sugestões rápidas de mensagem:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSuspensionTitle('Estamos Fechando o Caixa');
                      setCustomSuspensionMsg('Estamos realizando o fechamento do caixa no momento. As compras pelo site estão temporariamente suspensas e voltaremos em breve!');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-700"
                  >
                    🏪 Fechando o Caixa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSuspensionTitle('Balanço de Estoque');
                      setCustomSuspensionMsg('Estamos realizando a conferência de estoque de peptídeos. Compras suspensas temporariamente, voltamos já!');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-700"
                  >
                    📦 Balanço de Estoque
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSuspensionTitle('Manutenção no Caixa');
                      setCustomSuspensionMsg('Estamos fechando o caixa para atualização dos valores e lotes. Voltaremos em breve!');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-700"
                  >
                    ⚙️ Manutenção Rápida
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSuspensionModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {isPurchasesSuspended ? (
                <button
                  type="button"
                  disabled={suspensionLoading}
                  onClick={() => handleToggleSuspension(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{suspensionLoading ? 'Reabrindo...' : 'Reabrir Loja & Liberar Compras'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={suspensionLoading}
                  onClick={() => handleToggleSuspension(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>{suspensionLoading ? 'Aplicando...' : 'Suspender Compras (Fechar Caixa)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Database Backup & Restore Modal */}
      <DatabaseBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />

      {/* Admin Panel Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PEPTIDE IMPORTS ERP • Painel de Gestão Farmacêutica</span>
          <span>
            Sistema criado por{' '}
            <a
              href="https://instagram.com/khevine_nunes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
            >
              @khevine_nunes
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};
