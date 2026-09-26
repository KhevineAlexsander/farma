import React, { useState, useEffect } from 'react';
import {
  Settings,
  MessageSquare,
  Type,
  Bell,
  Mail,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Truck,
  Store,
  AlertCircle,
  Tag,
  UploadCloud,
  RefreshCw,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Database,
  Layers,
  Sparkles,
  Server,
  Key,
  Code,
  Eye,
  X,
  Zap,
  Lock,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Download,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_SETTINGS } from '../../data/mockData';
import { isSupabaseConfigured, setSupabaseCredentials, testSupabaseConnection } from '../../lib/supabase';
import { DatabaseBackupModal } from './DatabaseBackupModal';

export const StoreSettingsTab: React.FC = () => {
  const { storeSettings, updateStoreSettings, saveAllSettingsToCloud, showToast, isSupabaseActive, currentUser, products, orders } = useApp();
  const isMasterAdmin = currentUser?.isMaster || currentUser?.email?.toLowerCase().trim() === 'khevineoliveira@gmail.com';
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupModalTab, setBackupModalTab] = useState<'export' | 'import'>('export');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => {
    try {
      return localStorage.getItem('peptide_supabase_url') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
    } catch {
      return '';
    }
  });

  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(() => {
    try {
      return localStorage.getItem('peptide_supabase_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    } catch {
      return '';
    }
  });

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
    siteUrl: storeSettings.siteUrl || 'https://peptideimports.vercel.app',
    vercelDomain: storeSettings.vercelDomain || 'peptideimports.vercel.app',
    customDomainNotes: storeSettings.customDomainNotes || '',
    purchasesSuspended: storeSettings.purchasesSuspended ?? false,
    suspensionTitle: storeSettings.suspensionTitle || 'Estamos Fechando o Caixa',
    suspensionMessage: storeSettings.suspensionMessage || 'Estamos fechando o caixa no momento. As compras estão temporariamente suspensas e voltaremos em breve!',
    suspensionEstimatedReturn: storeSettings.suspensionEstimatedReturn || 'Voltaremos em breve',
  });

  // Keep form synchronized when storeSettings is updated from Firebase Firestore in real-time
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      storeName: storeSettings.storeName ?? prev.storeName,
      whatsappNumber: storeSettings.whatsappNumber ?? prev.whatsappNumber,
      whatsappDisplay: storeSettings.whatsappDisplay ?? prev.whatsappDisplay,
      supportEmail: storeSettings.supportEmail ?? prev.supportEmail,
      heroBadge: storeSettings.heroBadge ?? prev.heroBadge,
      heroTitle: storeSettings.heroTitle ?? prev.heroTitle,
      heroSubtitle: storeSettings.heroSubtitle ?? prev.heroSubtitle,
      announcementBar: storeSettings.announcementBar ?? prev.announcementBar,
      checkoutNotice: storeSettings.checkoutNotice ?? prev.checkoutNotice,
      deliveryFee: storeSettings.deliveryFee ?? prev.deliveryFee,
      pickupEnabled: storeSettings.pickupEnabled ?? prev.pickupEnabled,
      pickupAddress: storeSettings.pickupAddress ?? prev.pickupAddress,
      pickupEstimatedTime: storeSettings.pickupEstimatedTime ?? prev.pickupEstimatedTime,
      couponsEnabled: storeSettings.couponsEnabled ?? prev.couponsEnabled,
      siteUrl: storeSettings.siteUrl ?? prev.siteUrl,
      vercelDomain: storeSettings.vercelDomain ?? prev.vercelDomain,
      customDomainNotes: storeSettings.customDomainNotes ?? prev.customDomainNotes,
      purchasesSuspended: storeSettings.purchasesSuspended ?? prev.purchasesSuspended,
      suspensionTitle: storeSettings.suspensionTitle || prev.suspensionTitle,
      suspensionMessage: storeSettings.suspensionMessage || prev.suspensionMessage,
      suspensionEstimatedReturn: storeSettings.suspensionEstimatedReturn || prev.suspensionEstimatedReturn,
    }));
  }, [storeSettings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSupabaseCredentials = async () => {
    setSupabaseCredentials(supabaseUrlInput, supabaseAnonKeyInput);
    showToast('Credenciais do Supabase salvas localmente!');
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await testSupabaseConnection();
      setConnectionStatus(res);
      if (res.success) {
        showToast('Conexão com o Supabase estabelecida com sucesso!');
      } else {
        showToast('Aviso: Verifique o script SQL e as credenciais do Supabase.');
      }
    } catch (e: any) {
      setConnectionStatus({ success: false, message: e?.message || 'Falha ao conectar' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCopyUrl = () => {
    const url = formData.siteUrl.startsWith('http') ? formData.siteUrl : `https://${formData.siteUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    showToast('URL da loja copiada para a área de transferência!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyEnv = () => {
    const envContent = `VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-supabase-anon-key`;
    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    showToast('Variáveis de ambiente Vercel copiadas!');
    setTimeout(() => setCopiedEnv(false), 2000);
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
            CONFIGURAÇÕES GERAIS, TAXA DE ENTREGA & BANCO DE DADOS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Defina o canal do WhatsApp oficial, frases institucionais, taxa fixa de entrega, integração Supabase PostgreSQL e Vercel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* SECTION: VERCEL DOMAIN & SUPABASE POSTGRESQL STATUS BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Vercel & Store Domain Config */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-tech flex items-center gap-2">
                    <span>DOMÍNIO DA VERCEL & URL DA LOJA</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                      VERCEL READY
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Defina o link do seu site na Vercel ou domínio próprio (.com.br) para pedidos e links do WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  URL Principal da Loja (Vercel ou Domínio Próprio) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={formData.siteUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange('siteUrl', val);
                        try {
                          const clean = val.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                          handleChange('vercelDomain', clean);
                        } catch {}
                      }}
                      placeholder="https://peptideimports.vercel.app ou https://seusite.com.br"
                      className="w-full pl-3.5 pr-4 py-2.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shrink-0"
                    title="Copiar URL"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUrl ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <a
                    href={formData.siteUrl.startsWith('http') ? formData.siteUrl : `https://${formData.siteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/30 transition-colors shrink-0"
                    title="Abrir site em nova aba"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir</span>
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Este link será anexado automaticamente às mensagens de WhatsApp geradas no fechamento de pedidos e comprovantes.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome do Domínio (Host)
                </label>
                <input
                  type="text"
                  value={formData.vercelDomain}
                  onChange={(e) => handleChange('vercelDomain', e.target.value)}
                  placeholder="Ex: peptideimports.vercel.app"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span>Variáveis de Ambiente na Vercel:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEnv}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEnv ? 'Copiado!' : 'Copiar Env'}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1">
                  <div>VITE_SUPABASE_URL = https://&lt;seu-id&gt;.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY = &lt;sua-chave-anon&gt;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Supabase Database Connection Status & Config */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-tech flex items-center gap-2">
                    <span>BANCO DE DADOS SUPABASE</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      POSTGRESQL
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Integração em tempo real e persistência automática
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isSupabaseConfigured() ? 'SUPABASE CONFIGURADO' : 'AGUARDANDO CHAVES'}
              </span>
            </div>

            {/* Supabase Credentials Inputs */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>Credenciais de Conexão Supabase</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Testando...' : 'Testar Conexão'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
                    VITE_SUPABASE_URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
                    VITE_SUPABASE_ANON_KEY
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKeyInput}
                    onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSaveSupabaseCredentials}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Salvar Chaves no Navegador</span>
                </button>
                {connectionStatus && (
                  <span className={`text-[10px] font-semibold ${connectionStatus.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {connectionStatus.success ? '✓ Conectado ao Supabase!' : '✗ Verifique credenciais ou tabelas'}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tabelas Sincronizadas no Supabase:</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {[
                    { name: 'products', label: 'Catálogo de Produtos' },
                    { name: 'orders', label: 'Pedidos & WhatsApp' },
                    { name: 'coupons', label: 'Cupons de Desconto' },
                    { name: 'employees', label: 'Equipe & Permissões' },
                    { name: 'financial_transactions', label: 'Livro Caixa ERP' },
                    { name: 'store_settings', label: 'Configurações da Loja' },
                  ].map((table) => (
                    <div key={table.name} className="px-2 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 flex items-center justify-between text-slate-300 font-mono text-[10px]">
                      <span className="text-cyan-300">{table.name}</span>
                      <span className="text-emerald-400 text-[9px] font-sans font-semibold">Auto-Sync</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Script de Criação de Tabelas (SQL):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSqlModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>Ver Código SQL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fetch('/src/db/supabase-schema.sql')
                          .then((res) => res.text())
                          .then((sql) => {
                            navigator.clipboard.writeText(sql);
                            setCopiedSql(true);
                            showToast('Script SQL completo copiado! Cole no SQL Editor do Supabase.');
                            setTimeout(() => setCopiedSql(false), 2500);
                          })
                          .catch(() => {
                            showToast('Arquivo /src/db/supabase-schema.sql pronto no repositório.');
                          });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSql ? 'SQL Copiado!' : 'Copiar Script'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Abra o <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">SQL Editor do Supabase</a> e execute o script para criar todas as 6 tabelas com RLS e dados iniciais com 1 clique.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Integração bidirecional com fallback e sincronização em tempo real.</span>
              </div>
            </div>
          </div>

        </div>

        {/* SECTION: DATABASE BACKUP & RESTORE BANNER */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 border border-cyan-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-tech flex items-center gap-2">
                  <span>BACKUP GERAL & IMPLANTAÇÃO DE DADOS (PRODUTOS & PEDIDOS)</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                    FIRESTORE & SUPABASE
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Salve todos os {products.length} produtos e {orders.length} pedidos em arquivo .JSON de segurança ou importe backups para restaurar e implantar no banco.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setBackupModalTab('export');
                  setShowBackupModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Fazer Backup Agora (.JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBackupModalTab('import');
                  setShowBackupModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Importar & Restaurar Banco</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Catálogo de Produtos:</span>
              <strong className="text-cyan-300 font-mono">{products.length} itens ativos</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Histórico de Pedidos:</span>
              <strong className="text-emerald-300 font-mono">{orders.length} pedidos reais</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Persistência Cloud:</span>
              <strong className="text-emerald-400 font-mono">100% Sincronizado</strong>
            </div>
          </div>
        </div>
        
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

            {/* Store Status & Cashier Closure / Suspension */}
            <div className={`border rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
              formData.purchasesSuspended
                ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-rose-950/30 border-amber-500/50 shadow-amber-500/5'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    formData.purchasesSuspended
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {formData.purchasesSuspended ? <Lock className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-tech flex items-center gap-2">
                      <span>STATUS DAS COMPRAS & CAIXA</span>
                      {formData.purchasesSuspended ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          COMPRAS SUSPENSAS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          LOJA ABERTA
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Suspenda temporariamente novas compras no site exibindo aviso de fechamento de caixa.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div className="flex items-center gap-2">
                  {!isMasterAdmin && (
                    <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      Exclusivo ADM Master
                    </span>
                  )}
                  <label className={`relative inline-flex items-center ${isMasterAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                    <input
                      type="checkbox"
                      disabled={!isMasterAdmin}
                      checked={formData.purchasesSuspended}
                      onChange={(e) => {
                        if (!isMasterAdmin) return;
                        handleChange('purchasesSuspended', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {formData.purchasesSuspended && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Compras suspensas no site ativo!</p>
                      <p className="text-[11px] text-amber-300/90 mt-0.5">
                        Os botões de adicionar ao carrinho e checkout foram bloqueados temporariamente e a faixa de aviso está visível para os visitantes.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Título do Aviso (Exibido no Topo)</label>
                      <input
                        type="text"
                        value={formData.suspensionTitle}
                        onChange={(e) => handleChange('suspensionTitle', e.target.value)}
                        placeholder="Ex: Estamos Fechando o Caixa"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Mensagem aos Clientes *</label>
                      <textarea
                        rows={2}
                        value={formData.suspensionMessage}
                        onChange={(e) => handleChange('suspensionMessage', e.target.value)}
                        placeholder="Ex: Estamos fechando o caixa no momento. As compras estão temporariamente suspensas e voltaremos em breve!"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Previsão de Retorno (Opcional)</label>
                      <input
                        type="text"
                        value={formData.suspensionEstimatedReturn}
                        onChange={(e) => handleChange('suspensionEstimatedReturn', e.target.value)}
                        placeholder="Ex: Voltaremos em breve com atendimento normal"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}
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
            <span>Sincronização em tempo real ativa. Todas as alterações são salvas automaticamente no banco de dados.</span>
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
                <ShieldCheck className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* SQL Script Viewer Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-tech">
                    SCRIPT SQL DE CRIAÇÃO DO BANCO SUPABASE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Copie e cole este script no <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-cyan-400 underline">SQL Editor do Supabase</a>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps Guide */}
            <div className="px-5 py-3 bg-cyan-950/20 border-b border-cyan-900/40 text-xs text-slate-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">1</span>
                <span>Acesse o <strong>SQL Editor</strong> do seu projeto Supabase</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">2</span>
                <span>Cole o código abaixo e clique em <strong>Run</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">3</span>
                <span>Pronto! 6 tabelas + Realtime + RLS ativos</span>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-5 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 select-all space-y-1">
              <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed font-mono">
{`-- ==============================================================================
-- PEPTIDE IMPORTS FARMA - SCHEMA COMPLETO DO BANCO DE DADOS SUPABASE (POSTGRESQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 0,
  cap_color TEXT NOT NULL DEFAULT '#06b6d4',
  purity TEXT NOT NULL DEFAULT '99.4% HPLC',
  storage TEXT NOT NULL DEFAULT '2°C a 8°C (Refrigerado)',
  reconstitution TEXT NOT NULL DEFAULT 'Água bacteriostática (2ml a 3ml)',
  image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_promotion BOOLEAN NOT NULL DEFAULT false,
  promotion_discount NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer JSONB NOT NULL,
  address JSONB NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  payment_method TEXT NOT NULL DEFAULT 'WhatsApp / PIX',
  tracking_code TEXT,
  cleared_manually_at TIMESTAMPTZ,
  cleared_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA DE CUPONS DE DESCONTO
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'PERCENTAGE',
  value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Ativo',
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_usage INTEGER,
  expires_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'Atendente de Vendas',
  status TEXT NOT NULL DEFAULT 'Ativo',
  permissions JSONB NOT NULL DEFAULT '{"canManageProducts": true, "canManageOrders": true, "canManageFinances": false, "canManageStaff": false, "canManageSettings": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABELA DE TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABELA DE CONFIGURAÇÕES DA LOJA
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'config',
  store_name TEXT NOT NULL DEFAULT 'PEPTIDE IMPORTS FARMA',
  whatsapp_number TEXT NOT NULL DEFAULT '5511993456789',
  whatsapp_display TEXT NOT NULL DEFAULT '(11) 99345-6789',
  support_email TEXT NOT NULL DEFAULT 'contato@peptideimports.com.br',
  hero_badge TEXT NOT NULL DEFAULT 'PEPTÍDEOS IMPORTADOS COM LAUDO HPLC',
  hero_title TEXT NOT NULL DEFAULT 'PEPTÍDEOS',
  hero_subtitle TEXT NOT NULL DEFAULT 'IMPORTADOS',
  hero_tagline TEXT DEFAULT 'QUALIDADE • CONFIANÇA • RESULTADOS',
  hero_description TEXT DEFAULT 'Mais performance, saúde e bem-estar para a sua melhor versão.',
  announcement_bar TEXT NOT NULL DEFAULT 'Envio Imediato com Cadeia Fria para Todo o Brasil | Cupom PEPTIDE10 para 10% OFF',
  checkout_notice TEXT NOT NULL DEFAULT 'Finalize sua compra e envie o resumo detalhado direto para nosso WhatsApp oficial para liberação imediata!',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_address TEXT NOT NULL DEFAULT 'Av. Paulista, 1842 - Conjunto 114, Bela Vista, São Paulo - SP',
  pickup_estimated_time TEXT NOT NULL DEFAULT 'Pronto em 2 horas úteis',
  coupons_enabled BOOLEAN NOT NULL DEFAULT true,
  site_url TEXT DEFAULT 'https://peptideimports.vercel.app',
  vercel_domain TEXT DEFAULT 'peptideimports.vercel.app',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HABILITAR RLS E ACESSO
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access financial_transactions" ON public.financial_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400">Arquivo completo disponível em <code>src/db/supabase-schema.sql</code></span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetch('/src/db/supabase-schema.sql')
                      .then((res) => res.text())
                      .then((sql) => {
                        navigator.clipboard.writeText(sql);
                        setCopiedSql(true);
                        showToast('Script SQL copiado com sucesso!');
                        setTimeout(() => setCopiedSql(false), 2000);
                      })
                      .catch(() => {
                        showToast('Erro ao ler arquivo SQL');
                      });
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Copiado para Área de Transferência!' : 'Copiar Script SQL Completo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Backup & Restore Modal */}
      <DatabaseBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        defaultTab={backupModalTab}
      />
    </div>
  );
};
