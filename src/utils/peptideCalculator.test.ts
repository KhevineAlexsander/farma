/**
 * peptideCalculator.test.ts
 * Suíte de testes unitários para o módulo de cálculo de peptídeos.
 * Pode ser executado diretamente com: npx tsx src/utils/peptideCalculator.test.ts
 */

import {
  calculatePeptideDosage,
  convertDoseToMg,
  suggestAlternativeDiluent,
  roundToSyringeGraduation,
  CalculatorInput,
} from './peptideCalculator';

function assert(condition: boolean, testName: string, details?: any) {
  if (!condition) {
    console.error(`❌ FALHA NO TESTE: ${testName}`);
    if (details) console.error('Detalhes:', details);
    throw new Error(`Test failed: ${testName}`);
  }
  console.log(`✅ PASSOU: ${testName}`);
}

function approxEqual(a: number, b: number, epsilon: number = 0.01): boolean {
  return Math.abs(a - b) <= epsilon;
}

console.log('--- INICIANDO TESTES DO NÚCLEO DE CÁLCULO DE PEPTÍDEOS ---\n');

// 1. Teste Obrigatório da Especificação:
// 5 mg + 3 mL, dose 0,3 mg -> 18 UI, 0,18 mL, 1,667 mg/mL, 16,7 doses
{
  const input: CalculatorInput = {
    vialMg: 5,
    diluentMl: 3,
    doseValue: 0.3,
    doseUnit: 'mg',
    syringeType: 'u100-1ml',
    frequency: '1x_week',
  };

  const res = calculatePeptideDosage(input);

  assert(res.isValid, 'Caso obrigatório deve ser válido');
  assert(approxEqual(res.concentrationMgPerMl, 1.6666, 0.001), 'Concentração deve ser ~1,667 mg/mL', {
    obtido: res.concentrationMgPerMl,
    esperado: 1.667,
  });
  assert(approxEqual(res.volumeToInjectMl, 0.18, 0.005), 'Volume por dose deve ser 0,18 mL', {
    obtido: res.volumeToInjectMl,
    esperado: 0.18,
  });
  assert(approxEqual(res.syringeUnitsExact, 18.0, 0.05), 'UI exata deve ser 18 UI', {
    obtido: res.syringeUnitsExact,
    esperado: 18.0,
  });
  assert(res.syringeUnitsRounded === 18, 'UI arredondada deve ser 18 UI', {
    obtido: res.syringeUnitsRounded,
    esperado: 18,
  });
  assert(approxEqual(res.dosesPerVialRounded, 16.7, 0.05), 'Doses por frasco arredondado deve ser 16,7', {
    obtido: res.dosesPerVialRounded,
    esperado: 16.7,
  });
  assert(approxEqual(res.weeksDurationRounded, 16.7, 0.05), 'Semanas de duração (1x/sem) deve ser 16,7', {
    obtido: res.weeksDurationRounded,
    esperado: 16.7,
  });
  assert(res.syringePercentage === 18, '% da seringa de 100 UI deve ser 18%', {
    obtido: res.syringePercentage,
  });
}

// 2. Teste de conversão mcg -> mg (ex: BPC-157 10mg + 2mL, dose 250 mcg)
{
  const input: CalculatorInput = {
    vialMg: 10,
    diluentMl: 2,
    doseValue: 250,
    doseUnit: 'mcg',
    syringeType: 'u100-0.3ml', // seringa 30 UI com graduação de 0.5 UI
    frequency: 'daily',
  };

  const res = calculatePeptideDosage(input);

  assert(res.isValid, 'Conversão mcg -> mg deve ser válida');
  assert(res.doseMg === 0.25, '250 mcg deve ser 0.25 mg', { obtido: res.doseMg });
  assert(res.concentrationMgPerMl === 5, 'Concentração deve ser 5 mg/mL');
  assert(res.volumeToInjectMl === 0.05, 'Volume deve ser 0.05 mL');
  assert(res.syringeUnitsExact === 5, 'UI deve ser 5 UI');
  assert(res.syringeUnitsRounded === 5, 'UI arredondada deve ser 5 UI');
  assert(res.dosesPerVialRounded === 40, 'Doses por frasco deve ser 40');
  // 40 doses / 7 por semana = 5.7 semanas
  assert(approxEqual(res.weeksDurationRounded, 5.7, 0.05), 'Duração deve ser 5.7 semanas');
}

// 3. Teste de Validação: Dose excede o conteúdo do frasco (dose 10 mg em frasco de 5 mg)
{
  const input: CalculatorInput = {
    vialMg: 5,
    diluentMl: 2,
    doseValue: 10,
    doseUnit: 'mg',
    syringeType: 'u100-1ml',
    frequency: '1x_week',
  };

  const res = calculatePeptideDosage(input);

  assert(!res.isValid, 'Dose maior que frasco deve ser inválida');
  assert(res.hasError, 'Deve sinalizar hasError = true');
  assert(
    res.notices.some((n) => n.code === 'DOSE_EXCEEDS_VIAL'),
    'Deve conter aviso DOSE_EXCEEDS_VIAL'
  );
}

// 4. Teste de Validação: Dose excede a capacidade da seringa (ex: 45 UI em seringa de 30 UI)
{
  const input: CalculatorInput = {
    vialMg: 10,
    diluentMl: 3,
    doseValue: 1.5,
    doseUnit: 'mg',
    syringeType: 'u100-0.3ml', // máx 30 UI. Dose = 1.5 / (10/3) = 0.45 mL = 45 UI
    frequency: '1x_week',
  };

  const res = calculatePeptideDosage(input);

  assert(!res.isValid, 'Dose excedendo seringa deve ser inválida');
  assert(res.hasError, 'Deve ter hasError');
  const notice = res.notices.find((n) => n.code === 'DOSE_EXCEEDS_SYRINGE');
  assert(Boolean(notice), 'Deve emitir notice DOSE_EXCEEDS_SYRINGE');
  assert(notice?.suggestedSyringeType === 'u100-0.5ml', 'Deve sugerir seringa de 50 UI');
}

// 5. Teste de Sub-dosagem (< 2 UI) com Sugestão Automática de Diluente
{
  // Frasco 10 mg + 1 mL, dose 50 mcg (0.05 mg) -> volume = 0.005 mL -> 0.5 UI (muito pequeno!)
  const input: CalculatorInput = {
    vialMg: 10,
    diluentMl: 1,
    doseValue: 50,
    doseUnit: 'mcg',
    syringeType: 'u100-1ml',
    frequency: 'daily',
  };

  const res = calculatePeptideDosage(input);

  assert(res.isValid, 'Sub-dosagem é válida porém emite alerta preventivo');
  assert(!res.hasError, 'Sub-dosagem não deve bloquear cálculo mas emitir warning');
  const notice = res.notices.find((n) => n.code === 'DOSE_TOO_SMALL');
  assert(Boolean(notice), 'Deve emitir warning de DOSE_TOO_SMALL');
  assert(Boolean(notice?.suggestedDiluentMl && notice.suggestedDiluentMl > 1), 'Deve sugerir mais diluente', {
    sugerido: notice?.suggestedDiluentMl,
  });
}

// 6. Teste de arredondamento de graduação da seringa (0.5 UI vs 1.0 UI)
{
  // UI exata: 12.333 UI
  const step05 = roundToSyringeGraduation(12.333, 0.5); // deve dar 12.5 UI
  const step10 = roundToSyringeGraduation(12.333, 1.0); // deve dar 12 UI

  assert(step05 === 12.5, 'Arredondamento para 0.5 UI deve ser 12.5', { obtido: step05 });
  assert(step10 === 12, 'Arredondamento para 1.0 UI deve ser 12', { obtido: step10 });

  const step05b = roundToSyringeGraduation(12.18, 0.5); // deve dar 12.0 UI
  assert(step05b === 12.0, 'Arredondamento para 0.5 UI de 12.18 deve ser 12.0');
}

// 7. Teste de campos zerados
{
  const input: CalculatorInput = {
    vialMg: 0,
    diluentMl: 0,
    doseValue: 0,
    doseUnit: 'mg',
    syringeType: 'u100-1ml',
    frequency: '1x_week',
  };

  const res = calculatePeptideDosage(input);
  assert(!res.isValid && res.hasError, 'Campos zerados devem resultar em cálculo inválido sem quebrar');
}

// 8. Teste de Farmacocinética / Meia-Vida (Fórmula de Acúmulo no Platô da Zoukei)
// Dose: 0,3 mg, Meia-Vida: 7 dias, Intervalo: 7 dias -> Fator = 2x, Pico = 0,6 mg, Vale = 0,3 mg, Platô = 35 dias
{
  const { calculatePharmacokinetics } = await import('./peptideCalculator');
  const pk = calculatePharmacokinetics(0.3, 7.0, 7.0);

  assert(approxEqual(pk.accumulationFactor, 2.0, 0.01), 'Fator de acúmulo deve ser 2x', {
    obtido: pk.accumulationFactor,
  });
  assert(approxEqual(pk.peakPlateau, 0.6, 0.01), 'Pico no platô deve ser 0,6 mg', {
    obtido: pk.peakPlateau,
  });
  assert(approxEqual(pk.troughPlateau, 0.3, 0.01), 'Vale no platô deve ser 0,3 mg', {
    obtido: pk.troughPlateau,
  });
  assert(pk.plateauTimeDays === 35, 'Tempo até o platô deve ser 35 dias (5 meias-vidas)', {
    obtido: pk.plateauTimeDays,
  });
  assert(pk.curvePoints.length > 50, 'Deve gerar pontos suficientes para o gráfico em dente de serra');
}

console.log('\n🎉 TODOS OS TESTES UNITÁRIOS FORAM EXECUTADOS E PASSARAM COM 100% DE SUCESSO!\n');
