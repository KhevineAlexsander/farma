import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Syringe,
  Droplets,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  Share2,
  Copy,
  Printer,
  ChevronDown,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  HelpCircle,
  Dna,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  Trash2,
  ArrowLeft,
  Lock,
  User,
  Mail,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, SavedDoseProtocol } from '../../types';
import { PeptideVial } from '../PeptideVial';

interface PresetDoseOption {
  label: string;
  doseMcgOrMg: number;
  unit: 'mcg' | 'mg' | 'UI';
  description: string;
}

// Preset recommended protocols based on the store's products
const PRODUCT_DOSING_PRESETS: Record<string, { defaultWaterMl: number; defaultDoseValue: number; defaultUnit: 'mcg' | 'mg' | 'UI'; presets: PresetDoseOption[] }> = {
  'prod-tirzepatida-60': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 2.5,
    defaultUnit: 'mg',
    presets: [
      { label: 'Iniciação (Semanas 1 a 4)', doseMcgOrMg: 2.5, unit: 'mg', description: 'Dose padrão de adaptação gástrica (1x/semana)' },
      { label: 'Intermediária (Semanas 5 a 8)', doseMcgOrMg: 5.0, unit: 'mg', description: 'Titulação com aceleração metabólica (1x/semana)' },
      { label: 'Avançada / Manutenção', doseMcgOrMg: 7.5, unit: 'mg', description: 'Potência máxima e controle glicêmico (1x/semana)' },
    ],
  },
  'prod-tirzepatida-100': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 5.0,
    defaultUnit: 'mg',
    presets: [
      { label: 'Dose Intermediária', doseMcgOrMg: 5.0, unit: 'mg', description: '5 mg por semana' },
      { label: 'Dose Alta', doseMcgOrMg: 7.5, unit: 'mg', description: '7.5 mg por semana' },
      { label: 'Dose Máxima', doseMcgOrMg: 10.0, unit: 'mg', description: '10 mg por semana para longo prazo' },
    ],
  },
  'prod-retratutide-30': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 1.0,
    defaultUnit: 'mg',
    presets: [
      { label: 'Iniciação (Semanas 1 a 4)', doseMcgOrMg: 0.5, unit: 'mg', description: '500 mcg (0.5mg) / semana para rápida adaptação' },
      { label: 'Intermediária (Semanas 5 a 8)', doseMcgOrMg: 1.0, unit: 'mg', description: '1.0 mg / semana (forte termogênese)' },
      { label: 'Avançada (Semanas 9+)', doseMcgOrMg: 2.0, unit: 'mg', description: '2.0 mg / semana (queima acelerada)' },
    ],
  },
  'prod-retratutide-60': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 2.0,
    defaultUnit: 'mg',
    presets: [
      { label: 'Dose Padrão', doseMcgOrMg: 2.0, unit: 'mg', description: '2.0 mg por semana' },
      { label: 'Dose Elevada', doseMcgOrMg: 4.0, unit: 'mg', description: '4.0 mg por semana dividida em 1 ou 2 aplicações' },
    ],
  },
  'prod-bpc-tb-500-10': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 250,
    defaultUnit: 'mcg',
    presets: [
      { label: 'Manutenção Articular', doseMcgOrMg: 250, unit: 'mcg', description: '250 mcg 1x ao dia (proteção e leve inflamação)' },
      { label: 'Tratamento de Lesão Aguda', doseMcgOrMg: 500, unit: 'mcg', description: '500 mcg 1x ao dia ou 250 mcg 2x ao dia' },
      { label: 'Pós-Cirúrgico / Tendinite Forte', doseMcgOrMg: 750, unit: 'mcg', description: '750 mcg fracionado para rápida cicatrização' },
    ],
  },
  'prod-ghk-cu-100': {
    defaultWaterMl: 2.5,
    defaultDoseValue: 2.0,
    defaultUnit: 'mg',
    presets: [
      { label: 'Estética Cutânea Diária', doseMcgOrMg: 1.5, unit: 'mg', description: '1.5 mg SubQ à noite (estímulo de colágeno)' },
      { label: 'Protocolo Intensivo Anti-Aging', doseMcgOrMg: 2.5, unit: 'mg', description: '2.5 mg SubQ diário por 30 dias' },
    ],
  },
  'prod-cjc-ipamorelin-10': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 200,
    defaultUnit: 'mcg',
    presets: [
      { label: 'Dose Noturna Padrão', doseMcgOrMg: 200, unit: 'mcg', description: '200 mcg antes de deitar em estômago vazio' },
      { label: 'Atletas / Hipertrofia', doseMcgOrMg: 300, unit: 'mcg', description: '300 mcg à noite (pico potente de GH)' },
    ],
  },
  'prod-semax-10-cat': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 500,
    defaultUnit: 'mcg',
    presets: [
      { label: 'Foco Diário de Trabalho', doseMcgOrMg: 300, unit: 'mcg', description: '300 mcg pela manhã' },
      { label: 'Alta Performance Cognitiva', doseMcgOrMg: 600, unit: 'mcg', description: '600 mcg pela manhã antes de tarefas complexas' },
    ],
  },
  'prod-selank-5-cat': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 250,
    defaultUnit: 'mcg',
    presets: [
      { label: 'Controle de Ansiedade', doseMcgOrMg: 250, unit: 'mcg', description: '250 mcg 1 a 2x ao dia' },
      { label: 'Pico de Estresse', doseMcgOrMg: 500, unit: 'mcg', description: '500 mcg sob demanda' },
    ],
  },
  'prod-dsip-10': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 100,
    defaultUnit: 'mcg',
    presets: [
      { label: 'Indução do Sono Delta', doseMcgOrMg: 100, unit: 'mcg', description: '100 mcg 30 minutos antes de dormir' },
      { label: 'Insônia Crônica / Jetlag', doseMcgOrMg: 200, unit: 'mcg', description: '200 mcg antes de dormir' },
    ],
  },
  'prod-nad-1000': {
    defaultWaterMl: 5.0,
    defaultDoseValue: 50,
    defaultUnit: 'mg',
    presets: [
      { label: 'Energia Celular SubQ', doseMcgOrMg: 50, unit: 'mg', description: '50 mg 2 a 3x por semana pela manhã' },
      { label: 'Biohacking Avançado', doseMcgOrMg: 100, unit: 'mg', description: '100 mg 2x por semana' },
    ],
  },
  'prod-botox-allergan-100': {
    defaultWaterMl: 2.5,
    defaultDoseValue: 4,
    defaultUnit: 'UI',
    presets: [
      { label: 'Ponto Facial Padrão (0,1ml)', doseMcgOrMg: 4, unit: 'UI', description: '4 UI por ponto de 0.1ml (com 2.5ml de diluente)' },
      { label: 'Micro-ponto Estético (0,05ml)', doseMcgOrMg: 2, unit: 'UI', description: '2 UI por ponto delicado' },
    ],
  },
};

export const DosageCalculatorPage: React.FC = () => {
  const {
    products,
    selectedCalculatorProduct,
    setSelectedCalculatorProduct,
    setCurrentView,
    currentUser,
    loginWithGoogle,
    loginClientWithEmail,
    registerClientAccount,
    saveDoseProtocol,
    deleteDoseProtocol,
    setIsAuthOpen,
    addToCart,
    showToast,
  } = useApp();

  // Auth gate state if not logged in
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSavingProtocol, setIsSavingProtocol] = useState(false);
  const [isSavedListOpen, setIsSavedListOpen] = useState(false);

  // Selected product from the catalog (or null for manual custom)
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return selectedCalculatorProduct?.id || 'prod-tirzepatida-60';
  });

  // Current active product
  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // If selectedCalculatorProduct changes from outside, sync
  useEffect(() => {
    if (selectedCalculatorProduct) {
      setSelectedProductId(selectedCalculatorProduct.id);
    }
  }, [selectedCalculatorProduct]);

  // Form Inputs
  const [customName, setCustomName] = useState<string>('Peptídeo de Pesquisa');
  const [vialQuantityMg, setVialQuantityMg] = useState<number>(60);
  const [waterVolumeMl, setWaterVolumeMl] = useState<number>(2.0);
  const [targetDoseValue, setTargetDoseValue] = useState<number>(2.5);
  const [targetDoseUnit, setTargetDoseUnit] = useState<'mcg' | 'mg' | 'UI'>('mg');
  const [syringeType, setSyringeType] = useState<'u100-1ml' | 'u100-0.5ml' | 'u100-0.3ml' | 'u40-1ml' | 'standard-1ml'>('u100-1ml');
  const [frequency, setFrequency] = useState<'daily' | 'eod' | '2x_week' | 'weekly' | '3x_week'>('weekly');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [scheduleWeeks, setScheduleWeeks] = useState<number>(8);
  const [completedDoses, setCompletedDoses] = useState<Record<string, boolean>>({});

  // When changing product, load smart defaults
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);

    if (prod) {
      // Extract mg from dosage string e.g. "60 mg" or "10 mg"
      const match = prod.dosage.match(/([\d.,]+)\s*(mg|UI|U)/i);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        setVialQuantityMg(isNaN(val) ? 10 : val);
      }

      const presetConfig = PRODUCT_DOSING_PRESETS[prod.id];
      if (presetConfig) {
        setWaterVolumeMl(presetConfig.defaultWaterMl);
        setTargetDoseValue(presetConfig.defaultDoseValue);
        setTargetDoseUnit(presetConfig.defaultUnit);
      } else {
        setWaterVolumeMl(2.0);
        setTargetDoseValue(250);
        setTargetDoseUnit('mcg');
      }
    }
  };

  // Convert target dose to equivalent mg
  const targetDoseInMg = useMemo(() => {
    if (targetDoseUnit === 'mcg') {
      return targetDoseValue / 1000;
    }
    if (targetDoseUnit === 'UI') {
      // For Botox / HCG where vial is in UI
      return targetDoseValue;
    }
    return targetDoseValue; // mg
  }, [targetDoseValue, targetDoseUnit]);

  // Mathematical Calculations:
  // 1. Solution concentration
  const concentrationMgPerMl = useMemo(() => {
    if (!waterVolumeMl || waterVolumeMl <= 0) return 0;
    return vialQuantityMg / waterVolumeMl;
  }, [vialQuantityMg, waterVolumeMl]);

  const concentrationMcgPerMl = useMemo(() => {
    return concentrationMgPerMl * 1000;
  }, [concentrationMgPerMl]);

  // 2. Volume to inject in mL
  const volumeToInjectMl = useMemo(() => {
    if (!concentrationMgPerMl || concentrationMgPerMl <= 0) return 0;
    return targetDoseInMg / concentrationMgPerMl;
  }, [targetDoseInMg, concentrationMgPerMl]);

  // 3. Syringe Units (UI)
  const syringeUnits = useMemo(() => {
    if (volumeToInjectMl <= 0) return 0;

    if (syringeType.startsWith('u100')) {
      // U-100: 100 UI = 1.0 ml -> UI = ml * 100
      return Math.round(volumeToInjectMl * 100 * 10) / 10;
    }
    if (syringeType === 'u40-1ml') {
      // U-40: 40 UI = 1.0 ml -> UI = ml * 40
      return Math.round(volumeToInjectMl * 40 * 10) / 10;
    }
    // Standard 1ml decimal syringe
    return Math.round(volumeToInjectMl * 100) / 100;
  }, [volumeToInjectMl, syringeType]);

  // Max units of the selected syringe
  const syringeCapacityUnits = useMemo(() => {
    switch (syringeType) {
      case 'u100-0.3ml': return 30;
      case 'u100-0.5ml': return 50;
      case 'u40-1ml': return 40;
      case 'standard-1ml': return 1.0;
      case 'u100-1ml':
      default: return 100;
    }
  }, [syringeType]);

  // Overfill warning
  const isOverSyringeCapacity = syringeUnits > syringeCapacityUnits;

  // 4. Total doses in vial
  const totalDosesInVial = useMemo(() => {
    if (!targetDoseInMg || targetDoseInMg <= 0) return 0;
    return Math.floor(vialQuantityMg / targetDoseInMg);
  }, [vialQuantityMg, targetDoseInMg]);

  // 5. Cost per dose (if from catalog)
  const costPerDose = useMemo(() => {
    if (!activeProduct || !totalDosesInVial || totalDosesInVial <= 0) return null;
    return activeProduct.price / totalDosesInVial;
  }, [activeProduct, totalDosesInVial]);

  // 6. Supply duration in days
  const daysOfSupply = useMemo(() => {
    if (!totalDosesInVial || totalDosesInVial <= 0) return 0;
    switch (frequency) {
      case 'daily': return totalDosesInVial;
      case 'eod': return totalDosesInVial * 2;
      case '3x_week': return Math.round((totalDosesInVial / 3) * 7);
      case '2x_week': return Math.round((totalDosesInVial / 2) * 7);
      case 'weekly': return totalDosesInVial * 7;
      default: return totalDosesInVial * 7;
    }
  }, [totalDosesInVial, frequency]);

  // Protocol Schedule Generation
  const scheduleRows = useMemo(() => {
    const list: { index: number; dateStr: string; dayName: string; doseText: string; isPast: boolean }[] = [];
    if (!scheduleStartDate || totalDosesInVial <= 0) return list;

    const [y, m, d] = scheduleStartDate.split('-').map(Number);
    let curDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxItems = Math.min(totalDosesInVial, scheduleWeeks * (frequency === 'daily' ? 7 : frequency === 'weekly' ? 1 : 2));

    let doseCount = 0;
    let loopGuard = 0;

    while (doseCount < maxItems && loopGuard < 300) {
      loopGuard++;

      const dayOfWeek = curDate.getDay(); // 0 is Sun, 1 is Mon, etc.
      let isDoseDay = false;

      if (frequency === 'daily') {
        isDoseDay = true;
      } else if (frequency === 'eod') {
        isDoseDay = doseCount === 0 || loopGuard % 2 === 1;
      } else if (frequency === 'weekly') {
        // Same day every week
        isDoseDay = loopGuard === 1 || dayOfWeek === new Date(y, m - 1, d).getDay();
      } else if (frequency === '2x_week') {
        // Monday (1) and Thursday (4) or every 3-4 days
        isDoseDay = dayOfWeek === 1 || dayOfWeek === 4;
      } else if (frequency === '3x_week') {
        // Mon (1), Wed (3), Fri (5)
        isDoseDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      }

      if (isDoseDay) {
        doseCount++;
        const dateFormatted = curDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const weekday = curDate.toLocaleDateString('pt-BR', { weekday: 'short' });
        const isPast = curDate < today;

        list.push({
          index: doseCount,
          dateStr: dateFormatted,
          dayName: weekday.toUpperCase().replace('.', ''),
          doseText: `${targetDoseValue} ${targetDoseUnit} (${syringeUnits} UI)`,
          isPast,
        });
      }

      curDate.setDate(curDate.getDate() + 1);
    }

    return list;
  }, [scheduleStartDate, totalDosesInVial, frequency, scheduleWeeks, targetDoseValue, targetDoseUnit, syringeUnits]);

  // Toggle dose check
  const toggleDose = (idx: number) => {
    setCompletedDoses((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopySchedule = () => {
    const text = scheduleRows
      .map((r) => `Dose #${r.index} | ${r.dateStr} (${r.dayName}) - ${r.doseText} [${completedDoses[r.index] ? 'FEITO' : 'PENDENTE'}]`)
      .join('\n');
    navigator.clipboard.writeText(
      `CRONOGRAMA DE APLICAÇÃO - ${activeProduct?.name || customName}\nConcentração: ${concentrationMgPerMl.toFixed(2)} mg/ml\nVolume: ${volumeToInjectMl.toFixed(3)} ml (${syringeUnits} UI)\n\n` + text
    );
    showToast('Cronograma copiado para a área de transferência!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveCurrentProtocol = async () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setIsSavingProtocol(true);
    try {
      await saveDoseProtocol({
        productId: activeProduct?.id,
        productName: activeProduct?.name || customName,
        dosageLabel: `${targetDoseValue} ${targetDoseUnit}`,
        vialMg: vialQuantityMg,
        waterMl: waterVolumeMl,
        doseValue: targetDoseValue,
        doseUnit: targetDoseUnit,
        syringeUnits: syringeUnits,
        syringeType: syringeType,
        frequency: frequency,
        concentrationMgPerMl: concentrationMgPerMl,
        totalDosesInVial: totalDosesInVial,
        notes: `Reconstituição com ${waterVolumeMl}ml (${concentrationMgPerMl.toFixed(2)} mg/ml). Aspirar ${syringeUnits} ${syringeType === 'standard-1ml' ? 'ml' : 'UI'}.`,
      });
    } finally {
      setIsSavingProtocol(false);
    }
  };

  const handleLoadSavedProtocol = (proto: SavedDoseProtocol) => {
    if (proto.productId) {
      setSelectedProductId(proto.productId);
    }
    setVialQuantityMg(proto.vialMg);
    setWaterVolumeMl(proto.waterMl);
    setTargetDoseValue(proto.doseValue);
    setTargetDoseUnit(proto.doseUnit);
    setSyringeType(proto.syringeType as any);
    setFrequency(proto.frequency as any);
    showToast(`Protocolo "${proto.productName}" carregado na calculadora!`);
  };

  // If user is not logged in, enforce authentication requirement gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070A10] py-16 px-4 sm:px-6 lg:px-8 text-white flex items-center justify-center pb-24">
        <div className="max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-md">
          <button
            onClick={() => setCurrentView('store')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para a Loja</span>
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-md">
              <Syringe className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-tech">
              ACESSO EXCLUSIVO À CALCULADORA
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Faça login ou crie seu cadastro gratuito para calcular reconstituições, visualizar marcações na seringa milimétrica e salvar seus protocolos personalizados no seu perfil.
            </p>
          </div>

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={async () => {
              setAuthLoading(true);
              setAuthError(null);
              try {
                const res = await loginWithGoogle();
                if (!res.success) {
                  setAuthError(res.message || 'Falha na autenticação Google');
                }
              } finally {
                setAuthLoading(false);
              }
            }}
            disabled={authLoading}
            className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{authLoading ? 'Conectando...' : 'Entrar com Conta Google'}</span>
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-slate-800" />
            <span className="px-3 text-[11px] text-slate-500 font-medium">ou com e-mail</span>
            <div className="flex-1 border-t border-slate-800" />
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthError(null);
              if (!authEmail) return;
              setAuthLoading(true);
              try {
                if (authMode === 'register') {
                  const res = await registerClientAccount(authName, authEmail, authPassword, authPhone);
                  if (!res.success) setAuthError(res.message || 'Erro ao criar conta');
                } else {
                  const res = await loginClientWithEmail(authEmail, authPassword);
                  if (!res.success) setAuthError(res.message || 'Erro ao entrar');
                }
              } finally {
                setAuthLoading(false);
              }
            }}
            className="space-y-3 text-xs"
          >
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">E-mail</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Senha</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer mt-2 disabled:opacity-60"
            >
              {authLoading
                ? 'Conectando...'
                : authMode === 'register'
                ? 'CRIAR CONTA E ACESSAR CALCULADORA'
                : 'ENTRAR E ACESSAR CALCULADORA'}
            </button>
          </form>

          <div className="pt-4 text-center text-xs text-slate-400">
            {authMode === 'register' ? (
              <p>
                Já possui conta?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-cyan-400 font-bold hover:underline ml-1"
                >
                  Fazer Login
                </button>
              </p>
            ) : (
              <p>
                Novo usuário?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-cyan-400 font-bold hover:underline ml-1"
                >
                  Criar conta grátis
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 pb-28">
      {/* Top Header */}
      <section className="relative overflow-hidden pt-12 pb-12 border-b border-slate-800/80 bg-gradient-to-b from-blue-950/30 via-[#0B0F17] to-[#070A10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculadora Farmacêutica de Precisão</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Cálculo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">Doses & Reconstituição</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Determine com rigor milimétrico quantas Unidades (UI) aspirar na seringa, a concentração final em mg/ml e gere um cronograma completo de aplicações.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  setCurrentView('benefits');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ver Guia de Benefícios</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('diet-control');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Controle de Dieta & Macros</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Work Area: 2-Column Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Saved Protocols from User Profile */}
        {currentUser?.savedDoseProtocols && currentUser.savedDoseProtocols.length > 0 && (
          <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                <span>Seus Protocolos Salvos na Nuvem ({currentUser.savedDoseProtocols.length})</span>
              </div>
              <span className="text-[11px] text-slate-400">Clique para carregar na calculadora</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentUser.savedDoseProtocols.map((proto) => (
                <div
                  key={proto.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between gap-3 group transition-all"
                >
                  <div
                    onClick={() => handleLoadSavedProtocol(proto)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {proto.productName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {proto.doseValue} {proto.doseUnit} • <span className="text-cyan-400 font-semibold">{proto.syringeUnits} UI</span> ({proto.frequency})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDoseProtocol(proto.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remover protocolo salvo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (Inputs & Product Selector): 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Step 1: Select Peptides from Catalog */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Selecione o Peptídeo do Catálogo
                  </h3>
                </div>
                {activeProduct && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Estoque: {activeProduct.stock} frascos
                  </span>
                )}
              </div>

              {/* Product Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Escolha o produto ou selecione personalizado:
                </label>
                <div className="relative">
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none appearance-none pr-10 cursor-pointer"
                  >
                    <optgroup label="Emagrecimento & Metabolismo">
                      <option value="prod-tirzepatida-60">Tirzepatida 60 mg (Duplo agonista GIP/GLP-1)</option>
                      <option value="prod-tirzepatida-100">Tirzepatida 100 mg (Apresentação concentrada)</option>
                      <option value="prod-retratutide-30">Retratutide 30 mg (Triplo agonista GLP-1/GIP/Glucagon)</option>
                      <option value="prod-retratutide-60">Retratutide 60 mg (Triplo agonista alta dose)</option>
                      <option value="prod-cagrilintide-10">Cagrilintide 10 mg (Análogo de amilina)</option>
                      <option value="prod-aod-9604-5">AOD-9604 5 mg (Fragmento lipolítico de GH)</option>
                      <option value="prod-slu-pp-322-5">SLU-PP-322 5 mg (Mimético de exercício)</option>
                    </optgroup>

                    <optgroup label="Recuperação, Desempenho & GH">
                      <option value="prod-bpc-tb-500-10">BPC-157 + TB-500 10 mg (Regeneração de tecidos e tendões)</option>
                      <option value="prod-cjc-ipamorelin-10">CJC-1295 + Ipamorelin 10 mg (Combo secretagogo de GH)</option>
                      <option value="prod-ipamorelin-10">Ipamorelin 10 mg (Secretagogo limpo de GH)</option>
                      <option value="prod-tesamorelin-10-cat">Tesamorelin 10 mg (Gordura visceral profunda)</option>
                      <option value="prod-hcg-5000">HCG 5.000 UI (Gonadotrofina coriônica humana)</option>
                    </optgroup>

                    <optgroup label="Estética & Beleza">
                      <option value="prod-botox-allergan-100">BOTOX ALLERGAN 100 U (Toxina botulínica tipo A)</option>
                      <option value="prod-ghk-cu-100">GHK-Cu 100 mg (Tripeptídeo de cobre - colágeno e pele)</option>
                      <option value="prod-melanotan-ii-10">Melanotan II 10 mg (Bronzeamento e melanogênese)</option>
                      <option value="prod-pt-141-10">PT-141 10 mg (Bremelanotide - libido e vigor)</option>
                    </optgroup>

                    <optgroup label="Longevidade & Biohacking">
                      <option value="prod-nad-1000">NAD+ 1000 mg (Coenzima da longevidade celular)</option>
                      <option value="prod-epithalon-10-cat">Epithalon 10 mg (Ativador de telomerase)</option>
                      <option value="prod-ss-31-10">SS-31 10 mg (Proteção e ATP mitocondrial)</option>
                    </optgroup>

                    <optgroup label="Cognição & Imunidade">
                      <option value="prod-semax-10-cat">Semax 10 mg (BDNF, foco e neuroproteção)</option>
                      <option value="prod-selank-5-cat">Selank 5 mg (Ansiolítico sem sedação)</option>
                      <option value="prod-dsip-10">DSIP 10 mg (Indutor do sono delta)</option>
                      <option value="prod-kpv-10">KPV 10 mg (Reparo intestinal e anti-inflamatório)</option>
                      <option value="prod-vip-10">VIP 10 mg (Imunorregulação neuroendócrina)</option>
                    </optgroup>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Active Product Mini Card */}
              {activeProduct && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-14 bg-slate-900 rounded-lg flex items-center justify-center p-1 shrink-0 border border-slate-800">
                      <PeptideVial
                        capColor={activeProduct.capColor}
                        name={activeProduct.name}
                        dosage={activeProduct.dosage}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-bold text-xs sm:text-sm truncate">
                        {activeProduct.name} - {activeProduct.dosage}
                      </div>
                      <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {activeProduct.purity}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400">Preço do Frasco</div>
                    <div className="text-sm font-black text-emerald-400">
                      R$ {activeProduct.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Step 2: Reconstitution Volume & Vial Quantity */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  Dados de Diluição & Reconstituição
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vial quantity mg */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Quantidade de Princípio Ativo no Frasco:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={vialQuantityMg}
                      onChange={(e) => setVialQuantityMg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {targetDoseUnit === 'UI' ? 'UI' : 'mg'}
                    </span>
                  </div>
                </div>

                {/* Diluent added (ml) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Água Bacteriostática Adicionada:</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{waterVolumeMl} mL</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="20"
                      value={waterVolumeMl}
                      onChange={(e) => setWaterVolumeMl(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      mL
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Diluent Presets */}
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-slate-400 text-[11px]">Atalhos de Diluição:</span>
                {[1.0, 2.0, 2.5, 3.0, 5.0].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWaterVolumeMl(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      waterVolumeMl === v
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {v} ml
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Step 3: Desired Target Dose & Clinical Presets */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Dose Alvo Desejada por Aplicação
                  </h3>
                </div>

                {/* Unit Switcher */}
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['mcg', 'mg', 'UI'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setTargetDoseUnit(u)}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-colors ${
                        targetDoseUnit === u
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Dose Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Quantidade da Dose:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={targetDoseValue}
                      onChange={(e) => setTargetDoseValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-base text-cyan-400 font-black focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {targetDoseUnit}
                    </span>
                  </div>
                </div>

                {/* Frequency selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Frequência das Aplicações:
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="weekly">1 vez por semana (ex: Tirzepatida / Retratutide)</option>
                    <option value="2x_week">2 vezes por semana (ex: Seg e Qui)</option>
                    <option value="3x_week">3 vezes por semana (ex: Seg / Qua / Sex)</option>
                    <option value="daily">Diariamente (1x ao dia - ex: BPC-157 / Semax)</option>
                    <option value="eod">Dias alternados (Dia sim, dia não)</option>
                  </select>
                </div>
              </div>

              {/* Protocol Presets for Selected Product */}
              {PRODUCT_DOSING_PRESETS[selectedProductId] && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Protocolos Clínicos Sugeridos para este Peptídeo:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRODUCT_DOSING_PRESETS[selectedProductId].presets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTargetDoseValue(preset.doseMcgOrMg);
                          setTargetDoseUnit(preset.unit);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          targetDoseValue === preset.doseMcgOrMg && targetDoseUnit === preset.unit
                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-cyan-300 truncate">
                          {preset.label}
                        </div>
                        <div className="text-sm font-black text-white">
                          {preset.doseMcgOrMg} {preset.unit}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Step 4: Syringe Selector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  Tipo de Seringa Utilizada
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { id: 'u100-1ml', title: 'Seringa U-100 (1.0 ml)', subtitle: '100 UI = 1.0 ml (Padrão mais comum)', max: '100 UI' },
                  { id: 'u100-0.5ml', title: 'Seringa U-100 (0.5 ml)', subtitle: '50 UI = 0.5 ml (Ótima para médias doses)', max: '50 UI' },
                  { id: 'u100-0.3ml', title: 'Seringa U-100 (0.3 ml)', subtitle: '30 UI = 0.3 ml (Máxima precisão)', max: '30 UI' },
                  { id: 'u40-1ml', title: 'Seringa U-40 (1.0 ml)', subtitle: '40 UI = 1.0 ml (Graduação veterinária)', max: '40 UI' },
                  { id: 'standard-1ml', title: 'Seringa Comum (1.0 ml)', subtitle: 'Leitura direta em centésimos de mL', max: '1.0 ml' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSyringeType(s.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      syringeType === s.id
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">{s.title}</div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{s.max}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{s.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Visual Syringe & Calculation Results): 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* The Main Result Card */}
            <div className="bg-gradient-to-b from-slate-900 to-[#0B0F17] border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    Resultado Farmacotécnico
                  </div>
                  <h2 className="text-lg font-black text-white">Marcação Exata na Seringa</h2>
                </div>
                <Syringe className="w-6 h-6 text-cyan-400" />
              </div>

              {/* Big Highlight: Syringe Units */}
              <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-5 text-center relative shadow-inner">
                {isOverSyringeCapacity ? (
                  <div className="space-y-2">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-base font-bold text-amber-300">
                      Volume excede a seringa selecionada!
                    </div>
                    <div className="text-xs text-slate-400">
                      Você precisa de <strong>{syringeUnits} UI</strong>, mas sua seringa comporta no máximo{' '}
                      <strong>{syringeCapacityUnits} UI</strong>. Reduza o diluente ou divida a aplicação.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Aspirar exatamente até:
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 tracking-tight">
                      {syringeUnits} <span className="text-2xl font-bold text-cyan-300">{syringeType === 'standard-1ml' ? 'ml' : 'UI'}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-300 mt-2">
                      Volume correspondente: <strong className="text-cyan-400">{volumeToInjectMl.toFixed(3)} mL</strong>
                    </div>
                  </>
                )}
              </div>

              {/* Real-time Interactive Syringe Graphic */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Visualizador da Seringa Graduada</span>
                  <span className="text-[11px] text-cyan-400 font-mono font-bold">
                    {syringeType.toUpperCase()}
                  </span>
                </div>

                {/* Syringe SVG Graphic */}
                <div className="relative py-3">
                  <svg
                    viewBox="0 0 400 90"
                    className="w-full h-auto drop-shadow-md select-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="syringeGlass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                      </linearGradient>

                      <linearGradient id="peptideLiquid" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
                      </linearGradient>

                      <linearGradient id="rubberPlunger" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="50%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#334155" />
                      </linearGradient>
                    </defs>

                    {/* Needle (Left) */}
                    <line x1="20" y1="45" x2="60" y2="45" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Needle hub */}
                    <polygon points="60,37 72,40 72,50 60,53" fill="#0284c7" />

                    {/* Syringe Barrel (Glass tube) */}
                    <rect x="72" y="24" width="280" height="42" rx="4" fill="url(#syringeGlass)" stroke="#64748b" strokeWidth="1.5" />

                    {/* Syringe Flange (Finger grip right) */}
                    <rect x="350" y="14" width="6" height="62" rx="3" fill="#475569" stroke="#64748b" strokeWidth="1" />

                    {/* Liquid fill based on fraction of capacity (max width = 270) */}
                    {(() => {
                      const fillFraction = Math.min(Math.max(syringeUnits / (syringeCapacityUnits || 1), 0), 1);
                      const liquidWidth = fillFraction * 270;
                      const plungerX = 74 + liquidWidth;

                      return (
                        <>
                          {/* Liquid rect */}
                          <rect
                            x="74"
                            y="26"
                            width={liquidWidth}
                            height="38"
                            fill="url(#peptideLiquid)"
                            className="transition-all duration-300"
                          />

                          {/* Plunger Rubber Stopper */}
                          <rect
                            x={plungerX}
                            y="25"
                            width="14"
                            height="40"
                            rx="2"
                            fill="url(#rubberPlunger)"
                            stroke="#0f172a"
                            strokeWidth="1"
                            className="transition-all duration-300"
                          />
                          {/* Plunger rod extending to the right */}
                          <rect
                            x={plungerX + 14}
                            y="41"
                            width={Math.max(380 - (plungerX + 14), 20)}
                            height="8"
                            fill="#64748b"
                            className="transition-all duration-300"
                          />
                          {/* Plunger thumb press flange */}
                          <rect
                            x={Math.max(plungerX + 14 + 50, 385)}
                            y="32"
                            width="6"
                            height="26"
                            rx="2"
                            fill="#475569"
                            className="transition-all duration-300"
                          />

                          {/* Dynamic Indicator Arrow pointing to the calculated line */}
                          <g transform={`translate(${plungerX}, 18)`}>
                            <polygon points="0,0 -4,-7 4,-7" fill="#38bdf8" />
                          </g>
                        </>
                      );
                    })()}

                    {/* Graduation Ticks (0, 10, 20 ... 100) */}
                    {Array.from({ length: 11 }).map((_, i) => {
                      const tickX = 74 + (i / 10) * 270;
                      const val = Math.round((i / 10) * syringeCapacityUnits);
                      return (
                        <g key={i}>
                          <line x1={tickX} y1="24" x2={tickX} y2="34" stroke="#e2e8f0" strokeWidth="1.2" />
                          <line x1={tickX} y1="56" x2={tickX} y2="66" stroke="#e2e8f0" strokeWidth="1.2" />
                          <text
                            x={tickX}
                            y="20"
                            fontSize="8"
                            fill="#94a3b8"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Minor Sub-ticks */}
                    {Array.from({ length: 50 }).map((_, i) => {
                      if (i % 5 === 0) return null;
                      const tickX = 74 + (i / 50) * 270;
                      return (
                        <line
                          key={`sub-${i}`}
                          x1={tickX}
                          y1="24"
                          x2={tickX}
                          y2="29"
                          stroke="#cbd5e1"
                          strokeWidth="0.8"
                          strokeOpacity="0.7"
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="text-[11px] text-center text-slate-400 bg-slate-900/60 py-1.5 px-3 rounded-xl border border-slate-800">
                  A ponta do êmbolo de borracha deve alinhar perfeitamente com a marca{' '}
                  <strong className="text-cyan-400">{syringeUnits} {syringeType === 'standard-1ml' ? 'ml' : 'UI'}</strong>.
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Concentração da Solução
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {concentrationMgPerMl.toFixed(2)} mg/mL
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ({Math.round(concentrationMcgPerMl)} mcg/mL)
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Rendimento do Frasco
                  </div>
                  <div className="text-base font-black text-cyan-400 mt-0.5">
                    {totalDosesInVial} doses
                  </div>
                  <div className="text-[10px] text-slate-400">
                    completas por liofilizado
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Durabilidade Estimada
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {daysOfSupply} dias
                  </div>
                  <div className="text-[10px] text-slate-400">
                    na frequência {frequency === 'weekly' ? 'semanal' : frequency === 'daily' ? 'diária' : 'selecionada'}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Custo Médio por Dose
                  </div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {costPerDose ? `R$ ${costPerDose.toFixed(2).replace('.', ',')}` : 'Sob consulta'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    baseado no frasco da loja
                  </div>
                </div>
              </div>

              {/* Actions: Save to Profile & Direct Add to Cart */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSaveCurrentProtocol}
                  disabled={isSavingProtocol}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  <Bookmark className="w-4 h-4 text-cyan-200" />
                  <span>{isSavingProtocol ? 'Salvando Protocolo...' : 'Salvar Protocolo no Meu Perfil'}</span>
                </button>

                {activeProduct && (
                  <button
                    onClick={() => {
                      addToCart(activeProduct, 1);
                      showToast(`${activeProduct.name} adicionado ao seu carrinho!`);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Comprar Frasco de {activeProduct.name} ({activeProduct.dosage})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Scientific Safety Note */}
            <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Normas de Biossegurança & Assepsia</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Utilize sempre álcool 70% na tampa de borracha antes da punção. Não reutilize seringas nem agulhas descartáveis. Mantenha o frasco reconstituído entre 2°C e 8°C protegido da luz solar direta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Schedule Planner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800/80">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Cronograma Personalizado de Aplicações</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Controle de Calendário & Aplicações
              </h2>
            </div>

            {/* Action buttons: Copy & Print */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySchedule}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Schedule Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Data da Primeira Aplicação:
              </label>
              <input
                type="date"
                value={scheduleStartDate}
                onChange={(e) => setScheduleStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Duração do Planejamento:
              </label>
              <select
                value={scheduleWeeks}
                onChange={(e) => setScheduleWeeks(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value={4}>4 Semanas (Ciclo Inicial)</option>
                <option value={8}>8 Semanas (Padrão Completo)</option>
                <option value={12}>12 Semanas (Protocolo Longo)</option>
                <option value={16}>16 Semanas (Manutenção Estendida)</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Progresso das Doses:</span>
                <strong className="text-cyan-400">
                  {Object.values(completedDoses).filter(Boolean).length} de {scheduleRows.length} doses feitas
                </strong>
              </div>
            </div>
          </div>

          {/* Schedule Grid Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold"># Dose</th>
                  <th className="py-3 px-4 font-bold">Data Prevista</th>
                  <th className="py-3 px-4 font-bold">Dia da Semana</th>
                  <th className="py-3 px-4 font-bold">Dose Recomendada</th>
                  <th className="py-3 px-4 font-bold text-right">Anotação / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {scheduleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Configure a data e os valores acima para gerar o cronograma.
                    </td>
                  </tr>
                ) : (
                  scheduleRows.map((row) => {
                    const isDone = Boolean(completedDoses[row.index]);
                    return (
                      <tr
                        key={row.index}
                        onClick={() => toggleDose(row.index)}
                        className={`cursor-pointer transition-colors ${
                          isDone
                            ? 'bg-emerald-950/20 text-emerald-200'
                            : row.isPast
                            ? 'bg-amber-950/10 hover:bg-slate-800/40'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleDose(row.index)}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-bold font-mono text-cyan-400">
                          #{row.index}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">
                          {row.dateStr}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {row.dayName}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-200">
                          {row.doseText}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : row.isPast
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isDone ? 'Concluída' : row.isPast ? 'Em atraso' : 'Agendada'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Step-by-Step Reconstitution Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Procedimento Operacional Padrão (POP)
          </span>
          <h2 className="text-2xl font-black text-white">
            Como Reconstituir seu Peptídeo com Segurança
          </h2>
          <p className="text-slate-400 text-xs">
            Siga os 4 passos farmacotécnicos para preservar 100% da integridade da molécula proteica.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '1',
              title: 'Assepsia Completa',
              desc: 'Retire a tampa flip-off do frasco de peptídeo e da água bacteriostática. Higienize as borrachas com algodão embebido em álcool 70%.',
            },
            {
              step: '2',
              title: 'Aspiração Suave',
              desc: 'Com uma seringa estéril, aspire o volume desejado de água bacteriostática (ex: 2.0 ml) certificando-se de não deixar grandes bolhas de ar.',
            },
            {
              step: '3',
              title: 'Injeção na Parede',
              desc: 'Perfure a borracha e incline o frasco a 45°. Deixe a água escorrer suavemente pelas paredes de vidro. NUNCA lance o jato diretamente no pó.',
            },
            {
              step: '4',
              title: 'Dissolução & Geladeira',
              desc: 'Movimente o frasco em círculos suaves sobre a mesa até dissolver por completo (não chacoalhe). Guarde imediatamente na geladeira de 2°C a 8°C.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 relative"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-sm flex items-center justify-center border border-cyan-500/30">
                {item.step}
              </div>
              <h4 className="text-white font-bold text-sm">{item.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
