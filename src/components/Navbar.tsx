import React, { useState } from 'react';
import { Search, ShoppingBag, User, Menu, X, ShieldAlert, LogOut, Package, LayoutDashboard, ChevronDown, BookOpen, FilePlus2 } from 'lucide-react';
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
          <nav className="hidden lg:flex items-center space-x-7">
            {[
              { id: 'Início', label: 'Início' },
              { id: 'Produtos', label: 'Produtos' },
              { id: 'Guia de Peptídeos', label: 'Guia de Peptídeos', highlight: true },
              { id: 'Sobre nós', label: 'Sobre nós' },
              { id: 'Segurança', label: 'Segurança' },
              { id: 'Contato', label: 'Contato' },
            ].map((link) => {
              const isActive = (link.id === 'Guia de Peptídeos' && currentView === 'guide') ||
                               (activeNav === link.id && currentView === 'store');
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-cyan-400 font-bold'
                      : link.highlight
                      ? 'text-cyan-300 hover:text-white'
                      : 'text-slate-300 hover:text-cyan-400'
                  }`}
                >
                  {link.highlight && <BookOpen className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{link.label}</span>
                  {link.highlight && !isActive && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                      E-book
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
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
              { id: 'Guia de Peptídeos', label: 'Guia de Peptídeos (E-Book)', highlight: true },
              { id: 'Sobre nós', label: 'Sobre nós' },
              { id: 'Segurança', label: 'Segurança' },
              { id: 'Contato', label: 'Contato' },
            ].map((link) => {
              const isActive = (link.id === 'Guia de Peptídeos' && currentView === 'guide') ||
                               (activeNav === link.id && currentView === 'store');
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
                    {link.highlight && <BookOpen className="w-4 h-4 text-cyan-400" />}
                    {link.label}
                  </span>
                  {link.highlight && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                      Científico
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
