import React from 'react';
import { Gem, Plane, ShieldCheck, UserCheck } from 'lucide-react';

export const TrustRibbon: React.FC = () => {
  const items = [
    {
      icon: Gem,
      title: 'Qualidade Comprovada',
      subtitle: 'Laudos HPLC laboratoriais',
    },
    {
      icon: Plane,
      title: 'Importação Direta',
      subtitle: 'Sem intermediários',
    },
    {
      icon: ShieldCheck,
      title: 'Compra Segura',
      subtitle: 'Garantia de recebimento',
    },
    {
      icon: UserCheck,
      title: 'Atendimento Personalizado',
      subtitle: 'Suporte consultivo no WhatsApp',
    },
  ];

  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-sm py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3.5 ${
                idx > 0 ? 'pt-3 md:pt-0 md:pl-6' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-800 transition-transform hover:scale-105">
                <item.icon className="w-5 h-5 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {item.title}
                </span>
                <span className="text-xs text-slate-700">
                  {item.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
