import React, { useState } from 'react';
import { Settings, MessageSquare, Type, Bell, Mail, CheckCircle2, RotateCcw, ShieldCheck, Truck, Store, AlertCircle, Tag, UploadCloud, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_SETTINGS } from '../../data/mockData';

export const StoreSettingsTab: React.FC = () => {
  const { storeSettings, updateStoreSettings, saveAllSettingsToCloud, showToast } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    storeName: storeSettings.storeName || 'PEPTIDE IMPORTS FARMA',
    whatsappNumber: storeSettings.whatsappNumber || '5511993456789',
    whatsappDisplay: storeSettings.whatsappDisplay || '(11) 99345-6789',
    supportEmail: storeSettings.supportEmail || 'contato@peptideimports.com.br',
    heroBadge: storeSettings.heroBadge || 'PEPTÍDEOS IMPORTADOS COM LAUDO HPLC',
    heroTitle: storeSettings.heroTitle || 'BIOTECNOLOGIA AVANÇADA EM PEPTÍDEOS DE ALTA PUREZA',
    heroSubtitle: storeSettings.heroSubtitle || 'Importação direta com pureza molecular superior a 99%, cadeia de frio rigorosa (2°C a 8°C) e laudo analítico individual por lote.',
    announcementBar: storeSettings.announcementBar || 'Envio Imediato com Cadeia Fria para Todo o Brasil | Cupom PEPTIDE10 para 10% OFF',
    checkoutNotice: storeSettings.checkoutNotice || 'Finalize sua compra e envie o resumo detalhado direto para nosso WhatsApp oficial para liberação imediata!',
    deliveryFee: storeSettings.deliveryFee ?? 30.00,
    pickupEnabled: storeSettings.pickupEnabled ?? true,
    pickupAddress: storeSettings.pickupAddress || 'Av. Paulista, 1842 - Conjunto 114 (Edifício Horizon), Bela Vista, São Paulo - SP',
    pickupEstimatedTime: storeSettings.pickupEstimatedTime || 'Pronto em 2 horas úteis (Seg a Sex das 09h às 18h)',
    couponsEnabled: storeSettings.couponsEnabled ?? true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await saveAllSettingsToCloud(formData);
    setIsSaving(false);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as configurações padrão da loja?')) {
      setFormData({
        ...INITIAL_SETTINGS,
      });
      updateStoreSettings(INITIAL_SETTINGS);
      showToast('Configurações restauradas para o padrão.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-tech flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            CONFIGURAÇÕES GERAIS, TAXA DE ENTREGA & WHATSAPP
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Defina o canal do WhatsApp oficial, frases institucionais, taxa fixa de entrega e opção de retirada presencial.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Salvando no Banco...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Salvar Configurações no Banco</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* ROW 1: WhatsApp Channel & Shipping Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: WhatsApp & Contact Settings */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-tech">CANAL OFICIAL DO WHATSAPP</h3>
                  <p className="text-[11px] text-slate-400">
                    Os clientes serão redirecionados para este número com o resumo e código do pedido.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Número do WhatsApp Internacional (com DDI e DDD, sem símbolos) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    placeholder="Ex: 5511993456789"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Exemplo Brasil: 55 + DDD + 9 dígitos (Ex: 5511993456789). Link: <strong className="text-emerald-400">wa.me/{formData.whatsappNumber.replace(/\D/g, '')}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Número Formatado para Exibição Visual no Topo/Rodapé
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappDisplay}
                    onChange={(e) => handleChange('whatsappDisplay', e.target.value)}
                    placeholder="Ex: (11) 99345-6789"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Instrução no Modal de Checkout (Aviso WhatsApp)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.checkoutNotice}
                    onChange={(e) => handleChange('checkoutNotice', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    E-mail de Suporte / SAC Oficial
                  </label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Announcement Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-tech">FAIXA DE ANÚNCIO DO TOPO</h3>
                  <p className="text-[11px] text-slate-400">
                    Barra superior com alertas promocionais fixada no topo de todas as páginas da loja.
                  </p>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <label className="block text-slate-300 font-semibold">Texto da Faixa Superior</label>
                <input
                  type="text"
                  value={formData.announcementBar}
                  onChange={(e) => handleChange('announcementBar', e.target.value)}
                  placeholder="Ex: Envio Imediato com Cadeia Fria para Todo o Brasil | Cupom PEPTIDE10 para 10% OFF"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Logistics, Shipping & Pickup Rules */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Delivery Fee & Pickup Rules */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-tech">TAXA DE ENTREGA & RETIRADA</h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastre a taxa de entrega fixa da loja e gerencie a opção de retirada presencial.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Taxa de Entrega Fixa da Loja (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.deliveryFee}
                      onChange={(e) => handleChange('deliveryFee', parseFloat(e.target.value) || 0)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Esta taxa será cobrada em todas as entregas com envio térmico seguro (cadeia de frio).
                  </p>
                </div>

                {/* Pickup Toggle */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-white">Opção de Retirada na Sede (Balcão)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.pickupEnabled}
                        onChange={(e) => handleChange('pickupEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Quando ativado, o cliente poderá escolher "Retirar Pessoalmente na Sede" no checkout com taxa zero.
                  </p>

                  {formData.pickupEnabled && (
                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Endereço Completo da Sede para Retirada
                        </label>
                        <input
                          type="text"
                          value={formData.pickupAddress}
                          onChange={(e) => handleChange('pickupAddress', e.target.value)}
                          placeholder="Ex: Av. Paulista, 1842 - Conjunto 114, São Paulo - SP"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Prazo / Horário Estimado para Disponibilidade
                        </label>
                        <input
                          type="text"
                          value={formData.pickupEstimatedTime}
                          onChange={(e) => handleChange('pickupEstimatedTime', e.target.value)}
                          placeholder="Ex: Pronto em 2 horas úteis (Seg a Sex das 09h às 18h)"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Coupons Toggle Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-tech">SISTEMA DE CUPONS DE DESCONTO</h3>
                <p className="text-[11px] text-slate-400">
                  Ative ou desative o campo de cupons promocionais no carrinho e no checkout.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.couponsEnabled !== false}
                onChange={(e) => handleChange('couponsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Quando ativado, os clientes poderão digitar cupons promocionais (como PEPTIDE10) para obter descontos. Quando desativado, o campo de cupons não aparecerá para os clientes.
          </p>
        </div>

        {/* ROW 2: Home Screen Texts & Hero */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-tech">FRASES DA TELA INICIAL (HERO BANNER)</h3>
              <p className="text-[11px] text-slate-400">
                Edite os títulos, marca e subtítulos visíveis para os clientes na vitrine principal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nome da Marca / Loja
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tag / Selo Superior do Banner
              </label>
              <input
                type="text"
                value={formData.heroBadge}
                onChange={(e) => handleChange('heroBadge', e.target.value)}
                placeholder="Ex: PEPTÍDEOS IMPORTADOS COM LAUDO HPLC"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Título Principal da Tela Inicial
              </label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={(e) => handleChange('heroTitle', e.target.value)}
                placeholder="Ex: BIOTECNOLOGIA AVANÇADA EM PEPTÍDEOS"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Subtítulo / Descrição da Tela Inicial
              </label>
              <textarea
                rows={3}
                value={formData.heroSubtitle}
                onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Floating / Sticky Save Bar */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>As configurações têm aplicação em tempo real em todas as sessões e no checkout.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gravando no Banco de Dados...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Salvar no Banco & Atualizar Site Agora</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
