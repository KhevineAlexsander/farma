import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingBag, User, Menu, X, ShieldAlert, LogOut, Package, LayoutDashboard, ChevronDown, BookOpen, FilePlus2, Sparkles, Syringe, Activity, ChevronRight, SlidersHorizontal, Layers, Check } from 'lucide-react';
import { DnaLogo } from './DnaLogo';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    currentUser,
    switchUserRole,
    logoutUser,
    setIsAuthOpen,
    currentView,
    setCurrentView,
    activeNav,
    setActiveNav,
    setInfoModal,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    storeSettings,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Expandable Tools state: collapsed by default to save navbar space
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState<boolean>(() => {
    return localStorage.getItem('navbar_tools_expanded') === 'true';
  });
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  const toggleToolsExpanded = () => {
    setIsToolsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('navbar_tools_expanded', String(next));
      return next;
    });
    setIsToolsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMasterAdmin = currentUser?.isMaster || currentUser?.email?.toLowerCase().trim() === 'khevineoliveira@gmail.com';

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    setIsMobileMenuOpen(false);

    if (nav === 'Início') {
      setCurrentView('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nav === 'Produtos') {
      setCurrentView('store');
      setSelectedCategory('Todos');
      const catalogEl = document.getElementById('catalogo');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (nav === 'Benefícios') {
      setCurrentView('benefits');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nav === 'Cálculo de Doses') {
      setCurrentView('dosage-calculator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nav === 'Controle de Dieta') {
      setCurrentView('diet-control');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nav === 'Guia de Peptídeos') {
      setCurrentView('guide');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nav === 'Sobre nós') {
      setInfoModal('about');
    } else if (nav === 'Segurança') {
      setInfoModal('security');
    } else if (nav === 'Contato') {
      setInfoModal('contact');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      {/* Top Cashier Closing / Purchases Suspended Alert Banner */}
      {storeSettings.purchasesSuspended ? (
        <div className="bg-gradient-to-r from-amber-950/95 via-rose-950/95 to-amber-950/95 border-b border-amber-500/40 py-2 px-4 text-center shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-black tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {storeSettings.suspensionTitle || 'FECHAMENTO DE CAIXA'}
            </span>
            <span>
              {storeSettings.suspensionMessage || 'Estamos fechando o caixa no momento. As compras estão temporariamente suspensas e voltaremos em breve!'}
            </span>
            {storeSettings.whatsappNumber && (
              <a
                href={`https://wa.me/${storeSettings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vi que o caixa do site está em fechamento no momento. Gostaria de tirar uma dúvida.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold text-xs transition-colors shadow-xs ml-1"
              >
                Atendimento no WhatsApp
              </a>
            )}
          </div>
        </div>
      ) : storeSettings.announcementBar ? (
        <div className="bg-gradient-to-r from-blue-900/60 via-cyan-900/40 to-blue-900/60 border-b border-cyan-500/20 py-1.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold text-cyan-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>{storeSettings.announcementBar}</span>
            {storeSettings.whatsappNumber && (
              <a
                href={`https://wa.me/${storeSettings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center ml-2 text-cyan-400 hover:text-white underline font-bold"
              >
                Falar com Farmacêutico
              </a>
            )}
          </div>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu Trigger & Left */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Abrir menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('Início')}
            className="cursor-pointer flex items-center group transition-transform active:scale-95"
          >
            <DnaLogo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-3 xl:space-x-5">
            {/* Standard Primary Links */}
            <button
              onClick={() => handleNavClick('Início')}
              className={`relative py-2 text-xs xl:text-sm font-medium transition-colors ${
                activeNav === 'Início' && currentView === 'store'
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-300 hover:text-cyan-400'
              }`}
            >
              <span>Início</span>
              {activeNav === 'Início' && currentView === 'store' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('Produtos')}
              className={`relative py-2 text-xs xl:text-sm font-medium transition-colors ${
                activeNav === 'Produtos' && currentView === 'store'
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-300 hover:text-cyan-400'
              }`}
            >
              <span>Produtos</span>
              {activeNav === 'Produtos' && currentView === 'store' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
              )}
            </button>

            {/* Smart Expandable Tools Group */}
            {!isToolsExpanded ? (
              /* Collapsed State: A single compact dropdown button that expands on click to save maximum navbar space */
              <div className="relative" ref={toolsDropdownRef}>
                <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                    className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      currentView === 'benefits' || currentView === 'dosage-calculator' || currentView === 'diet-control'
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                        : isToolsDropdownOpen
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {currentView === 'dosage-calculator' ? (
                        <Syringe className="w-3.5 h-3.5 text-cyan-400" />
                      ) : currentView === 'diet-control' ? (
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>
                        {currentView === 'benefits'
                          ? 'Benefícios'
                          : currentView === 'dosage-calculator'
                          ? 'Cálculo de Doses'
                          : currentView === 'diet-control'
                          ? 'Dieta & Macros'
                          : 'Ferramentas & Doses'}
                      </span>
                    </div>

                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                      3
                    </span>

                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isToolsDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                      }`}
                    />
                  </button>

                  {/* Inline quick expand toggle */}
                  <button
                    type="button"
                    onClick={toggleToolsExpanded}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Expandir botões diretamente na barra superior"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Floating Dropdown Panel */}
                {isToolsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-[#0B0F17] border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                      <span>Recursos Clínicos & Ferramentas</span>
                      <span className="text-cyan-400 text-[9px]">3 Ferramentas</span>
                    </div>

                    {/* 1. Benefícios */}
                    <button
                      onClick={() => {
                        handleNavClick('Benefícios');
                        setIsToolsDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        currentView === 'benefits'
                          ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                          : 'hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Página de Benefícios</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Novo</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">Mecanismos celulares, HPLC e indicações</p>
                      </div>
                    </button>

                    {/* 2. Cálculo de Doses */}
                    <button
                      onClick={() => {
                        handleNavClick('Cálculo de Doses');
                        setIsToolsDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        currentView === 'dosage-calculator'
                          ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                          : 'hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Syringe className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Cálculo de Doses & Seringa</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Calculadora</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">Seringa graduada, diluição e cronograma</p>
                      </div>
                    </button>

                    {/* 3. Controle de Dieta */}
                    <button
                      onClick={() => {
                        handleNavClick('Controle de Dieta');
                        setIsToolsDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        currentView === 'diet-control'
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                          : 'hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Controle de Dieta & Macros</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Nutrição</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">Metas de proteína, hidratação e diário</p>
                      </div>
                    </button>

                    {/* Bottom option to pin/expand inline */}
                    <div className="pt-2 mt-1 border-t border-slate-800/80">
                      <button
                        onClick={toggleToolsExpanded}
                        className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Fixar botões expandidos na barra</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Expanded State: Renders all 3 buttons inline with no text-wrapping, plus a collapse button */
              <div className="flex items-center space-x-2 bg-slate-900/60 p-1 rounded-2xl border border-slate-800 animate-in fade-in duration-200">
                <button
                  onClick={() => handleNavClick('Benefícios')}
                  className={`py-1 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'benefits'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Benefícios</span>
                </button>

                <button
                  onClick={() => handleNavClick('Cálculo de Doses')}
                  className={`py-1 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'dosage-calculator'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Syringe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Cálculo de Doses</span>
                </button>

                <button
                  onClick={() => handleNavClick('Controle de Dieta')}
                  className={`py-1 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'diet-control'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dieta & Macros</span>
                </button>

                {/* Collapse button to hide buttons back into dropdown */}
                <button
                  onClick={toggleToolsExpanded}
                  className="p-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700/60"
                  title="Recolher botões para economizar espaço"
                >
                  <X className="w-3 h-3 text-slate-400" />
                  <span>Ocultar</span>
                </button>
              </div>
            )}

            {/* Guia & Contato */}
            <button
              onClick={() => handleNavClick('Guia de Peptídeos')}
              className={`relative py-2 text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                currentView === 'guide'
                  ? 'text-cyan-400 font-bold'
                  : 'text-cyan-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Guia</span>
              {currentView !== 'guide' && (
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  E-book
                </span>
              )}
              {currentView === 'guide' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('Contato')}
              className="py-2 text-xs xl:text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors whitespace-nowrap"
            >
              Contato
            </button>
          </nav>

          {/* Right Action Icons: Search, User, Cart */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Show Admin Panel direct button ONLY if authenticated user is ADMIN */}
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentView('admin')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                title="Acessar Painel Administrativo ERP"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Painel ERP</span>
              </button>
            )}

            {/* Search Button & Search input */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-slate-900 border border-cyan-500/50 rounded-full px-3 py-1.5 shadow-lg w-64 z-50 apple-dropdown-menu">
                  <Search className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar peptídeo..."
                    autoFocus
                    className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-400"
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="text-slate-400 hover:text-white ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 rounded-full transition-colors"
                  title="Pesquisar peptídeos"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* User Profile / Menu */}
            <div className="relative">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-900 border border-slate-700/80 rounded-full hover:border-cyan-500/60 transition-all text-xs font-medium"
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.name || 'Usuário'}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover border border-cyan-400"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                        {(currentUser.name || 'U').charAt(0)}
                      </div>
                    )}
                    <span className="hidden sm:inline text-slate-200 truncate max-w-[100px]">
                      {(currentUser.name || 'Usuário').split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 apple-dropdown-menu">
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="text-xs text-slate-400">Logado como</p>
                        <p className="text-sm font-semibold text-white truncate">{currentUser.name || 'Usuário'}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {currentUser.role}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentView('my-account');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                      >
                        <Package className="w-4 h-4 text-cyan-400" />
                        Minha Conta & Pedidos
                      </button>

                      {currentUser.role === 'ADMIN' && (
                        <>
                          <button
                            onClick={() => {
                              setCurrentView('admin');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-cyan-300 hover:bg-slate-800 flex items-center gap-2.5 transition-colors font-medium"
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-400" />
                            Painel Administrador ERP
                          </button>
                          {isMasterAdmin && (
                            <button
                              onClick={() => {
                                setCurrentView('product-request');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-emerald-300 hover:bg-slate-800 flex items-center gap-2.5 transition-colors font-medium"
                            >
                              <FilePlus2 className="w-4 h-4 text-emerald-400" />
                              Pedir Cadastro de Produto
                            </button>
                          )}
                        </>
                      )}

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        onClick={() => {
                          logoutUser();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-slate-800/80 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair da Conta
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 rounded-full transition-colors flex items-center gap-1.5"
                  title="Fazer Login"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs font-medium">Entrar</span>
                </button>
              )}
            </div>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 text-slate-200 hover:text-white rounded-full transition-all group active:scale-95"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0B0F17] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3 apple-dropdown-menu">
          <div className="flex flex-col space-y-2">
            {[
              { id: 'Início', label: 'Início' },
              { id: 'Produtos', label: 'Produtos' },
              { id: 'Benefícios', label: 'Página de Benefícios', icon: Sparkles, badge: 'Novo' },
              { id: 'Cálculo de Doses', label: 'Cálculo de Doses & Seringa', icon: Syringe, badge: 'Calculadora' },
              { id: 'Controle de Dieta', label: 'Controle de Dieta & Macros', icon: Activity },
              { id: 'Guia de Peptídeos', label: 'Guia de Peptídeos (E-Book)', icon: BookOpen, highlight: true },
              { id: 'Sobre nós', label: 'Sobre nós' },
              { id: 'Segurança', label: 'Segurança' },
              { id: 'Contato', label: 'Contato' },
            ].map((link) => {
              const isActive =
                (link.id === 'Benefícios' && currentView === 'benefits') ||
                (link.id === 'Cálculo de Doses' && currentView === 'dosage-calculator') ||
                (link.id === 'Controle de Dieta' && currentView === 'diet-control') ||
                (link.id === 'Guia de Peptídeos' && currentView === 'guide') ||
                (activeNav === link.id && currentView === 'store');
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-slate-800/90 text-cyan-400 font-bold'
                      : link.highlight
                      ? 'text-cyan-300 hover:bg-slate-900 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
                    {link.label}
                  </span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setCurrentView('my-account');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-cyan-400" />
              Minha Conta & Pedidos
            </button>

            {currentUser?.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-cyan-400 bg-slate-900 border border-slate-700/80 flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Painel ERP Corporativo</span>
                </button>
                {isMasterAdmin && (
                  <button
                    onClick={() => {
                      setCurrentView('product-request');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-emerald-400 bg-slate-900 border border-slate-700/80 flex items-center gap-2"
                  >
                    <FilePlus2 className="w-4 h-4 text-emerald-400" />
                    <span>Pedir Cadastro de Produto</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
