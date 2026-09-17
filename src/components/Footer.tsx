import React from 'react';
import { ShieldCheck, Truck, Lock, Heart, Phone, Mail, Award } from 'lucide-react';
import { DnaLogo } from './DnaLogo';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setInfoModal, setCurrentView, storeSettings, setIsAuthOpen } = useApp();

  return (
    <footer className="bg-[#070A0F] text-slate-400 border-t border-slate-800/80 pt-16 pb-24 lg:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-800/60">
          
          {/* Brand & Description */}
          <div className="lg:col-span-2 space-y-4">
            <DnaLogo size="md" />
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Referência nacional em peptídeos importados de altíssima pureza com laudos cromatográficos (HPLC), cadeia fria farmacêutica e suporte especializado.
            </p>
            <div className="flex items-center gap-3 text-cyan-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-300">
                Garantia de 100% de pureza molecular com certificado de análise (COA)
              </span>
            </div>
          </div>

          {/* Links: Navegação */}
          <div className="space-y-3">
            <h4 className="text-white font-bold font-tech text-sm uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setCurrentView('store');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Início
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('store');
                    const el = document.getElementById('catalogo');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Catálogo de Produtos
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('guide');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Guia de Peptídeos (E-Book)</span>
                </button>
              </li>
              <li>
                <button onClick={() => setInfoModal('about')} className="hover:text-cyan-400 transition-colors">
                  Sobre a Empresa
                </button>
              </li>
              <li>
                <button onClick={() => setInfoModal('security')} className="hover:text-cyan-400 transition-colors">
                  Segurança & Qualidade
                </button>
              </li>
              <li>
                <button onClick={() => setInfoModal('contact')} className="hover:text-cyan-400 transition-colors">
                  Fale Conosco
                </button>
              </li>
            </ul>
          </div>

          {/* Links: Categorias */}
          <div className="space-y-3">
            <h4 className="text-white font-bold font-tech text-sm uppercase tracking-wider">
              Categorias
            </h4>
            <ul className="space-y-2">
              <li><span className="hover:text-cyan-400 cursor-pointer">Emagrecimento & Metabolismo</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer">Saúde & Longevidade</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer">Beleza & Estética</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer">Desempenho Físico & GH</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer">Nootrópicos e Cognição</span></li>
            </ul>
          </div>

          {/* ERP Access & Atendimento */}
          <div className="space-y-3">
            <h4 className="text-white font-bold font-tech text-sm uppercase tracking-wider">
              Acesso Corporativo
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Área da Equipe & Admin</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('my-account')}
                  className="hover:text-slate-200 transition-colors text-xs text-slate-400"
                >
                  Portal do Cliente
                </button>
              </li>
              <li className="pt-2">
                <span className="text-slate-500 block text-xs">WhatsApp de Suporte:</span>
                <a
                  href={`https://wa.me/${storeSettings.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-bold hover:text-cyan-300 text-xs"
                >
                  {storeSettings.whatsappNumber}
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal & Copyright Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>
            © {new Date().getFullYear()} PEPTIDE IMPORTS FARMA. Todos os direitos reservados.
          </p>
          <p className="text-center sm:text-right max-w-md">
            Produtos destinados para fins de pesquisa científica, suporte bioquímico avançado e suplementação autorizada.
          </p>
        </div>

      </div>
    </footer>
  );
};
