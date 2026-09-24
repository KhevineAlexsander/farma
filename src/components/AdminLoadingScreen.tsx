import React from 'react';
import { DnaLogo } from './DnaLogo';
import { ShieldAlert } from 'lucide-react';

interface AdminLoadingScreenProps {
  message?: string;
}

export const AdminLoadingScreen: React.FC<AdminLoadingScreenProps> = ({
  message = 'Sincronizando dados em tempo real e validando acessos...',
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F17] text-white p-4 select-none animate-in fade-in duration-200">
      <div className="flex flex-col items-center text-center max-w-sm w-full space-y-6">
        
        {/* Futuristic DNA Brand Icon with Subtle Pulse */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-3xl blur-md animate-pulse" />
          <div className="relative p-4 bg-slate-900/95 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/10 flex items-center justify-center">
            <DnaLogo size="md" withText={false} />
          </div>
        </div>

        {/* Informational Titles */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1">
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span>Área Administrativa ERP</span>
          </div>
          <h2 className="text-base sm:text-lg font-black font-tech tracking-wider text-white uppercase">
            CARREGANDO PAINEL
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
            {message}
          </p>
        </div>

        {/* HTML Solicitado da Barra de Carregamento */}
        <div className="pt-2 flex flex-col items-center justify-center">
          <div className="barra" role="status" aria-label="Carregando">
            <div className="barra__trilho"></div>
          </div>
          <span className="sr-only">Carregando painel...</span>
        </div>

      </div>
    </div>
  );
};
