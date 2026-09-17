import React from 'react';
import { X, ShieldCheck, Thermometer, Award, Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DnaLogo } from './DnaLogo';

export const InfoModals: React.FC = () => {
  const { infoModal, setInfoModal, storeSettings } = useApp();

  if (!infoModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setInfoModal(null)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal: SOBRE NÓS */}
        {infoModal === 'about' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0B0F17] rounded-xl">
                <DnaLogo size="sm" withText={false} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 font-tech">
                  SOBRE A PEPTIDE IMPORTS FARMA
                </h3>
                <p className="text-xs text-slate-500">Excelência e Rigor Científico em Biotecnologia</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A <strong>PEPTIDE IMPORTS FARMA</strong> nasceu com a missão de disponibilizar os mais puros e avançados peptídeos e bioreguladores sintéticos do mundo diretamente para o mercado nacional.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <Award className="w-5 h-5 text-cyan-600 mb-1" />
                <h4 className="text-xs font-bold text-slate-900">Pureza Superior HPLC</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cada lote passa por cromatografia líquida de alta eficiência (HPLC) garantindo pureza superior a 99%.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <Thermometer className="w-5 h-5 text-blue-600 mb-1" />
                <h4 className="text-xs font-bold text-slate-900">Cadeia Fria Estrita</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Transporte com controle térmico rigoroso e recipientes isotérmicos para assegurar a integridade molecular.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal: SEGURANÇA */}
        {infoModal === 'security' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 font-tech">
                  POLÍTICA DE SEGURANÇA & QUALIDADE
                </h3>
                <p className="text-xs text-slate-500">Garantia total de entrega e integridade molecular</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Trabalhamos com o mais alto padrão de conformidade e segurança em todas as etapas da sua compra.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Seguro Total contra Danos ou Extravio
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Caso o pacote sofra qualquer intercorrência ou quebra de frasco no transporte, realizamos o reenvio imediato sem qualquer custo adicional.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-600" /> Laudo de Pureza HPLC Individualizado
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Acompanha certificado de análise por lote emitido por laboratório analítico independente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal: CONTATO */}
        {infoModal === 'contact' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 font-tech">
                  CANAL DE ATENDIMENTO
                </h3>
                <p className="text-xs text-slate-500">Tire suas dúvidas técnicas ou suporte sobre pedidos</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <a
                href={`https://wa.me/${storeSettings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <Phone className="w-5 h-5 text-emerald-700" />
                <div>
                  <strong className="block text-sm">WhatsApp Consultivo</strong>
                  <span className="text-emerald-700 font-semibold">{storeSettings.whatsappNumber} (Suporte Rápido)</span>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <Mail className="w-5 h-5 text-cyan-600" />
                <div>
                  <strong className="block text-sm text-slate-900">E-mail Comercial & Técnico</strong>
                  <span className="text-slate-600 font-medium">{storeSettings.supportEmail || 'contato@peptideimports.com.br'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <Clock className="w-5 h-5 text-slate-500" />
                <div>
                  <strong className="block text-sm text-slate-900">Horário de Atendimento</strong>
                  <span className="text-slate-600">Segunda a Sexta das 08h às 20h | Sábado das 09h às 14h</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
