import React from 'react';
import { Home, LayoutGrid, BookOpen, MessageSquare, User, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MobileBottomBar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeNav,
    setActiveNav,
    setInfoModal,
    setSelectedCategory,
    currentUser,
  } = useApp();

  const handleNav = (target: 'home' | 'products' | 'guide' | 'contact' | 'account' | 'admin') => {
    if (target === 'home') {
      setCurrentView('store');
      setActiveNav('Início');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'products') {
      setCurrentView('store');
      setActiveNav('Produtos');
      setSelectedCategory('Todos');
      const catalogEl = document.getElementById('catalogo');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === 'guide') {
      setCurrentView('guide');
      setActiveNav('Guia de Peptídeos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'contact') {
      setInfoModal('contact');
    } else if (target === 'account') {
      setCurrentView('my-account');
      setActiveNav('Minha Conta');
    } else if (target === 'admin') {
      setCurrentView('admin');
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-800/90 py-2 px-3 shadow-2xl">
      <div className="flex items-center justify-around">
        {/* Início */}
        <button
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === 'store' && activeNav === 'Início'
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Início</span>
        </button>

        {/* Produtos */}
        <button
          onClick={() => handleNav('products')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === 'store' && activeNav === 'Produtos'
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Produtos</span>
        </button>

        {/* Guia Científico */}
        <button
          onClick={() => handleNav('guide')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === 'guide'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-cyan-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold">Guia</span>
        </button>

        {/* Minha Conta */}
        <button
          onClick={() => handleNav('account')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === 'my-account'
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Conta</span>
        </button>

        {/* Admin icon if user has admin privileges */}
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => handleNav('admin')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'admin'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-bold">ERP</span>
          </button>
        )}
      </div>
    </div>
  );
};
