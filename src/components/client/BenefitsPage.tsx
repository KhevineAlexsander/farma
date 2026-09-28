import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Flame,
  Dna,
  Zap,
  Activity,
  Heart,
  Brain,
  ShieldCheck,
  Syringe,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Thermometer,
  Layers,
  ChevronRight,
  ShoppingBag,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { PeptideVial } from '../PeptideVial';
import { getProductDeduplicationKey } from '../../utils/productDeduplication';

interface ScientificPeptideData {
  id: string;
  name: string;
  categoryGoal: 'emagrecimento' | 'hipertrofia' | 'recuperacao' | 'cognicao' | 'longevidade' | 'estetica' | 'imunidade';
  headline: string;
  cellularMechanism: string;
  clinicalBenefits: string[];
  protocolSuggestion: {
    route: string;
    frequency: string;
    timing: string;
    cycleDuration: string;
  };
  synergyWith: string[];
  scientificReference: string;
  hplcHighlight: string;
}

const SCIENTIFIC_CATALOG_DATA: Record<string, ScientificPeptideData> = {
  'prod-botox-allergan-100': {
    id: 'prod-botox-allergan-100',
    name: 'BOTOX ALLERGAN',
    categoryGoal: 'estetica',
    headline: 'Padrão Ouro Mundial em Harmonização Facial & Bloqueio Neuromuscular',
    cellularMechanism: 'Bloqueio seletivo e reversível da liberação pré-sináptica de acetilcolina na junção neuromuscular, promovendo relaxamento transitório dos músculos hipercinéticos da face.',
    clinicalBenefits: [
      'Atenuação acentuada de rugas dinâmicas (glabela, fronte, perioculares)',
      'Prevenção de linhas estáticas profundas e remodelamento do terço superior',
      'Efeito clínico estável com duração de 4 a 6 meses',
      'Pó liofilizado sob vácuo estéril Allergan com pureza 100 U Original',
    ],
    protocolSuggestion: {
      route: 'Intramuscular pontual estéril',
      frequency: 'Sessão a cada 4 a 6 meses',
      timing: 'Realização em consultório com profissional habilitado',
      cycleDuration: 'Manutenção semestral contínua',
    },
    synergyWith: ['GHK-Cu (regeneração dérmica e sustentação de colágeno)'],
    scientificReference: 'Carruthers et al., Aesthetic Plastic Surgery & Consensus Guidelines for Botulinum Toxin Type A.',
    hplcHighlight: '100 U Allergan Biológico Padrão Farmacêutico',
  },
  'prod-botox-100': {
    id: 'prod-botox-100',
    name: 'BOTOX (100 UI)',
    categoryGoal: 'estetica',
    headline: 'Toxina Botulínica Tipo A Liofilizada para Linhas de Expressão & Harmonização',
    cellularMechanism: 'Bloqueio neuromuscular reversível da liberação pré-sináptica de acetilcolina na placa motora, promovendo relaxamento estético e atenuação rápida de rugas dinâmicas.',
    clinicalBenefits: [
      'Atenuação rápida de rugas e linhas hipercinéticas da face',
      'Investimento acessível de R$ 100,00 com padrão internacional de pureza',
      'Frasco estéril liofilizado com 100 Unidades Internacionais (UI)',
      'Excelente durabilidade clínica de 4 a 6 meses pós-aplicação',
    ],
    protocolSuggestion: {
      route: 'Intramuscular pontual estéril',
      frequency: 'A cada 4 a 6 meses',
      timing: 'Realização com profissional capacitado',
      cycleDuration: 'Manutenção periódica semestral',
    },
    synergyWith: ['GHK-Cu', 'SNAP-8'],
    scientificReference: 'Consensus Guidelines on Botulinum Toxin Type A for Aesthetic Indications.',
    hplcHighlight: '100 UI Padrão Farmacêutico Internacional',
  },
  'prod-tirzepatida-60': {
    id: 'prod-tirzepatida-60',
    name: 'Tirzepatida (60 mg)',
    categoryGoal: 'emagrecimento',
    headline: 'Duplo Agonista Incretínico GIP + GLP-1 de Alta Potência Metabólica',
    cellularMechanism: 'Ativa simultaneamente os receptores GIP e GLP-1. O GLP-1 atrasa o esvaziamento gástrico e potencializa a saciedade central no hipotálamo, enquanto o GIP modula o metabolismo adiposo e melhora a sensibilidade à insulina periférica sem estresse pancreático.',
    clinicalBenefits: [
      'Redução média de até 20-25% do peso corporal em protocolos contínuos',
      'Supressão prolongada de pensamentos obsessivos por comida ("food noise")',
      'Otimização do perfil glicêmico e hemoglobina glicada (HbA1c)',
      'Preservação muscular superior quando associado a treinamento resistido',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 aplicação semanal (a cada 7 dias)',
      timing: 'Qualquer horário fixo, preferencialmente pela manhã em jejum',
      cycleDuration: '12 a 24 semanas com titulação gradual',
    },
    synergyWith: ['BPC-157 (proteção da mucosa gástrica)', 'Cagrilintide (saciedade máxima combinada)'],
    scientificReference: 'Jastreboff AM et al. Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1, NEJM).',
    hplcHighlight: 'Pureza ≥ 99.8% HPLC com Laudo Cromatográfico',
  },
  'prod-tirzepatida-100': {
    id: 'prod-tirzepatida-100',
    name: 'Tirzepatida (100 mg)',
    categoryGoal: 'emagrecimento',
    headline: 'Apresentação Concentrada de Longo Prazo para Protocolos Avançados',
    cellularMechanism: 'Mesmo princípio farmacológico do duplo agonista GIP/GLP-1 com maior concentração de matéria-prima ativa no frasco liofilizado, permitindo maior durabilidade de estoque e excelente custo por mg.',
    clinicalBenefits: [
      'Maior rendimento de doses para fases de manutenção de dosagens médias/altas',
      'Estabilidade bioquímica refrigerada prolongada após reconstituição',
      'Controle glicêmico absoluto e saciedade profunda',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 vez por semana',
      timing: 'Dia fixo da semana',
      cycleDuration: 'Protocolos de 16 a 32 semanas',
    },
    synergyWith: ['AOD-9604 (lipólise visceral sinérgica)'],
    scientificReference: 'SURMOUNT Clinical Trials Portfolio, The Lancet / NEJM.',
    hplcHighlight: 'Pureza ≥ 99.8% HPLC',
  },
  'prod-retratutide-30': {
    id: 'prod-retratutide-30',
    name: 'Retratutide (30 mg)',
    categoryGoal: 'emagrecimento',
    headline: 'O Inovador Triplo Agonista Metabólico (GLP-1 + GIP + Glucagon)',
    cellularMechanism: 'Ativação unimolecular trilateral inédita. Enquanto GLP-1 e GIP controlam a fome e a insulina, o agonismo do receptor de Glucagon ativa o gasto energético de repouso, a termogênese hepática e estimula a beta-oxidação mitocondrial de ácidos graxos.',
    clinicalBenefits: [
      'Gasto calórico basal elevado mesmo em repouso via receptor de glucagon',
      'Redução recorde de gordura hepática (esteatose) e circunferência abdominal',
      'Saciedade imediata com menor dose inicial necessária',
      'Potencial lipolítico considerado superior a qualquer monoterapia existente',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 aplicação por semana (ou dividida em 2x)',
      timing: 'Pela manhã com hidratação abundante',
      cycleDuration: '12 a 20 semanas iniciando com 0.5mg a 1mg',
    },
    synergyWith: ['SS-31 (otimização mitocondrial)', 'BPC-157 (conforto gástrico)'],
    scientificReference: 'Rosenstock J et al. Retatrutide, a GIP, GLP-1 and Glucagon Receptor Agonist (NEJM 2023).',
    hplcHighlight: 'Pureza ≥ 99.7% HPLC',
  },
  'prod-retratutide-60': {
    id: 'prod-retratutide-60',
    name: 'Retratutide (60 mg)',
    categoryGoal: 'emagrecimento',
    headline: 'Concentração Máxima do Triplo Agonista para Ciclos Completos',
    cellularMechanism: 'Ativação tripla em dosagens ampliadas para pacientes que buscam cobertura contínua sem necessidade de reposição constante de frascos.',
    clinicalBenefits: [
      'Rendimento prolongado de semanas de tratamento',
      'Queima acelerada de tecido adiposo branco visceral',
      'Melhora robusta dos marcadores cardiovasculares e lipídicos',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 vez por semana',
      timing: 'Dia fixo',
      cycleDuration: '16 a 24 semanas',
    },
    synergyWith: ['SLU-PP-322 (mimético de exercício)'],
    scientificReference: 'NEJM Triple Hormone Receptor Agonist Clinical Evaluation.',
    hplcHighlight: 'Pureza ≥ 99.7% HPLC',
  },
  'prod-cagrilintide-10': {
    id: 'prod-cagrilintide-10',
    name: 'Cagrilintide (10 mg)',
    categoryGoal: 'emagrecimento',
    headline: 'Análogo Não Seletivo de Amilina para Supressão Gástrica Central',
    cellularMechanism: 'Liga-se aos receptores de calcitonina/amilina na área postrema do cérebro, retardando o esvaziamento gástrico gástrico e gerando saciedade via via neuroquímica totalmente independente do GLP-1.',
    clinicalBenefits: [
      'Quebra eficiente de platôs de perda de peso em usuários de Tirzepatida',
      'Sensação de estômago cheio com porções reduzidas de comida',
      'Redução da secreção pós-prandial de glucagon em excesso',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 vez por semana',
      timing: 'Co-administrado ou no mesmo dia do protocolo GLP-1',
      cycleDuration: '8 a 16 semanas',
    },
    synergyWith: ['Tirzepatida (o clássico duo CagriSema)'],
    scientificReference: 'Enebo LB et al. Safety, tolerability, and weight loss with Cagrilintide (Lancet).',
    hplcHighlight: 'Pureza ≥ 99.5% HPLC',
  },
  'prod-aod-9604-5': {
    id: 'prod-aod-9604-5',
    name: 'AOD-9604 (5 mg)',
    categoryGoal: 'emagrecimento',
    headline: 'Fragmento Lipolítico C-Terminal do Hormônio do Crescimento (hGH 177-191)',
    cellularMechanism: 'Ativa seletivamente os receptores beta-3 adrenérgicos nos adipócitos para liberar ácidos graxos livres sem se ligar ao receptor de GH clássico. Não causa hiperglicemia e não altera níveis de IGF-1 sistêmico.',
    clinicalBenefits: [
      'Queima focada de gordura teimosa abdominal e flancos',
      'Inibição da lipogênese (formação de nova gordura a partir de carboidratos)',
      'Sem impacto sobre a resistência à insulina ou cortisol',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: 'Diariamente ou 5 dias na semana',
      timing: 'Pela manhã em jejum pré-aeróbico ou antes de dormir',
      cycleDuration: '8 a 12 semanas',
    },
    synergyWith: ['SLU-PP-322', 'BPC-157 (proteção da cartilagem articular)'],
    scientificReference: 'Ng FM et al. Metabolic studies of hGH fragment (Endocrinology).',
    hplcHighlight: 'Pureza ≥ 99.6% HPLC',
  },
  'prod-slu-pp-322-5': {
    id: 'prod-slu-pp-322-5',
    name: 'SLU-PP-322 (5 mg)',
    categoryGoal: 'emagrecimento',
    headline: 'Mimético Farmacológico do Exercício Físico & Ativador ERR',
    cellularMechanism: 'Agonista sintético potente dos receptores nucleares relacionados ao estrogênio (ERR-alpha, ERR-beta e ERR-gamma). Desencadeia o programa de transcrição mitocondrial que o corpo naturalmente ativa durante corridas e treinos de longa duração.',
    clinicalBenefits: [
      'Eleva a queima de gordura muscular mesmo sem esforço físico extenuante',
      'Biogênese de novas mitocôndrias e elevação da capacidade aeróbica',
      'Acelera a conversão de tecido adiposo branco em gordura bege termogênica',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: 'Diária ou 5x na semana',
      timing: '30 a 60 minutos antes da primeira atividade do dia',
      cycleDuration: '6 a 10 semanas',
    },
    synergyWith: ['AOD-9604', 'NAD+ (combustível celular)'],
    scientificReference: 'Journal of Pharmacology and Experimental Therapeutics, Saint Louis University (2023).',
    hplcHighlight: 'Pureza ≥ 99.5% HPLC',
  },
  'prod-bpc-tb-500-10': {
    id: 'prod-bpc-tb-500-10',
    name: 'BPC-157 + TB-500 (10 mg)',
    categoryGoal: 'recuperacao',
    headline: 'O Mais Potente Complexo de Regeneração Tecidual, Articular e Anti-inflamatória',
    cellularMechanism: 'Sinergia biológica perfeita: BPC-157 ativa a angiogênese endotelial via via VEGF e upregulation de receptores de hormônio do crescimento nos fibroblastos; TB-500 sequestra actina monomérica, acelerando a migração celular e reparando tecidos conectivos profundos.',
    clinicalBenefits: [
      'Cicatrização acelerada de tendinites, bursites, distensões e rompimentos',
      'Reparo da mucosa do estômago e intestino (excelente para quem usa GLP-1)',
      'Redução drástica de dores crônicas e inflamação sistêmica',
      'Regeneração de colágeno em ligamentos e cartilagem articular',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) local ou sistêmica no abdômen',
      frequency: '1 a 2 vezes ao dia',
      timing: 'Ao acordar e/ou antes de deitar',
      cycleDuration: '4 a 8 semanas',
    },
    synergyWith: ['GHK-Cu', 'KPV (saúde intestinal e tecidual total)'],
    scientificReference: 'Sikiric P et al. Stable gastric pentadecapeptide BPC 157 in tissue healing (Curr Pharm Des).',
    hplcHighlight: 'Pureza ≥ 99.8% HPLC',
  },
  'prod-ghk-cu-100': {
    id: 'prod-ghk-cu-100',
    name: 'GHK-Cu (100 mg)',
    categoryGoal: 'estetica',
    headline: 'Tripeptídeo de Cobre Regenerativo Dérmico & Síntese de Colágeno',
    cellularMechanism: 'Complexo quelado de cobre com afinidade pelos fibroblastos dérmicos. Estimula a produção de colágeno tipos I e III, proteoglicanos, elastina e atua como quelante antioxidante contra danos foto-induzidos.',
    clinicalBenefits: [
      'Aumento expressivo na densidade, firmeza e elasticidade da pele',
      'Aceleração da cicatrização pós-laser, microagulhamento e cirurgias',
      'Estímulo folicular para crescimento capilar denso e volumoso',
      'Regulação de mais de 4.000 genes humanos voltados à jovialidade celular',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) ou microinjeções estéticas',
      frequency: '1 aplicação diária ou 3x na semana',
      timing: 'Noite',
      cycleDuration: '6 a 12 semanas',
    },
    synergyWith: ['Botox Allergan', 'NAD+ (rejuvenescimento sistêmico)'],
    scientificReference: 'Pickart L et al. Regenerative and Protective Actions of the GHK-Cu Peptide (BioMed Res Int).',
    hplcHighlight: 'Pureza ≥ 99.7% HPLC',
  },
  'prod-cjc-ipamorelin-10': {
    id: 'prod-cjc-ipamorelin-10',
    name: 'CJC-1295 + Ipamorelin (10 mg)',
    categoryGoal: 'hipertrofia',
    headline: 'Combo Sinérgico Secretagogo de GH com Liberação Pulsátil Fisiológica',
    cellularMechanism: 'CJC-1295 estimula os receptores de GHRH aumentando o volume do pulso de Hormônio do Crescimento. Ipamorelin atua nos receptores secretagogos de GH (GHS-R1a) mimetizando a grelina de forma seletiva, sem elevar cortisol ou prolactina.',
    clinicalBenefits: [
      'Ganhos sólidos de massa muscular magra e densidade óssea',
      'Recuperação neuromuscular profunda durante as fases de sono REM/Delta',
      'Queima sustentada de gordura corporal associada à melhora do tônus cutâneo',
      'Sem supressão do eixo hormonal natural da hipófise',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 aplicação diária (5 a 7 dias por semana)',
      timing: 'Antes de dormir (em estômago vazio há pelo menos 2h)',
      cycleDuration: '8 a 16 semanas',
    },
    synergyWith: ['DSIP (sono profundo)', 'Tesamorelin (gordura visceral)'],
    scientificReference: 'Teichman SL et al. Prolonged stimulation of growth hormone with CJC-1295 (J Clin Endocrinol Metab).',
    hplcHighlight: 'Pureza ≥ 99.6% HPLC',
  },
  'prod-ipamorelin-10': {
    id: 'prod-ipamorelin-10',
    name: 'Ipamorelin (10 mg)',
    categoryGoal: 'hipertrofia',
    headline: 'O Mais Limpo Secretagogo de GH da Farmacopeia Peptídica',
    cellularMechanism: 'Pentapeptídeo seletivo de primeira classe. Induz pulsos fisiológicos limpos de somatotropina sem estimular a liberação indesejada de ACTH, cortisol, aldosterona ou prolactina.',
    clinicalBenefits: [
      'Estímulo seguro de GH com zero retenção hídrica prejudicial',
      'Aceleração da recuperação muscular pós-treinos intensos',
      'Aumento da síntese proteica miofibrilar e fortalecimento de tendões',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 a 2 vezes ao dia',
      timing: 'Pós-treino imediato ou antes de dormir em jejum',
      cycleDuration: '8 a 12 semanas',
    },
    synergyWith: ['CJC-1295', 'BPC-157'],
    scientificReference: 'Raun K et al. Ipamorelin, the first selective growth hormone secretagogue (Eur J Endocrinol).',
    hplcHighlight: 'Pureza ≥ 99.5% HPLC',
  },
  'prod-tesamorelin-10-cat': {
    id: 'prod-tesamorelin-10-cat',
    name: 'Tesamorelin (10 mg)',
    categoryGoal: 'hipertrofia',
    headline: 'Análogo de GHRH com Aprovação para Redução Seletiva de Gordura Visceral',
    cellularMechanism: 'Peptídeo sintético de 44 aminoácidos com cauda de ácido trans-3-hexenoico. Estimula a síntese e liberação endógena de GH pela adenoipófise com afinidade especial para mobilização de gordura visceral profunda ao redor dos órgãos.',
    clinicalBenefits: [
      'Eliminação direcionada da gordura abdominal visceral (intra-hepática e mesentérica)',
      'Definição acentuada da musculatura abdominal e redução de cintura',
      'Normalização do perfil de triglicerídeos e lipídios aterogênicos',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) no abdômen',
      frequency: 'Diariamente (5 a 7 dias por semana)',
      timing: 'Ao acordar em jejum ou antes de deitar',
      cycleDuration: '8 a 16 semanas',
    },
    synergyWith: ['Ipamorelin', 'AOD-9604'],
    scientificReference: 'Falutz J et al. Metabolic effects of a growth hormone-releasing factor in visceral adiposity (NEJM).',
    hplcHighlight: 'Pureza ≥ 99.4% HPLC',
  },
  'prod-ss-31-10': {
    id: 'prod-ss-31-10',
    name: 'SS-31 (Elamipretide) (10 mg)',
    categoryGoal: 'longevidade',
    headline: 'Peptídeo de Alvo Mitocondrial para Proteção Celular e Cardiolipina',
    cellularMechanism: 'Tetrapeptídeo que atravessa livremente a membrana celular e se fixa na cardiolipina na membrana mitocondrial interna. Estabiliza a crista mitocondrial e otimiza a cadeia respiratória de transferência de elétrons.',
    clinicalBenefits: [
      'Restauração imediata da produção de ATP celular',
      'Redução dramática do estresse oxidativo e radicais livres mitocondriais',
      'Proteção cardíaca, renal e neurológica contra senescência',
      'Energia e resistência física sem qualquer efeito estimulante do SNC',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: 'Diária ou 5 dias por semana',
      timing: 'Pela manhã',
      cycleDuration: '4 a 8 semanas',
    },
    synergyWith: ['NAD+ (dupla imbatível de biohacking energético)', 'Retratutide'],
    scientificReference: 'Szeto HH. First-in-class cardiolipin-protective peptide SS-31 (Br J Pharmacol).',
    hplcHighlight: 'Pureza ≥ 99.7% HPLC',
  },
  'prod-semax-10-cat': {
    id: 'prod-semax-10-cat',
    name: 'Semax (10 mg)',
    categoryGoal: 'cognicao',
    headline: 'Heptapeptídeo Neurotrófico de BDNF para Foco, Memória e Neuroproteção',
    cellularMechanism: 'Fragmento modificado de ACTH(4-10) que não possui atividade hormonal adrenocortical. Estimula a expressão genética do BDNF (Brain-Derived Neurotrophic Factor) e TrkB no hipocampo e córtex pré-frontal.',
    clinicalBenefits: [
      'Elevação imediata do foco cirúrgico, raciocínio lógico e velocidade de processamento',
      'Atenuação da fadiga mental em dias de sobrecarga cognitiva ou estudo',
      'Proteção dos neurônios contra isquemia, hipóxia e estresse oxidativo',
      'Equilíbrio e modulação dos neurotransmissores serotonina e dopamina',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) ou Intranasal reconstituído',
      frequency: '1 a 2 vezes ao dia',
      timing: 'Manhã ou início da tarde (evitar uso noturno para não tirar o sono)',
      cycleDuration: '2 a 6 semanas com pausas',
    },
    synergyWith: ['Selank (equilíbrio entre foco afiado e calma emocional)'],
    scientificReference: 'Gudasheva TA et al. Design and synthesis of neuroprotective peptide Semax (Russ Chem Bull).',
    hplcHighlight: 'Pureza ≥ 99.9% HPLC',
  },
  'prod-selank-5-cat': {
    id: 'prod-selank-5-cat',
    name: 'Selank (5 mg)',
    categoryGoal: 'cognicao',
    headline: 'Ansiolítico Peptídico Sintético sem Sedação nem Tolerância',
    cellularMechanism: 'Análogo estabilizado da tuftsina. Regula os receptores de GABA, normaliza o metabolismo da serotonina e reduz a quebra das encefalinas endógenas (os peptídeos naturais do bem-estar).',
    clinicalBenefits: [
      'Alívio expressivo da ansiedade generalizada, angústia e fobia social',
      'Clareza mental e tranquilidade sem causar sonolência diurna ou lentidão motora',
      'Zero dependência química, zero síndrome de abstinência e zero tolerância',
      'Ação imuno-moduladora preventiva contra estresse crônico',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) ou Intranasal',
      frequency: '1 a 2 vezes ao dia',
      timing: 'Pela manhã e/ou em momentos de pico de estresse',
      cycleDuration: '2 a 8 semanas',
    },
    synergyWith: ['Semax', 'DSIP'],
    scientificReference: 'Kost NV et al. Semax and Selank in clinical neurology and psychiatry (Neurochem J).',
    hplcHighlight: 'Pureza ≥ 99.8% HPLC',
  },
  'prod-dsip-10': {
    id: 'prod-dsip-10',
    name: 'DSIP (Delta Sleep-Inducing Peptide) (10 mg)',
    categoryGoal: 'cognicao',
    headline: 'Indutor do Sono Profundo Reparador e Modulador Circadiano do Cortisol',
    cellularMechanism: 'Atua nos núcleos talâmicos e no hipotálamo, facilitando a transição neuronal para o padrão de ondas lentas delta cerebrais (fase IV reparadora do sono) e normalizando o ritmo diurno de secreção de cortisol.',
    clinicalBenefits: [
      'Aumento comprovado do tempo em sono profundo não-REM reparador',
      'Despertar revigorado sem a sensação de ressaca típica de hipnóticos convencionais',
      'Otimização do pulso noturno endógeno de GH induzido pelas ondas lentas',
      'Redução de quadros de insônia crônica e insônia causada por estresse',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: 'Diária antes de deitar',
      timing: '30 a 60 minutos antes de dormir em ambiente escuro',
      cycleDuration: '2 a 4 semanas para reset circadiano',
    },
    synergyWith: ['CJC-1295 + Ipamorelin', 'Epithalon'],
    scientificReference: 'Schoenenberger GA et al. Isolation, chemical characterization and properties of DSIP (Pflugers Arch).',
    hplcHighlight: 'Pureza ≥ 99.6% HPLC',
  },
  'prod-kpv-10': {
    id: 'prod-kpv-10',
    name: 'KPV (10 mg)',
    categoryGoal: 'imunidade',
    headline: 'Tripeptídeo Derivado da Alfa-MSH para Reparo Intestinal e Anti-inflamação',
    cellularMechanism: 'Penetra no núcleo celular dos colonócitos e enterócitos, bloqueando especificamente a ativação da via inflamatória NF-kB. Exibe propriedades antibacterianas naturais contra Staphylococcus e Candida albicans.',
    clinicalBenefits: [
      'Recuperação da integridade da barreira intestinal (combate a permeabilidade intestinal - Leaky Gut)',
      'Alívio rápido de sintomas inflamatórios em Colite, Doença de Crohn e SII',
      'Ação anti-inflamatória em dermatites, psoríase e acne inflamatória',
      'Excelente tolerabilidade sistêmica sem imunossupressão generalizada',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) ou Oral em solução',
      frequency: '1 a 2 vezes ao dia',
      timing: 'Pela manhã em jejum e antes de deitar',
      cycleDuration: '4 a 12 semanas',
    },
    synergyWith: ['BPC-157 (dupla de ouro gastrointestinal)', 'VIP'],
    scientificReference: 'Catania A et al. Targeting the anti-inflammatory peptide KPV in inflammatory bowel diseases (Pharmacol Res).',
    hplcHighlight: 'Pureza ≥ 99.7% HPLC',
  },
  'prod-nad-1000': {
    id: 'prod-nad-1000',
    name: 'NAD+ (1000 mg)',
    categoryGoal: 'longevidade',
    headline: 'Coenzima Mestra da Longevidade Celular, Sirtuínas e Reparo de DNA',
    cellularMechanism: 'Substrato vital indispensável para as enzimas sirtuínas (SIRT1-SIRT7) e PARP de reparo de quebras de DNA fita dupla. É a molécula central da fosforilação oxidativa mitocondrial para produção de ATP.',
    clinicalBenefits: [
      'Combate direto ao esgotamento mitocondrial associado ao envelhecimento',
      'Clareza mental imediata, proteção cardiovascular e vigor físico',
      'Ativação das vias epigenéticas de reparo e proteção do genoma',
      'Apresentação concentrada 1000mg para aplicações parenterais duradouras',
    ],
    protocolSuggestion: {
      route: 'Subcutânea lenta (SubQ) ou infusão profissional',
      frequency: '2 a 3 vezes por semana',
      timing: 'Pela manhã para sincronizar com o ritmo circadiano energético',
      cycleDuration: 'Uso contínuo em ciclos de 8 a 16 semanas',
    },
    synergyWith: ['SS-31', 'Epithalon', 'SLU-PP-322'],
    scientificReference: 'Sinclair DA et al. NAD+ metabolism and its role in human health and longevity (Cell Metabolism).',
    hplcHighlight: 'Pureza ≥ 99.9% HPLC',
  },
  'prod-epithalon-10-cat': {
    id: 'prod-epithalon-10-cat',
    name: 'Epithalon (10 mg)',
    categoryGoal: 'longevidade',
    headline: 'Tetrapeptídeo Epitalâmico Ativador da Enzima Telomerase',
    cellularMechanism: 'Desencadeia a transcrição da enzima telomerase nos tecidos somáticos, permitindo o alongamento e proteção das extremidades cromossômicas (telômeros), aumentando o limite de Hayflick de divisão celular.',
    clinicalBenefits: [
      'Preservação e alongamento do comprimento dos telômeros celulares',
      'Normalização da produção noturna de melatonina pela glândula pineal',
      'Melhora dos índices de sobrevida, imunocompetência e vitalidade geral',
      'Regulação neuroendócrina global do envelhecimento',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: '1 aplicação diária por ciclo curto de 10 a 20 dias',
      timing: 'Pela manhã',
      cycleDuration: 'Ciclo de 10 a 20 dias repetido a cada 6 meses',
    },
    synergyWith: ['NAD+', 'DSIP'],
    scientificReference: 'Khavinson VKh et al. Peptide Regulation of Gene Expression and Telomerase in Aging (Bull Exp Biol Med).',
    hplcHighlight: 'Pureza ≥ 99.6% HPLC',
  },
  'prod-hcg-5000': {
    id: 'prod-hcg-5000',
    name: 'HCG (5.000 UI)',
    categoryGoal: 'hipertrofia',
    headline: 'Gonadotrofina Coriônica Humana para Suporte Endócrino e Eixo HPTA',
    cellularMechanism: 'Atua como mimético biológico do hormônio luteinizante (LH), ligando-se diretamente aos receptores de LH nas células de Leydig dos testículos para estimular a produção autônoma de testosterona e espermatogênese.',
    clinicalBenefits: [
      'Manutenção do trofismo testicular durante protocolos com supressão hormonal',
      'Prevenção de atrofia e aceleração na recuperação do eixo HPTA pós-ciclo (TPC)',
      'Suporte à fertilidade, volume ejaculatório e vitalidade androgênica',
      'Padrão farmacêutico estéril com 5.000 Unidades Internacionais ativas',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) ou Intramuscular (IM)',
      frequency: '2 a 3 vezes por semana (ex: 250 a 500 UI)',
      timing: 'Dias fixos na semana',
      cycleDuration: 'Durante o protocolo ou em fase de TPC de 4 a 6 semanas',
    },
    synergyWith: ['Ipamorelin', 'PT-141'],
    scientificReference: 'Raveendran AV et al. Use of HCG in hypogonadism and testosterone restoration (Andrology).',
    hplcHighlight: 'Padrão Farmacêutico Biológico USP 5.000 UI',
  },
  'prod-pt-141-10': {
    id: 'prod-pt-141-10',
    name: 'PT-141 (Bremelanotide) (10 mg)',
    categoryGoal: 'estetica',
    headline: 'Agonista Central dos Receptores de Melanocortina para Vigor e Libido',
    cellularMechanism: 'Atua no sistema nervoso central estimulando receptores MC3R e MC4R no hipotálamo, ativando as vias dopaminérgicas do desejo e ereção, sem interferir no sistema cardiovascular ou exigir óxido nítrico endotelial.',
    clinicalBenefits: [
      'Aumento substancial do desejo sexual, libido e sensibilidade erógena (homens e mulheres)',
      'Ação neurológica direta independente do estresse ou cansaço diário',
      'Resposta prolongada de 8 a 16 horas após a aplicação',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: 'Sob demanda (máximo 2 a 3 vezes por semana)',
      timing: '1 a 2 horas antes da atividade íntima',
      cycleDuration: 'Uso pontual sob demanda',
    },
    synergyWith: ['Melanotan II'],
    scientificReference: 'Clayton AH et al. Bremelanotide for female and male sexual dysfunction (Expert Opin Investig Drugs).',
    hplcHighlight: 'Pureza ≥ 99.5% HPLC',
  },
  'prod-melanotan-ii-10': {
    id: 'prod-melanotan-ii-10',
    name: 'Melanotan II (10 mg)',
    categoryGoal: 'estetica',
    headline: 'Estimulador da Melanogênese para Bronzeamento Uniforme e Fotoproteção',
    cellularMechanism: 'Análogo sintético do hormônio alfa-MSH. Liga-se aos receptores MC1R nos melanócitos cutâneos, disparando a síntese de eumelanina (o pigmento escuro protetor natural da pele humana).',
    clinicalBenefits: [
      'Bronzeamento rápido, homogêneo e duradouro com exposição solar mínima',
      'Proteção celular endógena contra os danos das radiações UVA e UVB',
      'Efeito de elevação da libido e leve supressão do apetite como bônus',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ)',
      frequency: 'Diária até atingir a tonalidade desejada, depois 1 a 2x/semana',
      timing: 'Antes de deitar ou antes de breve exposição ao sol',
      cycleDuration: '2 a 4 semanas para indução, manutenção quinzenal',
    },
    synergyWith: ['GHK-Cu'],
    scientificReference: 'Dorr RT et al. Evaluation of melanotan-II in tanning and melanogenesis (Life Sci).',
    hplcHighlight: 'Pureza ≥ 99.6% HPLC',
  },
  'prod-vip-10': {
    id: 'prod-vip-10',
    name: 'VIP (Vasoactive Intestinal Peptide) (10 mg)',
    categoryGoal: 'imunidade',
    headline: 'Peptídeo Imuno-regulador para Equilíbrio Neuroendócrino e Pulmonar',
    cellularMechanism: 'Atua nos receptores VPAC1 e VPAC2, suprimindo citocinas inflamatórias Th1/Th17, promovendo vasodilatação e regulando o sistema imune da mucosa respiratória e digestiva.',
    clinicalBenefits: [
      'Alívio em quadros de hipersensibilidade inflamatória e biotoxinas (SIRS/CIRS)',
      'Otimização do tônus vascular pulmonar e oxigenação tecidual',
      'Regulação neuroimune e atenuação de fadiga crônica sistêmica',
    ],
    protocolSuggestion: {
      route: 'Subcutânea (SubQ) ou Intranasal',
      frequency: '1 a 2 vezes ao dia',
      timing: 'Manhã e tarde',
      cycleDuration: '4 a 8 semanas',
    },
    synergyWith: ['KPV', 'BPC-157'],
    scientificReference: 'Delgado M et al. Vasoactive intestinal peptide in immune homeostasis and inflammatory diseases (Nat Rev Immunol).',
    hplcHighlight: 'Pureza ≥ 99.7% HPLC',
  },
};

const OBJECTIVE_FILTERS = [
  { id: 'todos', label: 'Todos os Peptídeos', icon: Sparkles, count: 22 },
  { id: 'emagrecimento', label: 'Emagrecimento & Metabolismo', icon: Flame, color: 'text-rose-400', count: 7 },
  { id: 'hipertrofia', label: 'Massa Magra & GH', icon: Zap, color: 'text-blue-400', count: 4 },
  { id: 'recuperacao', label: 'Regeneração & Articulações', icon: Activity, color: 'text-emerald-400', count: 1 },
  { id: 'cognicao', label: 'Foco, Sono & Cognição', icon: Brain, color: 'text-amber-400', count: 3 },
  { id: 'longevidade', label: 'Longevidade & Biohacking', icon: Heart, color: 'text-purple-400', count: 3 },
  { id: 'estetica', label: 'Estética & Harmonização', icon: Sparkles, color: 'text-pink-400', count: 4 },
  { id: 'imunidade', label: 'Saúde Intestinal & Imunidade', icon: ShieldCheck, color: 'text-teal-400', count: 2 },
];

export const BenefitsPage: React.FC = () => {
  const {
    products,
    setCurrentView,
    addToCart,
    setSelectedProductDetail,
    setSelectedCalculatorProduct,
    showToast,
  } = useApp();

  const [activeObjective, setActiveObjective] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedPeptideId, setExpandedPeptideId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Filter products based on search and objective
  const filteredPeptides = useMemo(() => {
    const mapCategoryToGoal: Record<string, string> = {
      'emagrecimento': 'emagrecimento',
      'beleza': 'estetica',
      'desempenho': 'hipertrofia',
      'saúde': 'longevidade',
      'saude': 'longevidade',
      'acessórios': 'recuperacao',
      'acessorios': 'recuperacao',
    };

    const seenBenefitKeys = new Set<string>();
    return products.filter((prod) => {
      if (!prod || !prod.id) return false;
      const dedupeKey = getProductDeduplicationKey(prod.name, prod.dosage);
      if (seenBenefitKeys.has(dedupeKey)) return false;
      seenBenefitKeys.add(dedupeKey);

      const sciData = SCIENTIFIC_CATALOG_DATA[prod.id];
      const fallbackGoal = mapCategoryToGoal[(prod.category || '').toLowerCase()];
      const categoryMatches =
        activeObjective === 'todos' ||
        (sciData && sciData.categoryGoal === activeObjective) ||
        (fallbackGoal === activeObjective);

      if (!categoryMatches) return false;

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const nameMatch = (prod.name || '').toLowerCase().includes(q);
      const descMatch = (prod.description || '').toLowerCase().includes(q);
      const dosageMatch = (prod.dosage || '').toLowerCase().includes(q);
      const headlineMatch = sciData?.headline.toLowerCase().includes(q) || false;
      const benefitsMatch = Array.isArray(prod.benefits) && prod.benefits.some((b) => typeof b === 'string' && b.toLowerCase().includes(q));
      const mechanismMatch = sciData?.cellularMechanism.toLowerCase().includes(q) || false;

      return nameMatch || descMatch || dosageMatch || headlineMatch || benefitsMatch || mechanismMatch;
    });
  }, [products, activeObjective, searchTerm]);

  const handleOpenCalculator = (product: Product) => {
    setSelectedCalculatorProduct(product);
    setCurrentView('dosage-calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    showToast(`${product.name} adicionado ao carrinho com sucesso!`);
  };

  const handleOpenDietPlanner = () => {
    setCurrentView('diet-control');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 pb-24">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-800/80 bg-gradient-to-b from-blue-950/30 via-[#0B0F17] to-[#070A10]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Dna className="w-3.5 h-3.5" />
                <span>Base Científica & HPLC Comprovado</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Página de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">Benefícios & Protocolos</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Explore a ação celular, benefícios clínicos validados, dosagens recomendadas e pureza molecular (HPLC) de cada peptídeo da Peptide Imports Farma.
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
              <button
                onClick={() => {
                  setCurrentView('dosage-calculator');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Syringe className="w-4 h-4" />
                <span>Ir para Cálculo de Doses</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
              <button
                onClick={handleOpenDietPlanner}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Controle de Dieta & Macros</span>
              </button>
            </div>
          </div>

          {/* Quick Objective Pills Filter Bar */}
          <div className="mt-10 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                Filtrar por Objetivo Terapêutico
              </span>
              <span className="text-xs text-slate-400">
                Exibindo <strong className="text-white">{filteredPeptides.length}</strong> compostos
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {OBJECTIVE_FILTERS.map((obj) => {
                const Icon = obj.icon;
                const isActive = activeObjective === obj.id;
                return (
                  <button
                    key={obj.id}
                    onClick={() => setActiveObjective(obj.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 border-cyan-400'
                        : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : obj.color || 'text-cyan-400'}`} />
                    <span>{obj.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input Bar */}
            <div className="mt-4 relative max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, mecanismo (ex: GLP-1, colágeno, sono, tendão, GHRH)..."
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Peptides Benefits Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredPeptides.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhum peptídeo encontrado</h3>
            <p className="text-slate-400 text-xs mb-4">
              Não encontramos resultados para a busca "{searchTerm}". Tente outros termos ou limpe o filtro.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveObjective('todos');
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Resetar Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPeptides.map((product) => {
              const sci = SCIENTIFIC_CATALOG_DATA[product.id];
              const isExpanded = expandedPeptideId === product.id;

              return (
                <article
                  key={product.id}
                  className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-xl backdrop-blur-xs relative overflow-hidden"
                >
                  {/* Top Header Card */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left: Bottle & Main Information */}
                    <div className="flex items-start gap-4 sm:gap-6 flex-1">
                      {/* Vial Render */}
                      <div className="shrink-0 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-center w-24 h-32 sm:w-28 sm:h-36 shadow-inner">
                        <PeptideVial
                          capColor={product.capColor || '#0088FF'}
                          name={product.name}
                          dosage={product.dosage}
                          size="sm"
                          glow={true}
                        />
                      </div>

                      {/* Title & Key Highlights */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {product.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {product.purity || '99.7% HPLC'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-slate-800 border border-slate-700">
                            Dosagem: {product.dosage}
                          </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                          <span>{product.name}</span>
                          <span className="text-cyan-400 text-sm font-semibold">{product.dosage}</span>
                        </h2>

                        <p className="text-sm font-semibold text-cyan-300">
                          {sci?.headline || product.description}
                        </p>

                        <p className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-none leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick Price & Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                      <div className="text-left lg:text-right">
                        <div className="text-[11px] text-slate-400 font-medium">Investimento</div>
                        <div className="text-2xl font-black text-emerald-400">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-[11px] text-slate-500 line-through">
                            De R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenCalculator(product)}
                          className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Calcular unidades e seringa para este peptídeo"
                        >
                          <Syringe className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="hidden sm:inline">Calcular</span> Dose
                        </button>

                        <button
                          onClick={() => handleAddToCart(product)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Benefits List */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-4 border-t border-slate-800/70">
                    {(sci?.clinicalBenefits || product.benefits).slice(0, 3).map((benefit, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expand / Collapse Details Drawer */}
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setExpandedPeptideId(isExpanded ? null : product.id)}
                      className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Ocultar Detalhes Clínicos' : 'Ver Mecanismo Celular & Protocolo Completo'}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <button
                      onClick={() => setSelectedProductDetail(product)}
                      className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                    >
                      <span>Ficha Técnica do Catálogo</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Expanded Detailed Scientific Sheet */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-slate-800 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Mechanism of Action */}
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                          <Dna className="w-4 h-4 text-cyan-400" />
                          <span>Mecanismo de Ação Celular</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {sci?.cellularMechanism || product.description}
                        </p>
                      </div>

                      {/* Protocol Suggestions & Storage */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Protocol */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <Clock className="w-4 h-4" />
                            <span>Protocolo Sugerido na Literatura</span>
                          </div>
                          <ul className="text-xs space-y-1.5 text-slate-300">
                            <li>
                              <strong className="text-white">Via de Aplicação:</strong>{' '}
                              {sci?.protocolSuggestion.route || 'Subcutânea (SubQ)'}
                            </li>
                            <li>
                              <strong className="text-white">Frequência:</strong>{' '}
                              {sci?.protocolSuggestion.frequency || '1x na semana ou diário conforme prescrição'}
                            </li>
                            <li>
                              <strong className="text-white">Momento Ideal:</strong>{' '}
                              {sci?.protocolSuggestion.timing || 'Pela manhã ou antes de deitar'}
                            </li>
                            <li>
                              <strong className="text-white">Duração Recomendada:</strong>{' '}
                              {sci?.protocolSuggestion.cycleDuration || 'Ciclo de 8 a 16 semanas'}
                            </li>
                          </ul>
                        </div>

                        {/* Storage & Reconstitution */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                            <Thermometer className="w-4 h-4" />
                            <span>Reconstituição & Armazenamento</span>
                          </div>
                          <ul className="text-xs space-y-1.5 text-slate-300">
                            <li>
                              <strong className="text-white">Reconstituição:</strong>{' '}
                              {product.reconstitution || 'Reconstituir com 2ml de água bacteriostática estéril'}
                            </li>
                            <li>
                              <strong className="text-white">Conservação:</strong>{' '}
                              {product.storage || 'Armazenar de 2°C a 8°C (Geladeira). Não congelar após reconstituído.'}
                            </li>
                            <li>
                              <strong className="text-white">Sinergias Clássicas:</strong>{' '}
                              {sci?.synergyWith.join(' • ') || 'Pode ser associado a protocolos com acompanhamento'}
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* HPLC & Reference Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 text-cyan-300">
                          <Award className="w-4 h-4 text-cyan-400" />
                          <span>Certificado de Análise: {sci?.hplcHighlight || product.purity}</span>
                        </div>
                        {sci?.scientificReference && (
                          <div className="italic text-slate-400 text-[10px]">
                            Ref: {sci.scientificReference}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Comparative Matrix Section: Protocol Objectives at a glance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider inline-block">
            Quadro Comparativo
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Matriz de Objetivos & Peptídeos Indicados
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Encontre rapidamente a substância ideal conforme sua meta principal de saúde, performance ou estética.
          </p>
        </div>

        <div className="overflow-x-auto bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Objetivo Clínico</th>
                <th className="py-3.5 px-4 font-bold">Peptídeo Recomendado</th>
                <th className="py-3.5 px-4 font-bold">Mecanismo Central</th>
                <th className="py-3.5 px-4 font-bold">Frequência Típica</th>
                <th className="py-3.5 px-4 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Perda de Peso Rápida & Saciedade
                </td>
                <td className="py-3 px-4 font-semibold text-white">Tirzepatida (60mg / 100mg)</td>
                <td className="py-3 px-4 text-slate-400">Duplo agonista GIP + GLP-1, saciedade profunda e controle de insulina</td>
                <td className="py-3 px-4">1x por semana (SubQ)</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        const p = products.find((x) => x.id === 'prod-tirzepatida-60');
                        if (p) handleOpenCalculator(p);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                    >
                      Dose 60mg
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => {
                        const p = products.find((x) => x.id === 'prod-tirzepatida-100');
                        if (p) handleOpenCalculator(p);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                    >
                      Dose 100mg
                    </button>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Termogênese & Gordura Hepática
                </td>
                <td className="py-3 px-4 font-semibold text-white">Retratutide (30mg / 60mg)</td>
                <td className="py-3 px-4 text-slate-400">Triplo agonista GLP-1 + GIP + Glucagon com gasto calórico basal</td>
                <td className="py-3 px-4">1x por semana (SubQ)</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        const p = products.find((x) => x.id === 'prod-retratutide-30');
                        if (p) handleOpenCalculator(p);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                    >
                      Dose 30mg
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => {
                        const p = products.find((x) => x.id === 'prod-retratutide-60');
                        if (p) handleOpenCalculator(p);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                    >
                      Dose 60mg
                    </button>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Regeneração de Tendões & Articulações
                </td>
                <td className="py-3 px-4 font-semibold text-white">BPC-157 + TB-500 (10mg)</td>
                <td className="py-3 px-4 text-slate-400">Angiogênese rápida e reparação de actina celular em lesões</td>
                <td className="py-3 px-4">1 a 2x ao dia (SubQ)</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      const p = products.find((x) => x.id === 'prod-bpc-tb-500-10');
                      if (p) handleOpenCalculator(p);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    Calcular Dose
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-blue-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Hipertrofia Limpa & Estímulo de GH
                </td>
                <td className="py-3 px-4 font-semibold text-white">CJC-1295 + Ipamorelin (10mg)</td>
                <td className="py-3 px-4 text-slate-400">Pulso fisiológico de hormônio do crescimento sem elevação de prolactina</td>
                <td className="py-3 px-4">5 a 7x/semana à noite</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      const p = products.find((x) => x.id === 'prod-cjc-ipamorelin-10');
                      if (p) handleOpenCalculator(p);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    Calcular Dose
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-pink-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Colágeno, Cabelo & Pele
                </td>
                <td className="py-3 px-4 font-semibold text-white">GHK-Cu (100mg)</td>
                <td className="py-3 px-4 text-slate-400">Tripeptídeo de cobre ativador de síntese de colágeno tipos I/III</td>
                <td className="py-3 px-4">Diário ou 3x/semana</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      const p = products.find((x) => x.id === 'prod-ghk-cu-100' || x.id === 'prod-ghkcu-100');
                      if (p) handleOpenCalculator(p);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    Calcular Dose
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-pink-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Harmonização Facial & Rugas Dinâmicas
                </td>
                <td className="py-3 px-4 font-semibold text-white">BOTOX (100 UI) / Allergan (100 UI)</td>
                <td className="py-3 px-4 text-slate-400">Bloqueio neuromuscular reversível com relaxamento facial e prevenção de linhas</td>
                <td className="py-3 px-4">Semestral (4 a 6 meses)</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        const p = products.find((x) => x.id === 'prod-botox-100');
                        if (p) handleOpenCalculator(p);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                    >
                      Botox 100 UI (R$ 100)
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => {
                        const p = products.find((x) => x.id === 'prod-botox-allergan-100');
                        if (p) handleOpenCalculator(p);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                    >
                      Allergan 100 UI (R$ 300)
                    </button>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-amber-400 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  Foco Cognitivo, Memória & BDNF
                </td>
                <td className="py-3 px-4 font-semibold text-white">Semax (10mg)</td>
                <td className="py-3 px-4 text-slate-400">Upregulation de BDNF no hipocampo para foco cirúrgico e neuroproteção</td>
                <td className="py-3 px-4">1 a 2x ao dia pela manhã</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      const p = products.find((x) => x.id === 'prod-semax-10-cat' || x.id === 'prod-semax-10');
                      if (p) handleOpenCalculator(p);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    Calcular Dose
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-purple-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  Biohacking Mitocondrial & Energia
                </td>
                <td className="py-3 px-4 font-semibold text-white">NAD+ (1000mg) + SS-31</td>
                <td className="py-3 px-4 text-slate-400">Combustível de sirtuínas e estabilização de cardiolipina celular</td>
                <td className="py-3 px-4">2 a 3x por semana</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      const p = products.find((x) => x.id === 'prod-nad-1000');
                      if (p) handleOpenCalculator(p);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    Calcular Dose
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-800/80">
        <div className="text-center mb-8 space-y-2">
          <HelpCircle className="w-8 h-8 text-cyan-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">Dúvidas Frequentes dos Clientes</h2>
          <p className="text-slate-400 text-xs">
            Orientações fundamentais de biossegurança e manipulação farmacêutica de peptídeos.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Qual diluente devo utilizar para reconstituir os peptídeos?',
              a: 'Recomenda-se exclusivamente Água Bacteriostática estéril (água para injeção com 0,9% de álcool benzílico). O agente bacteriostático inibe qualquer proliferação bacteriana por até 30 a 45 dias sob refrigeração. Se usar água estéril comum para injeção (sem conservante), o frasco deve ser consumido em pouquíssimos dias.',
            },
            {
              q: 'Como devo guardar os peptídeos antes e após a reconstituição?',
              a: 'Em pó liofilizado (antes de misturar): podem ser mantidos em local fresco ao abrigo da luz ou na geladeira de 2°C a 8°C. Após reconstituídos com água bacteriostática: DEVEM ser mantidos obrigatoriamente na geladeira entre 2°C e 8°C, nunca no congelador (o congelamento da solução rompe as cadeias peptídicas).',
            },
            {
              q: 'Posso agitar o frasco para dissolver o pó mais rápido?',
              a: 'NUNCA agite o frasco com vigor! Peptídeos são estruturas tridimensionais frágeis ligadas por pontes de hidrogênio e dissulfeto. Introduza a água bacteriostática escorrendo lentamente pelas paredes de vidro do frasco e faça movimentos circulares suaves até a dissolução completa.',
            },
            {
              q: 'Posso aplicar dois peptídeos no mesmo dia?',
              a: 'Sim, a maioria dos protocolos modernos combina compostos sinérgicos (ex: Tirzepatida semanal + BPC-157 diário; ou CJC-1295 + Ipamorelin). Não é recomendado misturar produtos de frascos diferentes dentro da mesma seringa sem prescrição médica; utilize uma seringa descartável estéril nova para cada aplicação.',
            },
          ].map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full py-3.5 px-4 text-left font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between gap-3 hover:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA to Calculator & Diet */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-gradient-to-r from-blue-900/40 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Pronto para iniciar seu protocolo com precisão milimétrica?
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Utilize nossa Calculadora Interativa de Doses para saber exatamente quantas unidades (UI) puxar na seringa ou calibre seu plano nutricional sob medida.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentView('dosage-calculator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Syringe className="w-4 h-4" />
              <span>Abrir Calculadora de Doses</span>
            </button>
            <button
              onClick={handleOpenDietPlanner}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Planejar Dieta do Protocolo</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
