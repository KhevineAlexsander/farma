/**
 * peptideCalculator.ts
 * Módulo de funções puras para cálculo rigoroso de dosagem e reconstituição de peptídeos.
 * Todos os cálculos internos são padronizados em miligramas (mg) e mililitros (mL).
 */

export type TargetDoseUnit = 'mcg' | 'mg';

export type SyringeType =
  | 'u100-0.3ml' // 30 UI - 0.3 mL (graduação de 0.5 ou 1 UI)
  | 'u100-0.5ml' // 50 UI - 0.5 mL (graduação de 0.5 ou 1 UI)
  | 'u100-1ml'   // 100 UI - 1.0 mL (graduação de 1 UI)
  | 'u40-1ml'    // 40 UI - 1.0 mL (graduação veterinária de 1 UI)
  | 'standard-1ml'; // 1.0 mL decimal

export type FrequencyType =
  | '1x_week'
  | '2x_week'
  | '3x_week'
  | '5x_week'
  | 'daily'
  | 'eod';

export interface SyringeSpec {
  id: SyringeType;
  label: string;
  shortLabel: string;
  volumeMl: number;
  capacityUnits: number;
  graduationStepUnits: number; // 0.5 ou 1.0 UI
  isU100: boolean;
}

export const SYRINGE_SPECS: Record<SyringeType, SyringeSpec> = {
  'u100-0.3ml': {
    id: 'u100-0.3ml',
    label: '0.3 mL (30 UI)',
    shortLabel: '30 UI',
    volumeMl: 0.3,
    capacityUnits: 30,
    graduationStepUnits: 0.5,
    isU100: true,
  },
  'u100-0.5ml': {
    id: 'u100-0.5ml',
    label: '0.5 mL (50 UI)',
    shortLabel: '50 UI',
    volumeMl: 0.5,
    capacityUnits: 50,
    graduationStepUnits: 0.5,
    isU100: true,
  },
  'u100-1ml': {
    id: 'u100-1ml',
    label: '1.0 mL (100 UI)',
    shortLabel: '100 UI',
    volumeMl: 1.0,
    capacityUnits: 100,
    graduationStepUnits: 1.0,
    isU100: true,
  },
  'u40-1ml': {
    id: 'u40-1ml',
    label: 'U-40 (40 UI)',
    shortLabel: '40 UI',
    volumeMl: 1.0,
    capacityUnits: 40,
    graduationStepUnits: 1.0,
    isU100: false,
  },
  'standard-1ml': {
    id: 'standard-1ml',
    label: '1.0 mL Comum',
    shortLabel: '1.0 mL',
    volumeMl: 1.0,
    capacityUnits: 1.0,
    graduationStepUnits: 0.01,
    isU100: false,
  },
};

export const FREQUENCY_SPECS: Record<FrequencyType, { label: string; timesPerWeek: number }> = {
  '1x_week': { label: '1x por semana', timesPerWeek: 1 },
  '2x_week': { label: '2x por semana', timesPerWeek: 2 },
  '3x_week': { label: '3x por semana', timesPerWeek: 3 },
  '5x_week': { label: '5x por semana', timesPerWeek: 5 },
  'daily': { label: 'Diariamente', timesPerWeek: 7 },
  'eod': { label: 'Dia sim / Dia não', timesPerWeek: 3.5 },
};

export interface CalculatorInput {
  vialMg: number;
  diluentMl: number;
  doseValue: number;
  doseUnit: TargetDoseUnit;
  syringeType: SyringeType;
  frequency: FrequencyType;
}

export interface ValidationNotice {
  type: 'error' | 'warning' | 'info';
  code:
    | 'EMPTY_OR_ZERO'
    | 'DOSE_EXCEEDS_VIAL'
    | 'DOSE_EXCEEDS_SYRINGE'
    | 'DOSE_TOO_SMALL'
    | 'VOLUME_LARGE_FOR_SUBQ'
    | 'VALID';
  message: string;
  suggestedDiluentMl?: number;
  suggestedSyringeType?: SyringeType;
}

export interface CalculatorResult {
  isValid: boolean;
  doseMg: number;
  doseFormatted: string;
  concentrationMgPerMl: number;
  concentrationMcgPerMl: number;
  volumeToInjectMl: number;
  syringeUnitsExact: number;
  syringeUnitsRounded: number;
  syringePercentage: number;
  dosesPerVialExact: number;
  dosesPerVialRounded: number;
  weeksDurationExact: number;
  weeksDurationRounded: number;
  daysDurationRounded: number;
  syringeSpec: SyringeSpec;
  frequencySpec: { label: string; timesPerWeek: number };
  notices: ValidationNotice[];
  hasError: boolean;
  summaryText: string;
}

/**
 * Converte valor de dose para mg internamente.
 */
export function convertDoseToMg(doseValue: number, unit: TargetDoseUnit): number {
  if (doseValue <= 0 || isNaN(doseValue)) return 0;
  if (unit === 'mcg') {
    return doseValue / 1000;
  }
  return doseValue;
}

/**
 * Sugere um volume alternativo de diluente caso a dose seja muito pequena ou muito grande.
 */
export function suggestAlternativeDiluent(
  vialMg: number,
  doseMg: number,
  targetUnits: number = 10
): number {
  if (doseMg <= 0 || vialMg <= 0) return 2.0;
  // UI = (doseMg / (vialMg / diluentMl)) * 100
  // diluentMl = (UI * vialMg) / (100 * doseMg)
  const calculatedMl = (targetUnits * vialMg) / (100 * doseMg);
  // Arredondar para valores amigáveis (0.5, 1, 1.5, 2, 2.5, 3, 5, etc.)
  const rounded = Math.round(calculatedMl * 2) / 2;
  return Math.min(Math.max(rounded, 0.5), 10.0);
}

/**
 * Arredonda UI para a graduação física da seringa.
 */
export function roundToSyringeGraduation(units: number, graduationStep: number): number {
  if (graduationStep <= 0) return units;
  return Math.round(units / graduationStep) * graduationStep;
}

/**
 * Núcleo de cálculo puro.
 */
export function calculatePeptideDosage(input: CalculatorInput): CalculatorResult {
  const { vialMg, diluentMl, doseValue, doseUnit, syringeType, frequency } = input;
  const syringeSpec = SYRINGE_SPECS[syringeType] || SYRINGE_SPECS['u100-1ml'];
  const frequencySpec = FREQUENCY_SPECS[frequency] || FREQUENCY_SPECS['1x_week'];
  const notices: ValidationNotice[] = [];

  const doseMg = convertDoseToMg(doseValue, doseUnit);

  // 1. Validação de campos vazios ou zerados
  if (!vialMg || vialMg <= 0 || !diluentMl || diluentMl <= 0 || !doseMg || doseMg <= 0) {
    notices.push({
      type: 'error',
      code: 'EMPTY_OR_ZERO',
      message: 'Preencha a quantidade do frasco, volume de diluente e dose desejada com valores maiores que zero.',
    });

    return {
      isValid: false,
      hasError: true,
      doseMg: 0,
      doseFormatted: `${doseValue || 0} ${doseUnit}`,
      concentrationMgPerMl: 0,
      concentrationMcgPerMl: 0,
      volumeToInjectMl: 0,
      syringeUnitsExact: 0,
      syringeUnitsRounded: 0,
      syringePercentage: 0,
      dosesPerVialExact: 0,
      dosesPerVialRounded: 0,
      weeksDurationExact: 0,
      weeksDurationRounded: 0,
      daysDurationRounded: 0,
      syringeSpec,
      frequencySpec,
      notices,
      summaryText: 'Dados incompletos para cálculo.',
    };
  }

  // 2. Fórmulas fundamentais
  // concentração (mg/mL) = mg_frasco / diluente_mL
  const concentrationMgPerMl = vialMg / diluentMl;
  const concentrationMcgPerMl = concentrationMgPerMl * 1000;

  // volume (mL) = dose_mg / concentração
  const volumeToInjectMl = doseMg / concentrationMgPerMl;

  // UI (U-100: volume_mL * 100 | U-40: volume_mL * 40 | Standard: volume_mL)
  let syringeUnitsExact = 0;
  if (syringeSpec.isU100) {
    syringeUnitsExact = volumeToInjectMl * 100;
  } else if (syringeType === 'u40-1ml') {
    syringeUnitsExact = volumeToInjectMl * 40;
  } else {
    syringeUnitsExact = volumeToInjectMl;
  }

  // Arredondamento para a graduação física da seringa (0.5 ou 1.0 UI)
  const syringeUnitsRounded = roundToSyringeGraduation(
    syringeUnitsExact,
    syringeSpec.graduationStepUnits
  );

  // % da seringa = UI / capacidade_UI * 100
  const syringePercentage = (syringeUnitsExact / syringeSpec.capacityUnits) * 100;

  // doses por frasco = mg_frasco / dose_mg
  const dosesPerVialExact = vialMg / doseMg;
  const dosesPerVialRounded = Math.round(dosesPerVialExact * 10) / 10;

  // semanas = doses_por_frasco / frequência_semanal
  const weeksDurationExact = dosesPerVialExact / frequencySpec.timesPerWeek;
  const weeksDurationRounded = Math.round(weeksDurationExact * 10) / 10;
  const daysDurationRounded = Math.round(weeksDurationExact * 7);

  // 3. Validações com mensagens de suporte
  let hasError = false;

  // a) Dose maior que o conteúdo do frasco
  if (doseMg > vialMg) {
    hasError = true;
    notices.push({
      type: 'error',
      code: 'DOSE_EXCEEDS_VIAL',
      message: `A dose desejada (${doseValue} ${doseUnit} = ${doseMg} mg) é maior que o conteúdo total do frasco (${vialMg} mg).`,
    });
  }

  // b) Dose maior que a capacidade da seringa
  if (syringeUnitsExact > syringeSpec.capacityUnits) {
    hasError = true;
    const recommendedSyringe: SyringeType =
      syringeUnitsExact <= 50 ? 'u100-0.5ml' : 'u100-1ml';

    notices.push({
      type: 'error',
      code: 'DOSE_EXCEEDS_SYRINGE',
      message: `A dose calculada (${syringeUnitsExact.toFixed(1)} UI / ${volumeToInjectMl.toFixed(2)} mL) excede a capacidade máxima da seringa (${syringeSpec.capacityUnits} UI). Reduza o diluente ou utilize uma seringa de 100 UI.`,
      suggestedSyringeType: recommendedSyringe,
    });
  }

  // c) Volume menor que 2 UI (sub-dosagem difícil de medir com precisão)
  if (syringeSpec.isU100 && syringeUnitsExact < 2.0) {
    const suggestedDiluent = suggestAlternativeDiluent(vialMg, doseMg, 10);
    notices.push({
      type: 'warning',
      code: 'DOSE_TOO_SMALL',
      message: `Volume muito baixo (${syringeUnitsExact.toFixed(1)} UI / ${volumeToInjectMl.toFixed(3)} mL). Medir menos de 2 UI em seringas de insulina apresenta margem de erro.`,
      suggestedDiluentMl: suggestedDiluent,
    });
  }

  // d) Volume alto para aplicação subcutânea (> 1.2 mL)
  if (volumeToInjectMl > 1.2) {
    notices.push({
      type: 'warning',
      code: 'VOLUME_LARGE_FOR_SUBQ',
      message: `Volume por aplicação (${volumeToInjectMl.toFixed(2)} mL) é volumoso para via subcutânea. Recomenda-se reduzir o diluente ou fracionar a aplicação.`,
    });
  }

  // Formatação amigável da dose
  const doseFormatted =
    doseUnit === 'mcg'
      ? `${doseValue} mcg (${doseMg} mg)`
      : `${doseValue} mg`;

  // Resumo em texto simples
  const unitLabel = syringeSpec.isU100 ? 'UI' : syringeType === 'u40-1ml' ? 'UI (U-40)' : 'mL';
  const summaryText = `Puxe ${syringeUnitsRounded} ${unitLabel} (${volumeToInjectMl.toFixed(2).replace('.', ',')} mL) para obter ${doseFormatted}. Concentração: ${concentrationMgPerMl.toFixed(3).replace('.', ',')} mg/mL. Rendimento: ${dosesPerVialRounded.toFixed(1).replace('.', ',')} doses (${Math.round(weeksDurationRounded)} semanas a ${frequencySpec.label}).`;

  return {
    isValid: !hasError,
    hasError,
    doseMg,
    doseFormatted,
    concentrationMgPerMl,
    concentrationMcgPerMl,
    volumeToInjectMl,
    syringeUnitsExact,
    syringeUnitsRounded,
    syringePercentage,
    dosesPerVialExact,
    dosesPerVialRounded,
    weeksDurationExact,
    weeksDurationRounded,
    daysDurationRounded,
    syringeSpec,
    frequencySpec,
    notices,
    summaryText,
  };
}

/**
 * -------------------------------------------------------------
 * Módulo de Farmacocinética: Meia-Vida & Curva de Acúmulo
 * -------------------------------------------------------------
 */

export interface PeptideHalfLifeInfo {
  name: string;
  halfLifeDays: number;
  description: string;
}

export const PEPTIDE_HALF_LIFE_MAP: Record<string, PeptideHalfLifeInfo> = {
  'prod-tirzepatida-60': { name: 'Tirzepatida', halfLifeDays: 5.0, description: '~5 dias (120 h)' },
  'prod-tirzepatida-100': { name: 'Tirzepatida', halfLifeDays: 5.0, description: '~5 dias (120 h)' },
  'prod-retratutide-30': { name: 'Retratutide', halfLifeDays: 6.0, description: '~6 dias (144 h)' },
  'prod-retratutide-60': { name: 'Retratutide', halfLifeDays: 6.0, description: '~6 dias (144 h)' },
  'prod-cagrilintide-10': { name: 'Cagrilintida', halfLifeDays: 7.0, description: '~7 dias (168 h)' },
  'prod-bpc-tb-500-10': { name: 'BPC-157 / TB-500', halfLifeDays: 1.0, description: '~24 horas' },
  'prod-cjc-ipamorelin-10': { name: 'CJC-1295 / Ipamorelin', halfLifeDays: 0.125, description: '~3 horas' },
  'prod-ghk-cu-100': { name: 'GHK-Cu', halfLifeDays: 0.042, description: '~1 hora' },
  'prod-semax-10-cat': { name: 'Semax', halfLifeDays: 0.083, description: '~2 horas' },
  'prod-selank-5-cat': { name: 'Selank', halfLifeDays: 0.083, description: '~2 horas' },
  'prod-dsip-10': { name: 'DSIP', halfLifeDays: 0.062, description: '~1.5 hora' },
  'prod-nad-1000': { name: 'NAD+', halfLifeDays: 0.083, description: '~2 horas' },
  'prod-aod-9604-5': { name: 'AOD-9604', halfLifeDays: 0.125, description: '~3 horas' },
};

export interface PharmacokineticsResult {
  doseMg: number;
  halfLifeDays: number;
  intervalDays: number;
  accumulationFactor: number;
  peakPlateau: number;
  troughPlateau: number;
  plateauTimeDays: number;
  curvePoints: { day: number; level: number }[];
  summaryText: string;
}

/**
 * Calcula os parâmetros de acúmulo e os pontos do gráfico em dente de serra.
 * Fórmulas:
 *   fator = 1 / (1 - 2^(-intervalo / meia_vida))
 *   pico = dose * fator
 *   vale = pico - dose
 *   platô ≈ 5 * meia_vida
 */
export function calculatePharmacokinetics(
  doseMg: number,
  halfLifeDays: number,
  intervalDays: number
): PharmacokineticsResult {
  if (doseMg <= 0 || halfLifeDays <= 0 || intervalDays <= 0) {
    return {
      doseMg: 0,
      halfLifeDays: 7,
      intervalDays: 7,
      accumulationFactor: 1,
      peakPlateau: 0,
      troughPlateau: 0,
      plateauTimeDays: 35,
      curvePoints: [],
      summaryText: 'Parâmetros insuficientes para curva farmacocinética.',
    };
  }

  // Fator de acúmulo no estado de equilíbrio (steady-state)
  const ratio = intervalDays / halfLifeDays;
  const accumulationFactor = 1 / (1 - Math.pow(2, -ratio));
  const peakPlateau = doseMg * accumulationFactor;
  const troughPlateau = Math.max(0, peakPlateau - doseMg);
  const plateauTimeDays = Math.round(5 * halfLifeDays);

  // Geração de pontos para gráfico em dente de serra (sawtooth curve)
  // Simulamos um período que cobre pelo menos 5 meias-vidas e pelo menos 6 doses completas
  const totalDays = Math.max(plateauTimeDays * 1.25, intervalDays * 6);
  const numDoses = Math.ceil(totalDays / intervalDays);
  const points: { day: number; level: number }[] = [];

  let currentLevel = 0;
  const stepDays = Math.max(intervalDays / 20, 0.1);

  for (let dose = 0; dose < numDoses; dose++) {
    const doseStartTime = dose * intervalDays;

    // Imediatamente após a aplicação, nível sobe pelo valor da dose
    currentLevel += doseMg;
    points.push({ day: Math.round(doseStartTime * 10) / 10, level: currentLevel });

    // Decaimento exponencial durante o intervalo até a próxima dose
    const durationUntilNext = Math.min(intervalDays, totalDays - doseStartTime);
    let elapsed = stepDays;

    while (elapsed < durationUntilNext) {
      const t = doseStartTime + elapsed;
      // Decaimento radioativo/farmacológico: C(t) = C0 * 2^(-elapsed / halfLife)
      const decayedLevel = currentLevel * Math.pow(2, -elapsed / halfLifeDays);
      points.push({ day: Math.round(t * 10) / 10, level: decayedLevel });
      elapsed += stepDays;
    }

    // Nível ao final do intervalo antes da próxima dose
    currentLevel = currentLevel * Math.pow(2, -durationUntilNext / halfLifeDays);
  }

  const doseFormatted = doseMg < 1 ? `${Math.round(doseMg * 1000)} mcg` : `${doseMg.toFixed(2).replace('.', ',')} mg`;
  const peakFormatted = peakPlateau < 1 ? `${Math.round(peakPlateau * 1000)} mcg` : `${peakPlateau.toFixed(2).replace('.', ',')} mg`;
  const troughFormatted = troughPlateau < 1 ? `${Math.round(troughPlateau * 1000)} mcg` : `${troughPlateau.toFixed(2).replace('.', ',')} mg`;

  const summaryText = `Com ${doseFormatted} a cada ${intervalDays} dias, o nível no organismo estabiliza em ~${plateauTimeDays} dias e oscila entre ${troughFormatted} (vale antes da próxima dose) e ${peakFormatted} (pico logo após aplicar).`;

  return {
    doseMg,
    halfLifeDays,
    intervalDays,
    accumulationFactor,
    peakPlateau,
    troughPlateau,
    plateauTimeDays,
    curvePoints: points,
    summaryText,
  };
}

/**
 * -------------------------------------------------------------
 * Registro Histórico de Doses Aplicadas
 * -------------------------------------------------------------
 */
export interface DoseLogEntry {
  id: string;
  timestamp: string; // ISO
  dateFormatted: string;
  timeFormatted: string;
  productName: string;
  doseMg: number;
  doseFormatted: string;
  syringeUnits: number;
  injectionSite: string; // ex: 'Abdômen Direito', 'Abdômen Esquerdo', 'Coxa', 'Glúteo', 'Braço'
  notes?: string;
}

export const INJECTION_SITES = [
  'Abdômen Esquerdo',
  'Abdômen Direito',
  'Coxa Esquerda',
  'Coxa Direita',
  'Braço Esquerdo',
  'Braço Direito',
  'Glúteo Esquerdo',
  'Glúteo Direito',
] as const;

