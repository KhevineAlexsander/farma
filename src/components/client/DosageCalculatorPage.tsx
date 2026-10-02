import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Search,
  Check,
  RotateCcw,
  Sliders,
  ChevronUp,
  MessageCircle,
  Activity,
  TrendingUp,
  CheckCircle,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, SavedDoseProtocol } from '../../types';
import { PeptideVial } from '../PeptideVial';
import { SyringeVisualizer } from './SyringeVisualizer';
import {
  calculatePeptideDosage,
  CalculatorInput,
  CalculatorResult,
  SyringeType,
  TargetDoseUnit,
  FrequencyType,
  SYRINGE_SPECS,
  FREQUENCY_SPECS,
  suggestAlternativeDiluent,
  calculatePharmacokinetics,
  PharmacokineticsResult,
  PEPTIDE_HALF_LIFE_MAP,
  DoseLogEntry,
  INJECTION_SITES,
} from '../../utils/peptideCalculator';

interface PresetDoseOption {
  label: string;
  doseMcgOrMg: number;
  unit: TargetDoseUnit;
  description: string;
}

// Preset recomendados baseados no catálogo oficial da loja
const PRODUCT_DOSING_PRESETS: Record<
  string,
  {
    defaultWaterMl: number;
    defaultDoseValue: number;
    defaultUnit: TargetDoseUnit;
    presets: PresetDoseOption[];
  }
> = {
  'prod-tirzepatida-60': {
    defaultWaterMl: 3.0,
    defaultDoseValue: 2.5,
    defaultUnit: 'mg',
    presets: [
      { label: 'Iniciação (Semanas 1 a 4)', doseMcgOrMg: 2.5, unit: 'mg', description: 'Adaptação gástrica (1x/semana)' },
      { label: 'Intermediária (Semanas 5 a 8)', doseMcgOrMg: 5.0, unit: 'mg', description: 'Titulação metabólica (1x/semana)' },
      { label: 'Avançada / Manutenção', doseMcgOrMg: 7.5, unit: 'mg', description: 'Potência máxima e controle glicêmico (1x/semana)' },
    ],
  },
  'prod-tirzepatida-100': {
    defaultWaterMl: 3.0,
    defaultDoseValue: 5.0,
    defaultUnit: 'mg',
    presets: [
      { label: 'Dose Intermediária', doseMcgOrMg: 5.0, unit: 'mg', description: '5 mg por semana' },
      { label: 'Dose Alta', doseMcgOrMg: 7.5, unit: 'mg', description: '7.5 mg por semana' },
      { label: 'Dose Máxima', doseMcgOrMg: 10.0, unit: 'mg', description: '10 mg por semana para longo prazo' },
    ],
  },
  'prod-retratutide-30': {
    defaultWaterMl: 3.0,
    defaultDoseValue: 1.0,
    defaultUnit: 'mg',
    presets: [
      { label: 'Iniciação (Semanas 1 a 4)', doseMcgOrMg: 0.5, unit: 'mg', description: '500 mcg (0.5 mg) / semana para adaptação' },
      { label: 'Intermediária (Semanas 5 a 8)', doseMcgOrMg: 1.0, unit: 'mg', description: '1.0 mg / semana (termogênese acelerada)' },
      { label: 'Avançada (Semanas 9+)', doseMcgOrMg: 2.0, unit: 'mg', description: '2.0 mg / semana (queima máxima)' },
    ],
  },
  'prod-retratutide-60': {
    defaultWaterMl: 3.0,
    defaultDoseValue: 2.0,
    defaultUnit: 'mg',
    presets: [
      { label: 'Dose Padrão', doseMcgOrMg: 2.0, unit: 'mg', description: '2.0 mg por semana' },
      { label: 'Dose Elevada', doseMcgOrMg: 4.0, unit: 'mg', description: '4.0 mg por semana dividida em 1 ou 2 aplicações' },
    ],
  },
  'prod-cagrilintide-10': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 0.3,
    defaultUnit: 'mg',
    presets: [
      { label: 'Dose Inicial', doseMcgOrMg: 0.3, unit: 'mg', description: '300 mcg (0.3 mg) 1x por semana' },
      { label: 'Titulação Intermediária', doseMcgOrMg: 0.6, unit: 'mg', description: '600 mcg (0.6 mg) 1x por semana' },
      { label: 'Dose Plena', doseMcgOrMg: 1.2, unit: 'mg', description: '1.2 mg 1x por semana' },
    ],
  },
  'prod-bpc-tb-500-10': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 250,
    defaultUnit: 'mcg',
    presets: [
      { label: 'Manutenção Articular', doseMcgOrMg: 250, unit: 'mcg', description: '250 mcg 1x ao dia (proteção e leve inflamação)' },
      { label: 'Tratamento de Lesão Aguda', doseMcgOrMg: 500, unit: 'mcg', description: '500 mcg 1x ao dia ou 250 mcg 2x ao dia' },
      { label: 'Pós-Cirúrgico / Tendinite', doseMcgOrMg: 750, unit: 'mcg', description: '750 mcg fracionado para cicatrização' },
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
      { label: 'Dose Noturna Padrão', doseMcgOrMg: 200, unit: 'mcg', description: '200 mcg antes de deitar em jejum' },
      { label: 'Atletas / Hipertrofia', doseMcgOrMg: 300, unit: 'mcg', description: '300 mcg à noite (pico potente de GH)' },
    ],
  },
  'prod-semax-10-cat': {
    defaultWaterMl: 2.0,
    defaultDoseValue: 300,
    defaultUnit: 'mcg',
    presets: [
      { label: 'Foco Diário de Trabalho', doseMcgOrMg: 300, unit: 'mcg', description: '300 mcg pela manhã' },
      { label: 'Alta Performance Cognitiva', doseMcgOrMg: 600, unit: 'mcg', description: '600 mcg pela manhã antes de tarefas' },
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
};

const COMMON_VIAL_CHIPS = [5, 10, 15, 20, 30, 60, 100];
const COMMON_DILUENT_CHIPS = [1.0, 2.0, 2.5, 3.0, 5.0, 10.0];
const COMMON_DOSE_MCG_CHIPS = [50, 100, 250, 300, 500, 750, 1000];
const COMMON_DOSE_MG_CHIPS = [0.25, 0.3, 0.5, 1.0, 2.0, 2.5, 5.0, 7.5, 10.0];

export const DosageCalculatorPage: React.FC = () => {
  const {
    products,
    selectedCalculatorProduct,
    setSelectedCalculatorProduct,
    setCurrentView,
    currentUser,
    saveDoseProtocol,
    deleteDoseProtocol,
    setIsAuthOpen,
    addToCart,
    showToast,
    storeSettings,
  } = useApp();

  // State principal da calculadora
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return selectedCalculatorProduct?.id || 'prod-tirzepatida-60';
  });
  const [isCustomProduct, setIsCustomProduct] = useState<boolean>(false);
  const [customProductName, setCustomProductName] = useState<string>('Peptídeo de Pesquisa');
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Variáveis de Reconstituição
  const [vialQuantityMg, setVialQuantityMg] = useState<number>(60);
  const [waterVolumeMl, setWaterVolumeMl] = useState<number>(3.0);
  const [targetDoseValue, setTargetDoseValue] = useState<number>(2.5);
  const [targetDoseUnit, setTargetDoseUnit] = useState<TargetDoseUnit>('mg');
  const [syringeType, setSyringeType] = useState<SyringeType>('u100-1ml');
  const [frequency, setFrequency] = useState<FrequencyType>('1x_week');

  // Meia-vida e Farmacocinética
  const defaultHalfLife = useMemo(() => {
    if (isCustomProduct) return 7.0;
    return PEPTIDE_HALF_LIFE_MAP[selectedProductId]?.halfLifeDays || 7.0;
  }, [selectedProductId, isCustomProduct]);

  const [customHalfLifeDays, setCustomHalfLifeDays] = useState<number>(defaultHalfLife);
  const [halfLifeUnit, setHalfLifeUnit] = useState<'days' | 'hours'>('days');
  const [intervalDays, setIntervalDays] = useState<number>(7);

  // Sincronizar meia-vida padrão ao mudar produto
  useEffect(() => {
    setCustomHalfLifeDays(defaultHalfLife);
  }, [defaultHalfLife]);

  // Sincronizar intervalo de aplicação pela frequência escolhida
  useEffect(() => {
    switch (frequency) {
      case '1x_week': setIntervalDays(7); break;
      case '2x_week': setIntervalDays(3.5); break;
      case '3x_week': setIntervalDays(2.33); break;
      case '5x_week': setIntervalDays(1.4); break;
      case 'daily': setIntervalDays(1); break;
      case 'eod': setIntervalDays(2); break;
      default: setIntervalDays(7);
    }
  }, [frequency]);

  // Histórico de Doses Aplicadas
  const [doseHistory, setDoseHistory] = useState<DoseLogEntry[]>(() => {
    try {
      const raw = localStorage.getItem('peptide_applied_doses_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedSite, setSelectedSite] = useState<string>('Abdômen Direito');
  const [logNotes, setLogNotes] = useState<string>('');

  // Cronograma & Doses tomadas
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [scheduleWeeks, setScheduleWeeks] = useState<number>(8);
  const [completedDoses, setCompletedDoses] = useState<Record<string, boolean>>({});

  // UI helpers
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [isSavingProtocol, setIsSavingProtocol] = useState<boolean>(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Produto ativo do catálogo
  const activeProduct = useMemo(() => {
    if (isCustomProduct) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId, isCustomProduct]);

  // Sincronização externa caso venha pré-selecionado de outra página
  useEffect(() => {
    if (selectedCalculatorProduct) {
      setSelectedProductId(selectedCalculatorProduct.id);
      setIsCustomProduct(false);
      handleProductSelect(selectedCalculatorProduct.id);
    }
  }, [selectedCalculatorProduct]);

  // Leitura inicial de parâmetros da URL (Link compartilhável)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
      const hashParams = new URLSearchParams(hashQuery);

      const p = hashParams.get('p') || urlParams.get('p');
      const vial = hashParams.get('vial') || urlParams.get('vial');
      const dil = hashParams.get('dil') || urlParams.get('dil');
      const dose = hashParams.get('dose') || urlParams.get('dose');
      const unit = hashParams.get('unit') || urlParams.get('unit');
      const syr = hashParams.get('syr') || urlParams.get('syr');
      const freq = hashParams.get('freq') || urlParams.get('freq');

      if (p) {
        if (p === 'custom') {
          setIsCustomProduct(true);
        } else {
          setSelectedProductId(p);
          setIsCustomProduct(false);
        }
      }
      if (vial && !isNaN(Number(vial)) && Number(vial) > 0) setVialQuantityMg(Number(vial));
      if (dil && !isNaN(Number(dil)) && Number(dil) > 0) setWaterVolumeMl(Number(dil));
      if (dose && !isNaN(Number(dose)) && Number(dose) > 0) setTargetDoseValue(Number(dose));
      if (unit === 'mcg' || unit === 'mg') setTargetDoseUnit(unit);
      if (syr && SYRINGE_SPECS[syr as SyringeType]) setSyringeType(syr as SyringeType);
      if (freq && FREQUENCY_SPECS[freq as FrequencyType]) setFrequency(freq as FrequencyType);
    } catch (e) {
      console.warn('Erro ao processar parâmetros da URL:', e);
    }
  }, []);

  // Seleção de produto e carregamento de valores inteligentes
  const handleProductSelect = (productId: string) => {
    if (productId === 'custom') {
      setIsCustomProduct(true);
      return;
    }

    setIsCustomProduct(false);
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);

    if (prod) {
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
        if (vialQuantityMg <= 10) {
          setTargetDoseValue(250);
          setTargetDoseUnit('mcg');
        } else {
          setTargetDoseValue(2.5);
          setTargetDoseUnit('mg');
        }
      }
    }
  };

  // Alternância de unidade mcg <-> mg com conversão fluida
  const handleUnitToggle = (newUnit: TargetDoseUnit) => {
    if (newUnit === targetDoseUnit) return;
    if (newUnit === 'mcg') {
      setTargetDoseValue(Math.round(targetDoseValue * 1000 * 10) / 10);
    } else {
      setTargetDoseValue(Math.round((targetDoseValue / 1000) * 100) / 100);
    }
    setTargetDoseUnit(newUnit);
  };

  // Cálculo puro da dose
  const calculationResult: CalculatorResult = useMemo(() => {
    const input: CalculatorInput = {
      vialMg: vialQuantityMg,
      diluentMl: waterVolumeMl,
      doseValue: targetDoseValue,
      doseUnit: targetDoseUnit,
      syringeType,
      frequency,
    };
    return calculatePeptideDosage(input);
  }, [vialQuantityMg, waterVolumeMl, targetDoseValue, targetDoseUnit, syringeType, frequency]);

  // Cálculo puro da farmacocinética / acúmulo
  const pkResult: PharmacokineticsResult = useMemo(() => {
    const halfLifeInDays = halfLifeUnit === 'hours' ? customHalfLifeDays / 24 : customHalfLifeDays;
    return calculatePharmacokinetics(calculationResult.doseMg, halfLifeInDays, intervalDays);
  }, [calculationResult.doseMg, customHalfLifeDays, halfLifeUnit, intervalDays]);

  // Custo por dose baseado no frasco da loja
  const costPerDose = useMemo(() => {
    if (!activeProduct || !calculationResult.dosesPerVialExact || calculationResult.dosesPerVialExact <= 0) {
      return null;
    }
    return activeProduct.price / calculationResult.dosesPerVialExact;
  }, [activeProduct, calculationResult.dosesPerVialExact]);

  // Produtos filtrados por categoria e busca
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = productSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.dosage.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, productSearch]);

  // Cronograma detalhado de aplicações
  const scheduleRows = useMemo(() => {
    const list: { index: number; dateStr: string; dayName: string; doseText: string; isPast: boolean }[] = [];
    if (!scheduleStartDate || !calculationResult.isValid || calculationResult.dosesPerVialExact <= 0) {
      return list;
    }

    const [y, m, d] = scheduleStartDate.split('-').map(Number);
    let curDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxItems = Math.min(
      Math.ceil(calculationResult.dosesPerVialExact),
      scheduleWeeks * (frequency === 'daily' ? 7 : frequency === '1x_week' ? 1 : 2)
    );

    let doseCount = 0;
    let loopGuard = 0;

    while (doseCount < maxItems && loopGuard < 300) {
      loopGuard++;
      const dayOfWeek = curDate.getDay();
      let isDoseDay = false;

      if (frequency === 'daily') {
        isDoseDay = true;
      } else if (frequency === 'eod') {
        isDoseDay = doseCount === 0 || loopGuard % 2 === 1;
      } else if (frequency === '1x_week') {
        isDoseDay = loopGuard === 1 || dayOfWeek === new Date(y, m - 1, d).getDay();
      } else if (frequency === '2x_week') {
        isDoseDay = dayOfWeek === 1 || dayOfWeek === 4;
      } else if (frequency === '3x_week') {
        isDoseDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      } else if (frequency === '5x_week') {
        isDoseDay = dayOfWeek >= 1 && dayOfWeek <= 5;
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
          doseText: `${targetDoseValue} ${targetDoseUnit} (${calculationResult.syringeUnitsRounded} UI)`,
          isPast,
        });
      }

      curDate.setDate(curDate.getDate() + 1);
    }

    return list;
  }, [scheduleStartDate, calculationResult, frequency, scheduleWeeks, targetDoseValue, targetDoseUnit]);

  // Copiar resumo
  const handleCopySummary = () => {
    const prodName = isCustomProduct ? customProductName : activeProduct?.name || 'Peptídeo';
    const textToCopy = [
      `🧪 CÁLCULO DE DOSAGEM & SERINGA — ${prodName.toUpperCase()}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• Frasco: ${vialQuantityMg} mg`,
      `• Diluente: ${waterVolumeMl} mL de água bacteriostática`,
      `• Dose desejada: ${targetDoseValue} ${targetDoseUnit}`,
      `• Seringa recomendada: ${calculationResult.syringeSpec.label}`,
      `• ASPIRAR NA SERINGA: ${calculationResult.syringeUnitsRounded} UI (${calculationResult.volumeToInjectMl.toFixed(2).replace('.', ',')} mL)`,
      `• Concentração: ${calculationResult.concentrationMgPerMl.toFixed(3).replace('.', ',')} mg/mL`,
      `• Rendimento do frasco: ${calculationResult.dosesPerVialRounded.toFixed(1).replace('.', ',')} doses`,
      `• Frequência: ${calculationResult.frequencySpec.label} (~${Math.round(calculationResult.weeksDurationRounded)} semanas)`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `⚠️ Ferramenta informativa e educacional. Não substitui orientação médica.`,
    ].join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopiedResult(true);
    showToast('Resultado copiado com sucesso para a área de transferência!');
    setTimeout(() => setCopiedResult(false), 3000);
  };

  // Gerar link compartilhável com parâmetros na URL
  const handleShareLink = () => {
    const params = new URLSearchParams();
    if (isCustomProduct) {
      params.set('p', 'custom');
    } else if (activeProduct?.id) {
      params.set('p', activeProduct.id);
    }
    params.set('vial', String(vialQuantityMg));
    params.set('dil', String(waterVolumeMl));
    params.set('dose', String(targetDoseValue));
    params.set('unit', targetDoseUnit);
    params.set('syr', syringeType);
    params.set('freq', frequency);

    const shareUrl = `${window.location.origin}${window.location.pathname}#calculo-doses?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Link do cálculo copiado! Envie no WhatsApp ou salve nos favoritos.');
  };

  // Salvar no perfil
  const handleSaveProtocol = async () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      showToast('Entre com sua conta ou crie um cadastro gratuito para salvar o protocolo na nuvem.');
      return;
    }

    setIsSavingProtocol(true);
    try {
      const prodName = isCustomProduct ? customProductName : activeProduct?.name || 'Peptídeo Personalizado';
      await saveDoseProtocol({
        productId: activeProduct?.id,
        productName: prodName,
        dosageLabel: `${targetDoseValue} ${targetDoseUnit}`,
        vialMg: vialQuantityMg,
        waterMl: waterVolumeMl,
        doseValue: targetDoseValue,
        doseUnit: targetDoseUnit,
        syringeUnits: calculationResult.syringeUnitsRounded,
        syringeType,
        frequency: frequency as any,
        concentrationMgPerMl: calculationResult.concentrationMgPerMl,
        totalDosesInVial: Math.floor(calculationResult.dosesPerVialExact),
        notes: `Reconstituição com ${waterVolumeMl} mL (${calculationResult.concentrationMgPerMl.toFixed(2)} mg/mL). Puxar ${calculationResult.syringeUnitsRounded} UI.`,
      });
      showToast('Protocolo salvo com sucesso no seu perfil!');
    } finally {
      setIsSavingProtocol(false);
    }
  };

  // Pedir no WhatsApp
  const handleOrderWhatsApp = () => {
    const rawNumber = (storeSettings.whatsappNumber || '5511993456789').replace(/\D/g, '');
    const prodName = isCustomProduct ? customProductName : activeProduct?.name || 'Peptídeo de Pesquisa';
    const presentation = activeProduct?.dosage || `${vialQuantityMg} mg`;

    const message = [
      `Olá! Estava utilizando a Calculadora de Doses do site e gostaria de fazer o pedido:`,
      ``,
      `🧪 *Produto:* ${prodName} (${presentation})`,
      `💧 *Reconstituição Planejada:* ${vialQuantityMg} mg com ${waterVolumeMl} mL de água bacteriostática`,
      `💉 *Dose Alvo:* ${targetDoseValue} ${targetDoseUnit} (*${calculationResult.syringeUnitsRounded} UI* na seringa de ${calculationResult.syringeSpec.shortLabel})`,
      `📦 *Rendimento:* ${calculationResult.dosesPerVialRounded.toFixed(1)} doses (~${Math.round(calculationResult.weeksDurationRounded)} semanas a ${calculationResult.frequencySpec.label})`,
      ``,
      `Gostaria de verificar o valor e a disponibilidade para envio!`,
    ].join('\n');

    window.open(`https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Registrar dose aplicada no histórico
  const handleRecordDose = () => {
    const prodName = isCustomProduct ? customProductName : activeProduct?.name || 'Peptídeo';
    const now = new Date();
    const newEntry: DoseLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      dateFormatted: now.toLocaleDateString('pt-BR'),
      timeFormatted: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      productName: prodName,
      doseMg: calculationResult.doseMg,
      doseFormatted: calculationResult.doseFormatted,
      syringeUnits: calculationResult.syringeUnitsRounded,
      injectionSite: selectedSite,
      notes: logNotes.trim() || undefined,
    };

    const updated = [newEntry, ...doseHistory];
    setDoseHistory(updated);
    try {
      localStorage.setItem('peptide_applied_doses_history', JSON.stringify(updated));
    } catch {}
    setIsLogModalOpen(false);
    setLogNotes('');
    showToast('Aplicação registrada com sucesso no seu histórico!');
  };

  const handleDeleteDoseLog = (id: string) => {
    const updated = doseHistory.filter((item) => item.id !== id);
    setDoseHistory(updated);
    try {
      localStorage.setItem('peptide_applied_doses_history', JSON.stringify(updated));
    } catch {}
    showToast('Registro de aplicação removido.');
  };

  const toggleDose = (idx: number) => {
    setCompletedDoses((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 pb-32">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden pt-10 pb-8 border-b border-slate-800/80 bg-gradient-to-b from-blue-950/30 via-[#0B0F17] to-[#070A10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculadora de Seringa & Reconstituição</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Calculadora de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-300">Doses & Seringa</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Dosagem exata na seringa de insulina, concentração milimétrica em mg/mL, curva farmacocinética de platô e controle diário de injeções.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  setCurrentView('benefits');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Guia de Benefícios</span>
              </button>
              <button
                onClick={handleShareLink}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-colors cursor-pointer"
                title="Copiar link com esses parâmetros"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar Link</span>
              </button>
            </div>
          </div>

          {/* Warning Banner (Inspirado no Peptiwise) */}
          <div className="mt-5 p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-300 font-bold uppercase tracking-wider block sm:inline mr-1">
                Atenção Farmacotécnica:
              </strong>
              Peptídeos possuem ligações frágeis. Ao adicionar a água bacteriostática, incline o frasco e deixe o líquido escorrer suavemente pelas paredes. <strong>Nunca chacoalhe o frasco</strong>; faça apenas movimentos circulares brandos.
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Work Area: 2-Column Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Saved Protocols from User Profile (se houver) */}
        {currentUser?.savedDoseProtocols && currentUser.savedDoseProtocols.length > 0 && (
          <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                <span>Seus Protocolos Salvos na Nuvem ({currentUser.savedDoseProtocols.length})</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">Clique para carregar na calculadora</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {currentUser.savedDoseProtocols.map((proto) => (
                <div
                  key={proto.id}
                  className="p-3 bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between gap-3 group transition-all"
                >
                  <div
                    onClick={() => {
                      if (proto.productId) {
                        setSelectedProductId(proto.productId);
                        setIsCustomProduct(false);
                      } else {
                        setIsCustomProduct(true);
                        setCustomProductName(proto.productName);
                      }
                      setVialQuantityMg(proto.vialMg);
                      setWaterVolumeMl(proto.waterMl);
                      setTargetDoseValue(proto.doseValue);
                      setTargetDoseUnit(proto.doseUnit as TargetDoseUnit);
                      setSyringeType(proto.syringeType as SyringeType);
                      setFrequency(proto.frequency as FrequencyType);
                      showToast(`Protocolo "${proto.productName}" carregado!`);
                    }}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Stepper (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* PASSO 1: Seleção de Peptídeo */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      Peptídeo / Composto
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Toque para preencher automaticamente os mg do frasco e diluente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de Busca e Filtro de Categorias */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar peptídeo do catálogo (ex: Tirzepatida, BPC, Cagrilintida...)"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Categorias */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 admin-nav-scrollbar text-[11px]">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat === 'all' ? 'Todos os Peptídeos' : cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleProductSelect('custom')}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                      isCustomProduct
                        ? 'bg-purple-500 text-slate-950 border-purple-400 font-black'
                        : 'bg-slate-950 text-purple-400 border-purple-500/30 hover:border-purple-400'
                    }`}
                  >
                    + Outro / Personalizado
                  </button>
                </div>
              </div>

              {/* Cards Grid de Produtos */}
              {!isCustomProduct ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 admin-nav-scrollbar">
                  {filteredProducts.map((prod) => {
                    const isSelected = selectedProductId === prod.id && !isCustomProduct;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleProductSelect(prod.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-8 bg-slate-900 rounded flex items-center justify-center shrink-0 border border-slate-800">
                            <PeptideVial capColor={prod.capColor} size="sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                              {prod.category || 'Peptídeo'}
                            </span>
                            <span className="text-xs font-bold text-white block truncate group-hover:text-cyan-300">
                              {prod.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                          <span className="font-mono text-cyan-400 font-bold">{prod.dosage}</span>
                          <span className="text-emerald-400 font-bold">R$ {prod.price.toFixed(0)}</span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-slate-950">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Entrada para Peptídeo Personalizado */
                <div className="p-3.5 bg-slate-950 border border-purple-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-300">
                      Nome do Composto Personalizado:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleProductSelect(products[0]?.id || 'prod-tirzepatida-60')}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Voltar ao Catálogo
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="Ex: Cagrilintida, GHRP-2, Epithalon..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl text-xs text-white"
                  />
                </div>
              )}
            </div>

            {/* PASSO 2: Seringa de Insulina */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      Seringa de Insulina (U-100)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Escolha o tamanho da seringa para ajustar as marcações físicas exatas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards de Seringas (Inspirado no Peptiwise) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['u100-0.3ml', 'u100-0.5ml', 'u100-1ml'] as SyringeType[]).map((typeId) => {
                  const spec = SYRINGE_SPECS[typeId];
                  const isSelected = syringeType === typeId;
                  return (
                    <button
                      key={typeId}
                      type="button"
                      onClick={() => setSyringeType(typeId)}
                      className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Syringe className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <div className="text-sm font-black text-white">{spec.volumeMl} mL</div>
                      <div className="text-xs font-bold text-cyan-400">{spec.capacityUnits} UI</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Marcas de {spec.graduationStepUnits} em {spec.graduationStepUnits} UI
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASSO 3: Quantidade no Frasco (mg) */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    3
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      Quantidade no Frasco (mg)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Quanto princípio ativo liofilizado existe no frasco fechado.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {vialQuantityMg} mg
                </span>
              </div>

              {/* Chips Rápidos de mg */}
              <div className="flex flex-wrap items-center gap-1.5">
                {COMMON_VIAL_CHIPS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setVialQuantityMg(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vialQuantityMg === val
                        ? 'bg-cyan-500 text-slate-950 shadow font-black'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {val} mg
                  </button>
                ))}
              </div>

              {/* Campo Numérico */}
              <div className="relative pt-1">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={vialQuantityMg || ''}
                  onChange={(e) => setVialQuantityMg(parseFloat(e.target.value) || 0)}
                  placeholder="Ou digite outro valor em mg..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl text-xs sm:text-sm text-white font-mono font-bold focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pt-1">
                  mg no frasco
                </span>
              </div>
            </div>

            {/* PASSO 4: Volume do Diluente (mL) */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    4
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      Volume do Diluente (mL)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Volume de água bacteriostática estéril adicionada para reconstituir.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {waterVolumeMl} mL
                </span>
              </div>

              {/* Chips Rápidos de Diluente */}
              <div className="flex flex-wrap items-center gap-1.5">
                {COMMON_DILUENT_CHIPS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setWaterVolumeMl(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      waterVolumeMl === val
                        ? 'bg-cyan-500 text-slate-950 shadow font-black'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {val} mL
                  </button>
                ))}
              </div>

              {/* Campo Numérico */}
              <div className="relative pt-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="30"
                  value={waterVolumeMl || ''}
                  onChange={(e) => setWaterVolumeMl(parseFloat(e.target.value) || 0)}
                  placeholder="Ou digite outro volume em mL..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl text-xs sm:text-sm text-white font-mono font-bold focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pt-1">
                  mL de água
                </span>
              </div>
            </div>

            {/* PASSO 5: Dose Desejada */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    5
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      Dose Desejada por Aplicação
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Quanto você quer aplicar em cada injeção.
                    </p>
                  </div>
                </div>

                {/* Switcher mcg / mg */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('mcg')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      targetDoseUnit === 'mcg'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    mcg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('mg')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      targetDoseUnit === 'mg'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    mg
                  </button>
                </div>
              </div>

              {/* Lembrete Didático: 1 mg = 1000 mcg */}
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20 text-[11px] text-cyan-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Lembrete de conversão farmacêutica: <strong>1 mg = 1.000 mcg</strong> (ex: 250 mcg = 0,25 mg | 500 mcg = 0,5 mg | 5 mg = 5.000 mcg).
                </span>
              </div>

              {/* Presets Clínicos Sugeridos para o Peptídeo Atual */}
              {!isCustomProduct && PRODUCT_DOSING_PRESETS[selectedProductId] && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Protocolos Sugeridos para {activeProduct?.name}:
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
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/30'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-cyan-300 truncate">
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

              {/* Chips Rápidos de Dose (mcg ou mg) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold block">Doses Comuns em {targetDoseUnit}:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(targetDoseUnit === 'mcg' ? COMMON_DOSE_MCG_CHIPS : COMMON_DOSE_MG_CHIPS).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetDoseValue(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        targetDoseValue === val
                          ? 'bg-cyan-500 text-slate-950 shadow font-black'
                          : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {val} {targetDoseUnit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo Numérico */}
              <div className="relative pt-1">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={targetDoseValue || ''}
                  onChange={(e) => setTargetDoseValue(parseFloat(e.target.value) || 0)}
                  placeholder={`Digite a dose desejada em ${targetDoseUnit}...`}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl text-sm font-bold text-cyan-400 font-mono focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pt-1">
                  {targetDoseUnit} por aplicação
                </span>
              </div>
            </div>

            {/* PASSO 6: Frequência de Aplicação */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    6
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      Frequência de Uso
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Atualiza a estimativa de duração em semanas e o intervalo para a curva farmacocinética.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: '1x_week', label: '1x / sem' },
                  { id: '2x_week', label: '2x / sem' },
                  { id: '3x_week', label: '3x / sem' },
                  { id: '5x_week', label: '5x / sem' },
                  { id: 'daily', label: 'Diário' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrequency(f.id as FrequencyType)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      frequency === f.id
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Result Card (5 cols) */}
          <div ref={resultRef} className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            
            <div className="bg-gradient-to-b from-slate-900 to-[#0B0F17] border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header do Card de Resultado */}
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    RESULTADO DA RECONSTITUIÇÃO
                  </span>
                </div>
                <Syringe className="w-5 h-5 text-cyan-400" />
              </div>

              {/* Big Highlight Circle Display (Inspirado no Zoukei) */}
              <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-5 text-center relative shadow-inner space-y-2">
                <div className="w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-full bg-gradient-to-b from-cyan-500/15 via-blue-500/10 to-transparent border-2 border-cyan-400/50 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/10">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 font-mono tracking-tight">
                    {calculationResult.syringeUnitsRounded} UI
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    na seringa
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <p className="text-xs font-bold text-white">
                    Puxe <strong className="text-cyan-400">{calculationResult.syringeUnitsRounded} UI</strong> ({calculationResult.volumeToInjectMl.toFixed(2).replace('.', ',')} mL) para obter {calculationResult.doseFormatted}
                  </p>
                  {calculationResult.syringeUnitsRounded !== Math.round(calculationResult.syringeUnitsExact * 10) / 10 && (
                    <p className="text-[10px] text-slate-400">
                      Marcação na seringa: {calculationResult.syringeUnitsRounded} UI (leitura exata: {calculationResult.syringeUnitsExact.toFixed(2)} UI)
                    </p>
                  )}
                </div>
              </div>

              {/* Badges de Doses e Semanas Lado a Lado (Inspirado no Zoukei) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-lg sm:text-xl font-black text-amber-400 font-mono block">
                    {calculationResult.dosesPerVialRounded.toFixed(1).replace('.', ',')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Doses no Frasco
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono block">
                    {Math.round(calculationResult.weeksDurationRounded)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Semanas Estimadas
                  </span>
                </div>
              </div>

              {/* Desenho da Seringa Graduada com Animação de Preenchimento Fluida */}
              <SyringeVisualizer
                currentUnits={calculationResult.syringeUnitsRounded}
                capacityUnits={calculationResult.syringeSpec.capacityUnits}
                volumeToInjectMl={calculationResult.volumeToInjectMl}
                syringeLabel={calculationResult.syringeSpec.shortLabel}
                isOverCapacity={calculationResult.syringeUnitsExact > calculationResult.syringeSpec.capacityUnits}
              />

              {/* Detalhes Farmacotécnicos */}
              <div className="divide-y divide-slate-800/80 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    Concentração
                  </span>
                  <span className="text-white font-bold font-mono">
                    {calculationResult.concentrationMgPerMl.toFixed(3).replace('.', ',')} mg/mL
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5 text-cyan-400" />
                    Volume por dose
                  </span>
                  <span className="text-white font-bold font-mono">
                    {calculationResult.volumeToInjectMl.toFixed(2).replace('.', ',')} mL
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Uso da seringa
                  </span>
                  <span className="text-white font-bold font-mono">
                    {calculationResult.syringeUnitsRounded} UI / {calculationResult.syringePercentage.toFixed(0)}% da capacidade
                  </span>
                </div>

                {costPerDose && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      Custo por dose
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      R$ {costPerDose.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>

              {/* Avisos e Validações com Sugestão Automática */}
              {calculationResult.notices.length > 0 && (
                <div className="space-y-2 pt-1">
                  {calculationResult.notices.map((notice, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs space-y-2 border ${
                        notice.type === 'error'
                          ? 'bg-red-950/40 border-red-500/40 text-red-200'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${notice.type === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                        <span>{notice.message}</span>
                      </div>

                      {notice.suggestedDiluentMl && (
                        <button
                          type="button"
                          onClick={() => setWaterVolumeMl(notice.suggestedDiluentMl!)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Aplicar sugestão: Diluir com {notice.suggestedDiluentMl} mL de água</span>
                        </button>
                      )}

                      {notice.suggestedSyringeType && (
                        <button
                          type="button"
                          onClick={() => setSyringeType(notice.suggestedSyringeType!)}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-[11px] rounded-lg border border-red-500/40 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Syringe className="w-3 h-3" />
                          <span>Trocar para seringa recomendada ({SYRINGE_SPECS[notice.suggestedSyringeType].label})</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Botões de Ação do Resultado */}
              <div className="pt-2 space-y-2.5">
                {/* Botão Pedir no WhatsApp */}
                <button
                  type="button"
                  onClick={handleOrderWhatsApp}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-slate-950" />
                  <span>Pedir no WhatsApp</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedResult ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedResult ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Registrar Dose</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProtocol}
                  disabled={isSavingProtocol}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isSavingProtocol ? 'Salvando...' : 'Salvar no Meu Perfil'}</span>
                </button>

                {activeProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(activeProduct, 1);
                      showToast(`${activeProduct.name} adicionado ao carrinho!`);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Adicionar {activeProduct.name} ao Carrinho</span>
                  </button>
                )}
              </div>

              {/* Aviso Legal Fixo */}
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  ⚠️ Ferramenta informativa e educacional. Não substitui orientação médica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO EXTRA: ACÚMULO NO ORGANISMO & MEIA-VIDA (Inspirado no Zoukei) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800/80">
        <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Farmacocinética & Curva de Acúmulo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Acúmulo no Organismo (Meia-Vida)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  {isCustomProduct ? customProductName : activeProduct?.name || 'Peptídeo'}
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Com doses repetidas, o peptídeo acumula no corpo até alcançar o estado de equilíbrio (platô). Veja os níveis calculados de pico e vale.
              </p>
            </div>

            <div className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizado com os dados da calculadora</span>
            </div>
          </div>

          {/* Controles da Farmacocinética */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Dose por Aplicação:
              </label>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-white font-mono font-bold text-sm">
                {calculationResult.doseFormatted} ({calculationResult.doseMg} mg)
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Meia-Vida Estimada:</span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setHalfLifeUnit('days')}
                    className={`px-1.5 py-0.5 rounded font-bold ${halfLifeUnit === 'days' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                  >
                    dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setHalfLifeUnit('hours')}
                    className={`px-1.5 py-0.5 rounded font-bold ${halfLifeUnit === 'hours' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                  >
                    horas
                  </button>
                </div>
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={customHalfLifeDays}
                onChange={(e) => setCustomHalfLifeDays(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Intervalo entre Doses:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  dias
                </span>
              </div>
            </div>
          </div>

          {/* Texto de Resumo Farmacocinético */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200">
            {pkResult.summaryText}
          </div>

          {/* 4 Cards de Métricas Farmacocinéticas (Inspirado no Zoukei) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pico no Platô ✨
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono block">
                {pkResult.peakPlateau.toFixed(2).replace('.', ',')} mg
              </span>
              <span className="text-[10px] text-slate-500 block">
                máximo logo após aplicar
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Vale no Platô ⚖️
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono block">
                {pkResult.troughPlateau.toFixed(2).replace('.', ',')} mg
              </span>
              <span className="text-[10px] text-slate-500 block">
                mínimo antes da próxima dose
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Tempo até o Platô ⏳
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono block">
                ~{pkResult.plateauTimeDays} dias
              </span>
              <span className="text-[10px] text-slate-500 block">
                até o nível se estabilizar
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Fator de Acúmulo 📈
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono block">
                {pkResult.accumulationFactor.toFixed(1).replace('.', ',')}x
              </span>
              <span className="text-[10px] text-slate-500 block">
                vs. uma dose única isolada
              </span>
            </div>
          </div>

          {/* Gráfico em Dente de Serra (SVG Puro & Leve) */}
          <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Curva de Concentração Plasmática (Dente de Serra)
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                Pico máximo: {pkResult.peakPlateau.toFixed(2)} mg
              </span>
            </div>

            <div className="relative w-full h-56 sm:h-64">
              {(() => {
                const points = pkResult.curvePoints;
                if (!points || points.length === 0) return null;

                const maxDay = Math.max(...points.map((p) => p.day), 1);
                const maxLevel = Math.max(...points.map((p) => p.level), pkResult.peakPlateau * 1.05, 0.01);

                const W = 700;
                const H = 220;
                const padL = 45;
                const padR = 25;
                const padT = 20;
                const padB = 30;

                const scaleX = (d: number) => padL + (d / maxDay) * (W - padL - padR);
                const scaleY = (lvl: number) => H - padB - (lvl / maxLevel) * (H - padT - padB);

                const pathData = points
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.day).toFixed(1)} ${scaleY(p.level).toFixed(1)}`)
                  .join(' ');

                const areaData = `${pathData} L ${scaleX(maxDay).toFixed(1)} ${H - padB} L ${scaleX(0).toFixed(1)} ${H - padB} Z`;

                const plateauY = scaleY(pkResult.peakPlateau);

                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none">
                    <defs>
                      <linearGradient id="pkSawtoothGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Linhas de Grade e Eixo Y */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                      const yVal = padT + frac * (H - padT - padB);
                      const labelVal = (maxLevel * (1 - frac)).toFixed(2);
                      return (
                        <g key={frac}>
                          <line x1={padL} y1={yVal} x2={W - padR} y2={yVal} stroke="#1e293b" strokeDasharray="3 3" />
                          <text x={padL - 6} y={yVal + 3} fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
                            {labelVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* Linha tracejada do platô */}
                    <line
                      x1={padL}
                      y1={plateauY}
                      x2={W - padR}
                      y2={plateauY}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text x={W - padR} y={plateauY - 5} fontSize="9" fill="#f59e0b" textAnchor="end" fontWeight="bold">
                      pico no platô ({pkResult.peakPlateau.toFixed(2)} mg)
                    </text>

                    {/* Área sombreada */}
                    <path d={areaData} fill="url(#pkSawtoothGradient)" />

                    {/* Curva em dente de serra */}
                    <path d={pathData} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Eixo X com marcas de dias */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                      const dayVal = Math.round(maxDay * frac);
                      const xVal = scaleX(dayVal);
                      return (
                        <g key={frac}>
                          <line x1={xVal} y1={H - padB} x2={xVal} y2={H - padB + 4} stroke="#475569" />
                          <text x={xVal} y={H - padB + 16} fontSize="9" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">
                            {dayVal}d
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
            <div className="text-[10px] text-slate-500 text-center">
              A linha amarela demonstra o acúmulo a cada dose aplicada e o declínio exponencial entre elas até estabilizar no platô.
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: HISTÓRICO DE DOSES APLICADAS (Diário de Aplicações) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800/80">
        <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Diário de Aplicações</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Histórico de Doses Aplicadas
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Registre suas injeções realizadas, local de aplicação (rodízio) e horário para manter seu histórico organizado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nova Dose</span>
            </button>
          </div>

          {/* Lista de Registros */}
          {doseHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <Syringe className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                Nenhuma dose registrada ainda. Ao aplicar seu peptídeo, clique em <strong>"Registrar Nova Dose"</strong> para salvar o local e a data da aplicação.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {doseHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {item.dateFormatted} às {item.timeFormatted}
                      </span>
                      <h4 className="text-xs font-black text-white">{item.productName}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoseLog(item.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-cyan-400 font-mono font-bold">
                      {item.syringeUnits} UI ({item.doseFormatted})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-semibold border border-slate-800">
                      📍 {item.injectionSite}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-[10px] text-slate-400 italic bg-slate-900/50 p-2 rounded-lg">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Floating Bottom Bar for Mobile View */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-cyan-500/40 p-3 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Syringe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-white block">
              Puxe {calculationResult.syringeUnitsRounded} UI ({calculationResult.volumeToInjectMl.toFixed(2)} mL)
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {calculationResult.dosesPerVialRounded.toFixed(1)} doses • {Math.round(calculationResult.weeksDurationRounded)} semanas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOrderWhatsApp}
            className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black cursor-pointer shadow"
            title="Pedir no WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
          </button>
          <button
            type="button"
            onClick={() => {
              resultRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow"
          >
            Ver
          </button>
        </div>
      </div>

      {/* Protocol Schedule Planner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800/80">
        <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
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
                onClick={() => {
                  const text = scheduleRows
                    .map((r) => `Dose #${r.index} | ${r.dateStr} (${r.dayName}) - ${r.doseText} [${completedDoses[r.index] ? 'FEITO' : 'PENDENTE'}]`)
                    .join('\n');
                  const prodName = isCustomProduct ? customProductName : activeProduct?.name || 'Peptídeo';
                  navigator.clipboard.writeText(
                    `CRONOGRAMA DE APLICAÇÃO - ${prodName}\nConcentração: ${calculationResult.concentrationMgPerMl.toFixed(3)} mg/mL\nVolume: ${calculationResult.volumeToInjectMl.toFixed(3)} mL (${calculationResult.syringeUnitsRounded} UI)\n\n` + text
                  );
                  showToast('Cronograma copiado para a área de transferência!');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar Cronograma</span>
              </button>
              <button
                onClick={() => window.print()}
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
              desc: 'Com uma seringa estéril, aspire o volume desejado de água bacteriostática (ex: 2.0 ou 3.0 mL) certificando-se de retirar bolhas de ar.',
            },
            {
              step: '3',
              title: 'Injeção na Parede',
              desc: 'Perfure a borracha e incline o frasco a 45°. Deixe a água escorrer suavemente pelas paredes de vidro. NUNCA lance o jato diretamente no pó.',
            },
            {
              step: '4',
              title: 'Dissolução & Geladeira',
              desc: 'Movimente o frasco em círculos suaves sobre a mesa até dissolver por completo (não chacoalhe). Guarde na geladeira de 2°C a 8°C.',
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

      {/* MODAL: REGISTRAR DOSE APLICADA */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Registrar Aplicação Realizada</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400">Composto & Dosagem:</div>
                <div className="text-sm font-black text-white">
                  {isCustomProduct ? customProductName : activeProduct?.name || 'Peptídeo'} — {calculationResult.doseFormatted}
                </div>
                <div className="text-cyan-400 font-bold font-mono">
                  {calculationResult.syringeUnitsRounded} UI na seringa ({calculationResult.volumeToInjectMl.toFixed(2)} mL)
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Local da Aplicação (Rodízio):</label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500"
                >
                  {INJECTION_SITES.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Observações (Opcional):</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Sem dor no local, aplicação tranquila..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRecordDose}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black cursor-pointer transition-colors"
                >
                  Confirmar Registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
