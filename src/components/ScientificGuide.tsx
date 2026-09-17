import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Dna,
  Flame,
  Activity,
  Zap,
  Brain,
  Sparkles,
  Heart,
  ShieldCheck,
  HelpCircle,
  Layers,
  Syringe,
  Calculator,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ScientificGuide: React.FC = () => {
  const { setCurrentView, setSelectedCategory, setSearchQuery } = useApp();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPeptideCategory, setSelectedPeptideCategory] = useState<string>('all');
  const [expandedPeptide, setExpandedPeptide] = useState<string | null>('retatrutida');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Interactive Reconstitution Calculator State
  const [calcPeptideMg, setCalcPeptideMg] = useState<number>(5);
  const [calcWaterMl, setCalcWaterMl] = useState<number>(2);
  const [calcDesiredDoseMcg, setCalcDesiredDoseMcg] = useState<number>(250);

  // Math for calculator:
  // Concentration = (calcPeptideMg * 1000) / calcWaterMl  mcg/mL
  // Volume to inject = calcDesiredDoseMcg / Concentration mL
  // UI units on U-100 syringe = Volume * 100
  const concentrationMcgPerMl = (calcPeptideMg * 1000) / (calcWaterMl || 1);
  const volumeToInjectMl = calcDesiredDoseMcg / (concentrationMcgPerMl || 1);
  const unitsOnSyringe = Math.round(volumeToInjectMl * 100 * 10) / 10;

  // Categories & Peptides Data from the provided PDFs
  const peptideDatabase = [
    // 1. Perda de Peso & Metabolismo
    {
      id: 'retatrutida',
      name: 'Retatrutida (GLP-3 RT)',
      category: 'metabolismo',
      categoryLabel: 'Perda de Peso & Metabolismo',
      badge: 'Triplo Agonista',
      headline: 'O Triplo Agonista Metabólico (GLP-1 + GIP + Glucagon)',
      scientificSummary:
        'A Retatrutida é um novo agonista unimolecular triplo inovador que atua simultaneamente nos receptores GLP-1, GIP e Glucagon. Essa ativação multipathway sinérgica promove intensa supressão do apetite, melhora da sensibilidade à insulina e aceleração do gasto energético através da termogênese e oxidação lipídica hepática.',
      mechanism:
        'GLP-1 retarda o esvaziamento gástrico e induz saciedade central no hipotálamo; GIP potencializa a resposta insulínica; Glucagon estimula a lipólise profunda e o gasto calórico basal.',
      dosage: {
        initial: '0,5 mg a 1 mg / semana',
        common: '1 mg a 4 mg / semana (dividido em 1 a 2 aplicações)',
        max: '12 mg / semana',
        route: 'Subcutânea (SubQ)',
        timing: 'Qualquer dia fixo na semana, preferencialmente pela manhã.',
      },
      practicalTips: [
        'Inicie com 0,5 mg/semana e escale lentamente a cada 2 a 4 semanas.',
        'Mantenha alta hidratação e reposição de eletrólitos (potássio e magnésio).',
        'Treinamento resistido obrigatório para preservar massa magra.',
      ],
      warnings: 'Pode causar náuseas e redução de apetite nos primeiros dias de adaptação.',
    },
    {
      id: 'cagrisema',
      name: 'CagriSema (Cagrilintida + Semaglutida)',
      category: 'metabolismo',
      categoryLabel: 'Perda de Peso & Metabolismo',
      badge: 'Duplo Sinergismo',
      headline: 'Sinergia de Agonista GLP-1 com Análogo de Amilina',
      scientificSummary:
        'Combinação de Cagrilintida (análogo da amilina) e Semaglutida (agonista GLP-1). Proporciona controle sinérgico no sistema nervoso central para supressão profunda do apetite e retardo no esvaziamento gástrico com maior preservação de massa magra.',
      mechanism:
        'Ativação dupla de receptores de amilina e GLP-1 no cérebro e trato gastrointestinal, estabilizando a glicemia de jejum e os picos pós-prandiais de insulina.',
      dosage: {
        initial: '50 mcg a 100 mcg de cada composto / semana',
        common: '100 mcg a 150 mcg de cada composto / semana',
        max: 'Ajuste progressivo conforme tolerância',
        route: 'Subcutânea (SubQ)',
        timing: '1 vez por semana.',
      },
      practicalTips: [
        'Ajuste semanal para evitar desconfortos gastrointestinais.',
        'Pode ser combinado com HGH Frag ou AOD-9604 em recomposição agressiva.',
      ],
      warnings: 'Evite aumentos bruscos de dose.',
    },
    {
      id: 'aod9604',
      name: 'AOD-9604',
      category: 'metabolismo',
      categoryLabel: 'Perda de Peso & Metabolismo',
      badge: 'Lipolítico Puro',
      headline: 'Fragmento Lipolítico do GH (C-Terminal 177-191)',
      scientificSummary:
        'Fragmento peptídico modificado do hormônio do crescimento (hGH 177–191), desenvolvido para isolar e potencializar a queima de gordura sem elevar os níveis de IGF-1, sem alterar a glicemia e sem efeitos proliferativos.',
      mechanism:
        'Estimula a lipólise via receptores β-adrenérgicos e ativação de AMPK nos adipócitos, inibindo a lipogênese (formação de nova gordura).',
      dosage: {
        initial: '250 mcg / dia',
        common: '250 mcg a 500 mcg / dia',
        max: '1000 mcg / dia',
        route: 'Subcutânea (SubQ)',
        timing: 'Pela manhã em jejum, 30 a 60 min antes da primeira refeição ou treino.',
      },
      practicalTips: [
        'Não necessita de ciclos ou TPC, pois não interfere no eixo hormonal.',
        'Excelente combinação com MOTS-c ou 5-Amino-1MQ para sinergia mitocondrial.',
      ],
      warnings: 'Excelente tolerância; praticamente isento de efeitos colaterais sistêmicos.',
    },
    {
      id: 'hghfrag',
      name: 'HGH Frag 176-191',
      category: 'metabolismo',
      categoryLabel: 'Perda de Peso & Metabolismo',
      badge: 'Gordura Teimosa',
      headline: 'O Queimador Direto de Gordura Visceral e Teimosa',
      scientificSummary:
        'Segmento dos aminoácidos 176 a 191 do hormônio do crescimento humano. 12,5 vezes mais potente que o GH íntegro para a lipólise, sem promover retenção hídrica ou resistência à insulina.',
      mechanism:
        'Mobiliza ácidos graxos e glicerol diretamente dos adipócitos mais resistentes (tecido adiposo visceral e periumbilical).',
      dosage: {
        initial: '200 mcg a 250 mcg / dia',
        common: '250 mcg a 500 mcg / dia (1 a 2 vezes ao dia)',
        max: '1000 mcg / dia',
        route: 'Subcutânea (SubQ)',
        timing: 'Em jejum pela manhã e/ou 30 min antes do exercício cardiovascular.',
      },
      practicalTips: [
        'Mantenha jejum estrito de carboidratos por pelo menos 1 hora após a aplicação.',
        'Excelente sinergia com CJC-1295 ou Ipamorelina.',
      ],
      warnings: 'Não utilizar imediatamente após refeições ricas em açúcar ou carboidratos.',
    },
    {
      id: '5amino1mq',
      name: '5-Amino-1MQ',
      category: 'metabolismo',
      categoryLabel: 'Perda de Peso & Metabolismo',
      badge: 'Inibidor NNMT',
      headline: 'Acelerador Mitocondrial e Modulador Epigenético',
      scientificSummary:
        'Inibidor seletivo da enzima NNMT (Nicotinamida N-metiltransferase). Aumenta os níveis celulares de NAD+ e a taxa metabólica basal sem agir como estimulante cardíaco.',
      mechanism:
        'Bloqueia a NNMT nos adipócitos e miócitos, elevando a fosforilação oxidativa e impedindo a estocagem de gordura.',
      dosage: {
        initial: '50 mg / dia',
        common: '50 mg a 100 mg / dia',
        max: '100 mg / dia',
        route: 'Oral (Cápsula)',
        timing: 'Pela manhã com ou sem alimentos.',
      },
      practicalTips: [
        'Efeito cumulativo ao longo de 4 a 8 semanas.',
        'Preserva massa magra durante fases de déficit calórico estrito.',
      ],
      warnings: 'Não causa taquicardia ou ansiedade (mecanismo não-adrenérgico).',
    },

    // 2. Regeneração & Cicatrização
    {
      id: 'bpc157',
      name: 'BPC-157 (Body Protection Compound)',
      category: 'regeneracao',
      categoryLabel: 'Regeneração, Tecidos & Cicatrização',
      badge: 'Padrão Ouro de Cura',
      headline: 'O Peptídeo Curador Universal para Tendões, Músculos e Intestino',
      scientificSummary:
        'Pentadecapeptídeo derivado de uma proteína protetora gástrica humana. É um dos compostos de cura mais estudados e prescritos no mundo para lesões musculares, tendinosas, ligamentares e inflamações intestinais.',
      mechanism:
        'Acelera a angiogênese (VEGF), ativa a síntese de colágeno, modula o óxido nítrico e repara o endotélio e a mucosa gastrointestinal.',
      dosage: {
        initial: '250 mcg / dia',
        common: '250 mcg a 500 mcg / dia (1 ou 2 tomadas)',
        max: '1000 mcg / dia em lesões agudas',
        route: 'Subcutânea (próximo à lesão ou no abdômen) ou Oral (para intestino)',
        timing: 'Manhã e/ou noite.',
      },
      practicalTips: [
        'Para lesões articulares: aplique SubQ o mais próximo possível do local dolorido.',
        'Para permeabilidade intestinal (leaky gut) ou gastrite: uso oral é altamente eficaz.',
        'Sinergia clássica: BPC-157 + TB-500 (Mistura KLOW).',
      ],
      warnings: 'Excelente perfil de biocompatibilidade e segurança clínica.',
    },
    {
      id: 'tb500',
      name: 'TB-500 (Timosina Beta-4)',
      category: 'regeneracao',
      categoryLabel: 'Regeneração, Tecidos & Cicatrização',
      badge: 'Cura Sistêmica',
      headline: 'Reparador de Tecidos Moles e Modulador da Actina',
      scientificSummary:
        'Versão sintética do domínio bioativo da Timosina Beta-4. Atua sistemicamente no organismo reparando músculos, tendões, ligamentos, tecido cardíaco e neural.',
      mechanism:
        'Regula a proteína actina (10% das proteínas celulares), estimulando a migração de células-tronco e queratinócitos para áreas lesadas com potente ação anti-inflamatória.',
      dosage: {
        initial: '2 mg a 2,5 mg / semana',
        common: '4 mg a 6 mg / semana (dividido em 2 aplicações de 2 a 3 mg)',
        max: '10 mg / semana (em fase aguda de lesão)',
        route: 'Subcutânea ou Intramuscular',
        timing: '2 vezes por semana (ex: segunda e quinta) durante 4 a 6 semanas.',
      },
      practicalTips: [
        'Fase de carga de 4 a 6 semanas, seguida de manutenção quinzenal se necessário.',
        'Como viaja longas distâncias no corpo, pode ser aplicado no abdômen com efeito sistêmico.',
      ],
      warnings: 'Não precisa de aplicação estritamente local devido ao seu peso molecular leve.',
    },
    {
      id: 'kpv',
      name: 'KPV (Lysine-Proline-Valine)',
      category: 'regeneracao',
      categoryLabel: 'Regeneração, Tecidos & Cicatrização',
      badge: 'Anti-inflamatório Puro',
      headline: 'Tripeptídeo Bloqueador de Vias Inflamatórias (NF-κB)',
      scientificSummary:
        'Tripeptídeo bioativo derivado do α-MSH. Atua como um potente agente anti-inflamatório sem causar qualquer imunossupressão ou efeitos hormonais.',
      mechanism:
        'Ativa o receptor MC1R em células imunológicas e inibe a via inflamatória NF-κB, reduzindo citocinas inflamatórias no intestino, pele e articulações.',
      dosage: {
        initial: '250 mcg / dia',
        common: '250 mcg a 500 mcg / dia',
        max: '1000 mcg / dia',
        route: 'Oral, Subcutânea ou Tópica',
        timing: 'Diariamente com as refeições ou aplicação local.',
      },
      practicalTips: [
        'Excelente para colite, síndrome do intestino irritável, psoríase e dermatites.',
        'Pode ser empilhado com BPC-157 e LL-37.',
      ],
      warnings: 'Composto extremamente suave e bem tolerado.',
    },

    // 3. Hipertrofia & Secretagogos de GH
    {
      id: 'cjc1295',
      name: 'CJC-1295 (Com e Sem DAC)',
      category: 'hipertrofia',
      categoryLabel: 'Hipertrofia & Secretagogos de GH',
      badge: 'Amplificador de GH',
      headline: 'Análogo Sintético de GHRH para Liberação Natural de GH',
      scientificSummary:
        'Análogo do Hormônio Liberador do Hormônio do Crescimento. Estimula a hipófise anterior a produzir pulsos fisiológicos de GH e IGF-1 sem suprimir a produção própria do organismo.',
      mechanism:
        'Liga-se aos receptores de GHRH na pituitária. A versão com DAC se liga à albumina plasmática estendendo a meia-vida para até 8 dias; a versão sem DAC (Mod GRF 1-29) mimetiza picos pulsáteis naturais.',
      dosage: {
        initial: '100 mcg / dose (Sem DAC) ou 2 mg / semana (Com DAC)',
        common: '100 a 200 mcg 2-3x/dia (Sem DAC) | 2 mg 2x/semana (Com DAC)',
        max: '300 mcg / dose',
        route: 'Subcutânea (SubQ)',
        timing: 'Sem DAC: pela manhã e antes de dormir. Com DAC: 2x na semana.',
      },
      practicalTips: [
        'Sinergia perfeita: combine CJC-1295 com Ipamorelina para liberação multiplicada de GH.',
        'Aplicar sempre com estômago vazio (pelo menos 1h de jejum).',
      ],
      warnings: 'Sem impacto no eixo gonadal; não exige terapia pós-ciclo.',
    },
    {
      id: 'ipamorelin',
      name: 'Ipamorelina',
      category: 'hipertrofia',
      categoryLabel: 'Hipertrofia & Secretagogos de GH',
      badge: 'Liberação Limpa',
      headline: 'O Secretagogo Mais Seletivo e Seguro de GH',
      scientificSummary:
        'Pentapeptídeo mimético da grelina de terceira geração. Estimula fortemente a secreção de GH sem elevar significativamente cortisol ou prolactina.',
      mechanism:
        'Agonista seletivo do receptor GHS-R1a na hipófise, provocando pulsos limpos de GH com máxima segurança biológica.',
      dosage: {
        initial: '100 mcg / dose',
        common: '100 mcg a 200 mcg (2 a 3 vezes ao dia)',
        max: '300 mcg / dose',
        route: 'Subcutânea (SubQ)',
        timing: 'Pela manhã, pós-treino e antes de dormir.',
      },
      practicalTips: [
        'Melhora profunda da qualidade do sono REM e recuperação muscular.',
        'Não estimula fome descontrolada como o GHRP-6.',
      ],
      warnings: 'Mantenha pelo menos 30 min de jejum antes e após a aplicação.',
    },
    {
      id: 'igf1lr3',
      name: 'IGF-1 LR3 (Long R3)',
      category: 'hipertrofia',
      categoryLabel: 'Hipertrofia & Secretagogos de GH',
      badge: 'Hiperplasia Muscular',
      headline: 'Fator de Crescimento Prolongado para Anabolismo e Divisão Celular',
      scientificSummary:
        'Variante modificada de 83 aminoácidos do IGF-1 humano. A substituição da arginina e a extensão N-terminal aumentam sua meia-vida em até 120 vezes em comparação com o IGF-1 padrão.',
      mechanism:
        'Ativação potente do eixo PI3K/Akt/mTOR, estimulando hiperplasia (criação de novas células musculares) e captação massiva de aminoácidos.',
      dosage: {
        initial: '20 mcg a 40 mcg / dia',
        common: '40 mcg a 50 mcg / dia',
        max: '80 mcg / dia',
        route: 'Subcutânea bilateral no músculo trabalhado pós-treino',
        timing: 'Imediatamente após o treino ou pela manhã.',
      },
      practicalTips: [
        'Consuma carboidratos e proteínas após a aplicação para evitar hipoglicemia.',
        'Ciclos recomendados de 4 a 6 semanas com período de descanso.',
      ],
      warnings: 'Cuidado com dosagens excessivas para prevenir hipoglicemia.',
    },
    {
      id: 'tesamorelin',
      name: 'Tesamorelina',
      category: 'hipertrofia',
      categoryLabel: 'Hipertrofia & Secretagogos de GH',
      badge: 'Gordura Visceral',
      headline: 'Redutor Especializado de Gordura Visceral Profunda',
      scientificSummary:
        'Análogo sintético de GHRH aprovado pela FDA para eliminação de gordura intra-abdominal profunda e melhora dos marcadores cardiovasculares.',
      mechanism:
        'Estimula a síntese endógena de GH, promovendo lipólise seletiva nos tecidos adiposos viscerais ao redor dos órgãos vitais.',
      dosage: {
        initial: '1 mg / dia',
        common: '1 mg a 2 mg / dia',
        max: '2 mg / dia',
        route: 'Subcutânea (SubQ)',
        timing: 'À noite antes de dormir.',
      },
      practicalTips: [
        'Excelente para estética da cintura e melhora da saúde metabólica geral.',
      ],
      warnings: 'Conservar sob refrigeração após a reconstituição.',
    },

    // 4. Nootrópicos & Saúde Neural
    {
      id: 'semax',
      name: 'Semax',
      category: 'cognicao',
      categoryLabel: 'Nootrópicos & Saúde Neural',
      badge: 'Boost Cerebral',
      headline: 'Heptapeptídeo para Foco, Motivação, BDNF e Neuroproteção',
      scientificSummary:
        'Nootrópico derivado do fragmento de ACTH (4-10) desenvolvido pelo Instituto de Genética Molecular da Rússia. Aumenta substancialmente o Fator Neurotrófico Derivado do Cérebro (BDNF) e modula dopamina e serotonina.',
      mechanism:
        'Eleva os níveis de BDNF e NGF no hipocampo, promovendo plasticidade sináptica, neurogênese e proteção contra o estresse oxidativo cerebral.',
      dosage: {
        initial: '100 mcg a 200 mcg / dia',
        common: '200 mcg a 400 mcg / dia (dividido em 1 a 2 doses)',
        max: '600 mcg / dia',
        route: 'Intranasal (Spray) ou Subcutânea',
        timing: 'Pela manhã e início da tarde (antes de tarefas cognitivas densas).',
      },
      practicalTips: [
        'Efeito rápido na clareza mental, foco sustentado e velocidade de raciocínio.',
        'Sinergia clássica: Semax + Selank (o chamado "foco calmo").',
      ],
      warnings: 'Evite aplicar tarde da noite para não interferir no sono.',
    },
    {
      id: 'selank',
      name: 'Selank',
      category: 'cognicao',
      categoryLabel: 'Nootrópicos & Saúde Neural',
      badge: 'Anti-Estresse',
      headline: 'Ansiolítico Nootrópico sem Sedação ou Dependência',
      scientificSummary:
        'Derivado sintético do imunomodulador tuftsina. Regula o sistema GABAérgico e reduz a ansiedade, trazendo estabilidade emocional sem a sedação ou o risco de vício dos benzodiazepínicos.',
      mechanism:
        'Modula receptores GABA-A, inibe a quebra enzimática da serotonina e reduz o cortisol induzido por estresse mental agudo.',
      dosage: {
        initial: '200 mcg / dia',
        common: '250 mcg a 400 mcg / dia',
        max: '600 mcg / dia',
        route: 'Intranasal (Spray) ou Subcutânea',
        timing: 'Pela manhã ou 30 min antes de situações estressantes.',
      },
      practicalTips: [
        'Excelente para ansiedade de performance, foco em reuniões e estabilização de humor.',
      ],
      warnings: 'Não causa sonolência nem perda de reflexos motores.',
    },
    {
      id: 'dihexa',
      name: 'Dihexa',
      category: 'cognicao',
      categoryLabel: 'Nootrópicos & Saúde Neural',
      badge: 'Sinaptogênese',
      headline: 'O Potencializador de Novas Conexões Sinápticas',
      scientificSummary:
        'Oligopeptídeo derivado da angiotensina IV desenvolvido para promover sinaptogênese extrema (criação de novas sinapses entre neurônios).',
      mechanism:
        'Agonista do receptor c-Met do Fator de Crescimento de Hepatócitos (HGF), superando a capacidade sinaptogênica do BDNF natural.',
      dosage: {
        initial: '5 mg / dia (oral) ou 10 mg / semana',
        common: '5 mg a 10 mg 2-3x/semana',
        max: '20 mg / dose',
        route: 'Oral ou Tópica',
        timing: 'Pela manhã.',
      },
      practicalTips: [
        'Utilize em ciclos estruturados com dias de descanso.',
      ],
      warnings: 'Requer dosagens precisas para evitar saturação de receptores.',
    },

    // 5. Longevidade & Mitocôndrias
    {
      id: 'epithalon',
      name: 'Epithalon (Epitalon)',
      category: 'longevidade',
      categoryLabel: 'Longevidade & Bioenergética Mitocondrial',
      badge: 'Ativador da Telomerase',
      headline: 'O Ativador de Telômeros e Rejuvenescedor Celular da Pineal',
      scientificSummary:
        'Tetrapeptídeo sintético (Ala-Glu-Asp-Gly) baseado na epitalamina da glândula pineal. Conhecido mundialmente pelas pesquisas do Prof. Vladimir Khavinson na ativação da enzima telomerase e extensão da longevidade celular.',
      mechanism:
        'Ativa a enzima telomerase permitindo a reconstituição e proteção dos telômeros cromossômicos, além de regular a secreção de melatonina e o ritmo circadiano.',
      dosage: {
        initial: '5 mg / dia',
        common: '5 mg a 10 mg / dia durante ciclo de 10 a 20 dias',
        max: '10 mg / dia',
        route: 'Subcutânea (SubQ)',
        timing: 'À noite antes de dormir (apoia a produção de melatonina).',
      },
      practicalTips: [
        'Protocolo padrão: 1 ciclo de 10 a 20 dias realizado de 1 a 3 vezes por ano.',
        'Excelente para regeneração sistêmica, sono reparador e integridade do DNA.',
      ],
      warnings: 'Uso em ciclos periódicos, não contínuo.',
    },
    {
      id: 'motsc',
      name: 'MOTS-c',
      category: 'longevidade',
      categoryLabel: 'Longevidade & Bioenergética Mitocondrial',
      badge: 'Mimetizador de Exercício',
      headline: 'Peptídeo Mitocina para Longevidade Metabólica e Sensibilidade à Insulina',
      scientificSummary:
        'Peptídeo de 16 aminoácidos codificado diretamente no genoma mitocondrial (12S rRNA). Age como uma mitocina, reprogramando o metabolismo celular da glicose e lipídios.',
      mechanism:
        'Ativa a via AMPK nas células musculares esqueléticas, transloca para o núcleo celular e aumenta a biogênese mitocondrial.',
      dosage: {
        initial: '1 mg / dia ou 5 mg / semana',
        common: '5 mg a 10 mg por semana (divididos em 2 a 3 aplicações)',
        max: '15 mg / semana',
        route: 'Subcutânea ou Intramuscular',
        timing: 'Manhã ou 1 a 2 horas antes de treinos de resistência/cardio.',
      },
      practicalTips: [
        'Melhora impressionante no VO2 máximo, resistência física e queima de glicose.',
        'Pode ser combinado com NAD+ e SS-31.',
      ],
      warnings: 'Excelente tolerância; ideal para quem busca performance metabólica.',
    },
    {
      id: 'ss31',
      name: 'SS-31 (Elamipretide)',
      category: 'longevidade',
      categoryLabel: 'Longevidade & Bioenergética Mitocondrial',
      badge: 'Restaurador Mitocondrial',
      headline: 'Estabilizador de Cardiolipina e Otimizador da Cadeia Respiratória',
      scientificSummary:
        'Tetrapeptídeo sintético projetado para penetrar na membrana mitocondrial interna e se ligar seletivamente à cardiolipina, restaurando a produção de energia ATP.',
      mechanism:
        'Normaliza a estrutura das cristas mitocondriais, reduz radicais livres (ROS) e restaura a fosforilação oxidativa em tecidos de alta demanda (coração, cérebro, músculos).',
      dosage: {
        initial: '2 mg / dia',
        common: '4 mg a 5 mg / dia',
        max: '10 mg / dia',
        route: 'Subcutânea (SubQ)',
        timing: 'Pela manhã.',
      },
      practicalTips: [
        'Rejuvenescimento mitocondrial profundo e suporte cardiovascular.',
      ],
      warnings: 'Conservar refrigerado após a reconstituição.',
    },

    // 6. Estética, Libido & Bem-Estar
    {
      id: 'ghkcu',
      name: 'GHK-Cu (Peptídeo de Cobre)',
      category: 'estetica',
      categoryLabel: 'Estética, Cabelo, Libido & Bem-Estar',
      badge: 'Rejuvenescimento Dérmico',
      headline: 'Tripeptídeo de Cobre para Firmeza da Pele, Colágeno e Cabelos',
      scientificSummary:
        'Tripeptídeo natural conjugado ao cobre. Estimula intensamente os fibroblastos a sintetizar colágeno tipo I e III, elastina e glicosaminoglicanos, além de revitalizar os folículos capilares.',
      mechanism:
        'Modula a expressão de genes regenerativos da matriz extracelular, suprime enzimas de degradação tecidual e estimula a microcirculação dérmica e capilar.',
      dosage: {
        initial: '100 mcg a 200 mcg / dia (SubQ) ou uso tópico em sérum 1-3%',
        common: '200 mcg a 500 mcg / dia',
        max: '1000 mcg / dia',
        route: 'Subcutânea ou Tópica / Microagulhamento',
        timing: 'Diariamente.',
      },
      practicalTips: [
        'Excelente para cicatrizes, rugas de expressão, elasticidade e combate à calvície.',
        'Pode ser associado ao BPC-157 e Glutationa no "Glow Blend".',
      ],
      warnings: 'Cor azul característica natural devido ao íon de cobre bioativo.',
    },
    {
      id: 'pt141',
      name: 'PT-141 (Bremelanotida)',
      category: 'estetica',
      categoryLabel: 'Estética, Cabelo, Libido & Bem-Estar',
      badge: 'Libido & Desempenho',
      headline: 'Ativador Central do Desejo Sexual e Excitação (Masculino e Feminino)',
      scientificSummary:
        'Peptídeo sintético derivado do Melanotan II. Age diretamente no sistema nervoso central para restaurar o desejo sexual e a ereção sem depender de vasodilatação periférica.',
      mechanism:
        'Agonista dos receptores MC3R e MC4R no hipotálamo, disparando vias neurais naturais de excitação sexual em homens e mulheres.',
      dosage: {
        initial: '250 mcg a 500 mcg',
        common: '500 mcg a 1000 mcg (1 mg)',
        max: '2000 mcg (2 mg)',
        route: 'Subcutânea (SubQ) ou Intranasal',
        timing: '1 a 2 horas antes da atividade sexual.',
      },
      practicalTips: [
        'Funciona tanto para homens quanto para mulheres.',
        'Não altera a pressão arterial nem exige fluxo sanguíneo forçado.',
      ],
      warnings: 'Comece com 500 mcg para avaliar a sensibilidade individual.',
    },
    {
      id: 'dsip',
      name: 'DSIP (Delta Sleep-Inducing Peptide)',
      category: 'estetica',
      categoryLabel: 'Estética, Cabelo, Libido & Bem-Estar',
      badge: 'Sono Profundo Delta',
      headline: 'Indutor Natural do Sono Reparador de Ondas Lentas',
      scientificSummary:
        'Nonapeptídeo endógeno isolado no cérebro que regula o ritmo circadiano e facilita a entrada nas fases mais profundas do sono (ondas delta).',
      mechanism:
        'Modula neurotransmissores e o eixo HPA, reduzindo picos noturnos de cortisol e promovendo regeneração celular durante a noite.',
      dosage: {
        initial: '100 mcg',
        common: '200 mcg a 300 mcg',
        max: '500 mcg',
        route: 'Subcutânea (SubQ)',
        timing: '30 a 60 minutos antes de dormir.',
      },
      practicalTips: [
        'Sono restaurador sem acordar com sensação de "ressaca" ou letargia.',
        'Combine com CJC-1295 / Ipamorelina para liberação sincronizada de GH noturno.',
      ],
      warnings: 'Utilize exclusivamente no período noturno.',
    },
  ];

  // Filter Peptides
  const filteredPeptides = peptideDatabase.filter((p) => {
    const matchesCategory =
      selectedPeptideCategory === 'all' || p.category === selectedPeptideCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.headline.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.scientificSummary.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Problem Solver Data from Dr. Roo's Guide
  const problemSolverTable = [
    {
      problem: 'Gordura Abdominal Persistente & Metabolismo Lento',
      peptides: 'Retatrutida, CagriSema, AOD-9604, HGH Frag 176-191, 5-Amino-1MQ, SLU-PP-332',
      action: 'Supressão do apetite, quebra acelerada de adipócitos e ativação de termogênese mitocondrial.',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    },
    {
      problem: 'Dor nas Articulações, Tendões, Músculos & Lesões',
      peptides: 'BPC-157, TB-500 (Timosina Beta-4), KPV, Mistura KLOW',
      action: 'Reparação de tecidos moles, colágeno, angiogênese e bloqueio de vias inflamatórias.',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400',
    },
    {
      problem: 'Perda Muscular, Dificuldade de Hipertrofia & Recuperação',
      peptides: 'CJC-1295 (com/sem DAC), Ipamorelina, Tesamorelina, IGF-1 LR3',
      action: 'Aumento pulsátil do GH natural e IGF-1, síntese proteica e hiperplasia de novas fibras.',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    },
    {
      problem: 'Fadiga Crônica, Baixa Energia & Envelhecimento Precoce',
      peptides: 'MOTS-c, SS-31 (Elamipretide), Epithalon, NAD+, CoQ10',
      action: 'Recarga das usinas mitocondriais, biogênese de novas mitocôndrias e ativação da telomerase.',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      problem: 'Neblina Mental, Baixo Foco, Ansiedade & TDAH',
      peptides: 'Semax, Selank, Dihexa, P21, Cerebrolysin',
      action: 'Aumento de BDNF cerebral, sinaptogênese, modulação de dopamina e regulação GABA.',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    },
    {
      problem: 'Pele Flácida, Cicatrizes, Queda de Cabelo & Anti-Idade',
      peptides: 'GHK-Cu (Cobre), Mistura GLOW, Epithalon, Glutationa GSH',
      action: 'Estímulo de colágeno I e III, remodelação dérmica, folículos capilares e reparo de DNA.',
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400',
    },
    {
      problem: 'Sono Ruim, Insônia & Estresse Adrenal',
      peptides: 'DSIP (Delta Sleep), CJC-1295 + Ipamorelina',
      action: 'Aprofundamento das fases do sono de ondas lentas delta e redução do cortisol noturno.',
      color: 'from-indigo-500/20 to-cyan-500/20 border-indigo-500/30 text-indigo-400',
    },
    {
      problem: 'Baixa Libido, Falta de Disposição & Desinteresse Sexual',
      peptides: 'PT-141 (Bremelanotida), Melanotan II, Kisspeptin-10',
      action: 'Ativação central de receptores de melanocortina (MC3R/MC4R) e eixo hormonal hipotálamo-gonadal.',
      color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
    },
  ];

  // Stacks Populares
  const popularStacks = [
    {
      name: 'Stack 1: Recomposição Corporal Extrema (Queima + Massa)',
      compounds: 'Retatrutida + CJC-1295 (sem DAC) + Ipamorelina',
      goal: 'Eliminação máxima de gordura com preservação total e tônus de massa muscular magra.',
      synergy:
        'A Retatrutida ativa a termogênese e suprime o apetite, enquanto o combo CJC/IPA fornece pulsos naturais de GH para recuperação celular rápida.',
    },
    {
      name: 'Stack 2: Cura Rápida & Regeneração Total de Lesões',
      compounds: 'BPC-157 + TB-500 (Timosina Beta-4) + KPV',
      goal: 'Recuperação acelerada de tendinites, rupturas musculares, ligamentos e inflamação articular.',
      synergy:
        'BPC-157 atua na cura localizada do tecido, TB-500 atua na reparação sistêmica via actina e KPV desliga o gatilho inflamatório crônico.',
    },
    {
      name: 'Stack 3: Longevidade, Bioenergética & Foco Implacável',
      compounds: 'Epithalon + MOTS-c + Semax',
      goal: 'Proteção telomérica, multiplicação de mitocôndrias de alta voltagem e clareza mental superior.',
      synergy:
        'Epithalon protege os telômeros do DNA, MOTS-c otimiza a conversão de glicose em ATP e Semax eleva o BDNF para máxima performance cerebral.',
    },
    {
      name: 'Stack 4: Glow Estético & Rejuvenescimento Dérmico',
      compounds: 'GHK-Cu (Peptídeo de Cobre) + BPC-157 + Glutationa',
      goal: 'Pele firme e radiante, aceleração na cicatrização de espinhas/marcas e renovação celular capilar.',
      synergy:
        'GHK-Cu potencializa o colágeno dérmico, BPC-157 acelera o tecido endotelial e a Glutationa neutraliza toxinas e estresse oxidativo.',
    },
  ];

  // FAQs
  const faqs = [
    {
      q: 'O que são peptídeos exatamente?',
      a: 'Peptídeos são pequenas cadeias biológicas formadas por 2 a 50 aminoácidos ligados por ligações peptídicas. No organismo, atuam como mensageiros e sinalizadores celulares precisos, instruindo as células a realizar tarefas como queimar gordura, reparar tendões, produzir colágeno ou liberar hormônio do crescimento de forma natural.',
    },
    {
      q: 'Peptídeos são anabolizantes ou esteroides?',
      a: 'Não. Esteroides anabolizantes são derivados sintéticos da testosterona que sobrecarregam o sistema endócrino e suprimem o eixo hormonal natural. Os peptídeos são moléculas de sinalização altamente específicas e fisiológicas que trabalham em sinergia com os receptores naturais do corpo sem causar supressão gonadal.',
    },
    {
      q: 'Preciso fazer Terapia Pós-Ciclo (TPC) após usar peptídeos?',
      a: 'Na grande maioria dos casos, não. Como os peptídeos secretagogos e regenerativos não suprimem a produção hormonal do corpo (eles estimulam a secreção fisiológica pulsátil), não há desligamento do eixo HPTA como ocorre com esteroides anabolizantes.',
    },
    {
      q: 'O que é a reconstituição e por que ela é necessária?',
      a: 'Os peptídeos farmacêuticos de alta pureza são apresentados em pó liofilizado (um processo de desidratação a vácuo e congelamento que preserva a molécula por anos em temperatura ambiente). Para utilizá-los, adiciona-se água bacteriostática estéril para dissolver suavemente o pó, tornando-o uma solução líquida pronta para aplicação.',
    },
    {
      q: 'Como devo armazenar os peptídeos após diluídos?',
      a: 'Após reconstituídos com água bacteriostática, os frascos devem ser mantidos obrigatoriamente na geladeira, entre 2°C e 8°C, ao abrigo de luz direta e sem congelar. O pó antes da reconstituição pode ser armazenado em temperatura ambiente em local seco e protegido da luz.',
    },
    {
      q: 'Quanto tempo leva para perceber os primeiros resultados?',
      a: 'Varia conforme o tipo de peptídeo: compostos nootrópicos (como Semax e Selank) e de sono (como DSIP) apresentam efeitos em horas ou nos primeiros dias; peptídeos regenerativos (como BPC-157) aliviam dores e aceleram tecidos em 5 a 14 dias; já moduladores metabólicos e secretagogos de GH (como Retatrutida e CJC/Ipamorelina) mostram transformação corporal substancial em 3 a 6 semanas.',
    },
  ];

  return (
    <div className="bg-[#0B0F17] text-white min-h-screen pb-20">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-[#0B0F17] to-[#0B0F17]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.1),transparent_50%)]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Biblioteca Científica & Manual de Alta Performance</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-tech text-white tracking-tight leading-tight">
                GUIA COMPLETO DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">PEPTÍDEOS</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-2xl font-sans">
                O manual definitivo para otimização metabólica, queima de gordura, longevidade mitocondrial, regeneração de lesões e performance estética. Baseado nas pesquisas mais recentes da biotecnologia.
              </p>

              {/* Disclaimer Ribbon */}
              <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Aviso Educacional:</strong> Este material sintetiza a literatura científica e protocolos de domínio público para fins de pesquisa e educação.
                </span>
              </div>
            </div>

            {/* Quick Nav Badges Card */}
            <div className="w-full lg:w-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 shrink-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Acesso Rápido aos Capítulos:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  onClick={() => scrollToSection('moleculas')}
                  className="px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                >
                  <span className="flex items-center gap-1.5"><Dna className="w-3.5 h-3.5 text-cyan-400" /> Moléculas</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
                <button
                  onClick={() => scrollToSection('problemas')}
                  className="px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                >
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Soluções</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
                <button
                  onClick={() => scrollToSection('diluicao')}
                  className="px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                >
                  <span className="flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5 text-blue-400" /> Diluição (UI)</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
                <button
                  onClick={() => scrollToSection('aplicacao')}
                  className="px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                >
                  <span className="flex items-center gap-1.5"><Syringe className="w-3.5 h-3.5 text-emerald-400" /> Aplicação</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
                <button
                  onClick={() => scrollToSection('stacks')}
                  className="px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                >
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-purple-400" /> Stacking</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                >
                  <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-rose-400" /> FAQ</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>

              <button
                onClick={() => setCurrentView('store')}
                className="mt-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <span>Ver Catálogo na Loja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        
        {/* CAPÍTULO 1: INTRODUÇÃO & FUNDAMENTOS */}
        <div id="fundamentos" className="space-y-12">
            
            {/* Introductory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4">
                  <Dna className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-tech mb-2">O que são Peptídeos?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cadeias biológicas de 2 a 50 aminoácidos que funcionam como mensageiros mestres. Já foram descobertos mais de 7.000 peptídeos naturais em nosso corpo (como Insulina, IGF-1 e GH).
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-bold">
                  <span>Não suprimem o eixo hormonal</span>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                </div>
              </div>

              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-tech mb-2">Como Eles Agem?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ligam-se a receptores de membrana de alta afinidade, desencadeando respostas intracelulares específicas: queima lipídica, cicatrização de tendões, sinaptogênese ou produção de ATP mitocondrial.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-bold">
                  <span>+60 Peptídeos Aprovados FDA</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-tech mb-2">Pureza & Laudos COA</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No biohacking sério, pureza HPLC acima de 99% e correta liofilização com água bacteriostática garantem a máxima integridade e biossegurança de cada frasco.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span>Padrão Farmacêutico</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Quick Jump Modules */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white font-tech">EIXOS DE TRATAMENTO & OTIMIZAÇÃO</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Explore os principais capítulos científicos deste manual</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    title: '1. Perda de Peso & Queima Lipídica',
                    desc: 'Retatrutida, CagriSema, AOD-9604, HGH Frag 176-191, 5-Amino-1MQ',
                    icon: Flame,
                    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    cat: 'metabolismo',
                  },
                  {
                    title: '2. Regeneração de Lesões & Tecidos',
                    desc: 'BPC-157, TB-500 (Timosina Beta-4), KPV, LL-37, Klow Blend',
                    icon: Heart,
                    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                    cat: 'regeneracao',
                  },
                  {
                    title: '3. Hipertrofia & Secretagogos de GH',
                    desc: 'CJC-1295 com/sem DAC, Ipamorelina, Tesamorelina, IGF-1 LR3',
                    icon: Zap,
                    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    cat: 'hipertrofia',
                  },
                  {
                    title: '4. Nootrópicos & Performance Mental',
                    desc: 'Semax, Selank, Dihexa, P21, Cerebrolysin, ARA-290',
                    icon: Brain,
                    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    cat: 'cognicao',
                  },
                  {
                    title: '5. Longevidade & Mitocôndrias',
                    desc: 'Epithalon, MOTS-c, SS-31 (Elamipretide), NAD+, CoQ10',
                    icon: Activity,
                    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    cat: 'longevidade',
                  },
                  {
                    title: '6. Estética, Cabelo, Libido & Sono',
                    desc: 'GHK-Cu Cobre, PT-141, Melanotan II, DSIP, Glutationa',
                    icon: Sparkles,
                    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                    cat: 'estetica',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedPeptideCategory(item.cat);
                      scrollToSection('moleculas');
                    }}
                    className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-2xl ${item.color} border flex items-center justify-center mb-4`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-white font-tech mb-2 group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-semibold">
                      <span>Ler capítulo e dosagens</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Guide Banner */}
            <div className="bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-2xl">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs uppercase border border-cyan-500/30 mb-2 inline-block">
                  Prática & Diluição
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-tech text-white mt-2">
                  Dúvidas sobre como diluir ou calcular Unidades (UI) na seringa?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Acesse nossa ferramenta interativa com a matemática exata de reconstituição em água bacteriostática e mapa visual de locais de injeção subcutânea e intramuscular.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  onClick={() => scrollToSection('diluicao')}
                  className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2 justify-center"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calculadora de UI</span>
                </button>
                <button
                  onClick={() => scrollToSection('aplicacao')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer flex items-center gap-2 justify-center"
                >
                  <Syringe className="w-4 h-4 text-cyan-400" />
                  <span>Locais de Injeção</span>
                </button>
              </div>
            </div>

          </div>

        {/* CAPÍTULO 2: ENCICLOPÉDIA DAS MOLÉCULAS */}
        <div id="moleculas" className="space-y-8 scroll-mt-24">
          <div className="border-t border-slate-800/80 pt-10">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-xs uppercase border border-cyan-500/30 inline-block mb-2">
              Compêndio Farmacológico
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-tech">ENCICLOPÉDIA DAS MOLÉCULAS</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Fichas técnicas completas com posologia, mecanismo celular, dicas práticas e alertas de segurança.
            </p>
          </div>
            
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por molécula, benefício ou mecanismo (ex: Retatrutida, BPC-157, Sono)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'Todas as Categorias' },
                  { id: 'metabolismo', label: 'Perda de Peso' },
                  { id: 'regeneracao', label: 'Regeneração & Cura' },
                  { id: 'hipertrofia', label: 'Hipertrofia & GH' },
                  { id: 'cognicao', label: 'Nootrópicos' },
                  { id: 'longevidade', label: 'Longevidade' },
                  { id: 'estetica', label: 'Estética & Libido' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedPeptideCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedPeptideCategory === cat.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Peptides List */}
            <div className="space-y-4">
              {filteredPeptides.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
                  <Dna className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Nenhum composto encontrado com esse termo de busca.</p>
                </div>
              ) : (
                filteredPeptides.map((pep) => {
                  const isExpanded = expandedPeptide === pep.id;
                  return (
                    <div
                      key={pep.id}
                      className={`rounded-3xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'bg-slate-900/90 border-cyan-500/50 shadow-2xl shadow-cyan-500/10'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Header row */}
                      <div
                        onClick={() => setExpandedPeptide(isExpanded ? null : pep.id)}
                        className="p-6 cursor-pointer flex items-center justify-between gap-4 select-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-tech font-extrabold text-sm shrink-0">
                            {pep.name.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-white font-tech">{pep.name}</h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {pep.badge}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                • {pep.categoryLabel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 line-clamp-1">{pep.headline}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-xs font-semibold text-cyan-400 hidden sm:block"
                          >
                            {isExpanded ? 'Recolher detalhes' : 'Ver dosagem & ciência'}
                          </button>
                          <ChevronDown
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180 text-cyan-400' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-6 text-xs">
                          
                          {/* Scientific Explanation & Mechanism */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" /> Descrição Científica
                              </span>
                              <p className="text-slate-300 leading-relaxed font-sans">{pep.scientificSummary}</p>
                            </div>

                            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" /> Mecanismo Biológico de Ação
                              </span>
                              <p className="text-slate-300 leading-relaxed font-sans">{pep.mechanism}</p>
                            </div>
                          </div>

                          {/* Dosage & Route Protocol Card */}
                          <div className="bg-gradient-to-r from-cyan-950/30 to-blue-950/20 p-5 rounded-2xl border border-cyan-500/30 space-y-4">
                            <span className="text-xs font-bold text-white uppercase tracking-wider font-tech flex items-center gap-2">
                              <Syringe className="w-4 h-4 text-cyan-400" />
                              Protocolo de Dosagem & Via Recomendada
                            </span>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-semibold">Dose Inicial</span>
                                <span className="text-xs font-bold text-white mt-0.5 block">{pep.dosage.initial}</span>
                              </div>
                              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-semibold">Dose Comum</span>
                                <span className="text-xs font-bold text-cyan-400 mt-0.5 block">{pep.dosage.common}</span>
                              </div>
                              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-semibold">Dose Máxima Segura</span>
                                <span className="text-xs font-bold text-amber-400 mt-0.5 block">{pep.dosage.max}</span>
                              </div>
                              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-semibold">Via de Aplicação</span>
                                <span className="text-xs font-bold text-white mt-0.5 block">{pep.dosage.route}</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-300 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span><strong>Melhor Horário:</strong> {pep.dosage.timing}</span>
                            </p>
                          </div>

                          {/* Practical Checklist & Warnings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                                Dicas Práticas de Otimização:
                              </span>
                              <ul className="space-y-1.5 text-slate-300">
                                {pep.practicalTips.map((tip, tIdx) => (
                                  <li key={tIdx} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                              <div>
                                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Cuidados & Bio-Feedback:
                                </span>
                                <p className="text-slate-300 leading-relaxed">{pep.warnings}</p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                                <button
                                  onClick={() => {
                                    setSearchQuery(pep.name.split(' ')[0]);
                                    setCurrentView('store');
                                  }}
                                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>Localizar na Loja</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>

        {/* CAPÍTULO 3: TABELA DE SOLUÇÃO DE PROBLEMAS */}
        <div id="problemas" className="space-y-8 scroll-mt-24">
          <div className="border-t border-slate-800/80 pt-10">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs uppercase border border-amber-500/30 inline-block mb-2">
              Mapeamento Clínico
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-tech">SOLUÇÃO DE PROBLEMAS COM PEPTÍDEOS</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Identifique sua meta principal ou queixa física para encontrar os compostos de escolha comprovados na literatura médica.
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {problemSolverTable.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${item.color} inline-block mb-3`}>
                      {item.problem}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      Peptídeos Recomendados:
                    </h4>
                    <p className="text-xs text-cyan-400 font-tech font-bold mt-0.5 tracking-wide">
                      {item.peptides}
                    </p>
                    <div className="mt-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Mecanismo de Ação no Organismo:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.action}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedPeptideCategory('all');
                        setSearchFilter(item.peptides.split(',')[0].trim());
                        scrollToSection('moleculas');
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver ficha técnica da molécula</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* CAPÍTULO 4: GUIA DE RECONSTITUIÇÃO & CALCULADORA */}
        <div id="diluicao" className="space-y-10 scroll-mt-24">
            
            {/* Interactive Dosage / UI Calculator */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="max-w-3xl mb-6">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-xs uppercase border border-cyan-500/30 inline-block mb-2">
                  Ferramenta Interativa de Precisão
                </span>
                <h2 className="text-2xl font-extrabold text-white font-tech">
                  CALCULADORA DE DILUIÇÃO E UNIDADES (UI)
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Calcule instantaneamente a marcação exata na seringa de insulina de 100 UI (U-100) para qualquer quantidade de peptídeo e volume de diluição.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Inputs */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Peptídeo no Frasco (mg)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={calcPeptideMg}
                      onChange={(e) => setCalcPeptideMg(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-tech text-base font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Ex: 5 mg ou 10 mg</span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Água Bacteriostática (mL)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      max="10"
                      value={calcWaterMl}
                      onChange={(e) => setCalcWaterMl(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-tech text-base font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Ex: 1 mL ou 2 mL</span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Dose Desejada (mcg)
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="50"
                      max="5000"
                      value={calcDesiredDoseMcg}
                      onChange={(e) => setCalcDesiredDoseMcg(parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-tech text-base font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Ex: 250 mcg ou 500 mcg</span>
                  </div>
                </div>

                {/* Result Display */}
                <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl p-6 text-slate-950 shadow-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Puxar na Seringa de Insulina:
                  </span>
                  <div className="text-4xl sm:text-5xl font-black font-tech my-1 tracking-tight">
                    {unitsOnSyringe || 0} <span className="text-2xl font-bold">UI</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    (= {(Math.round(volumeToInjectMl * 100) / 100).toFixed(2)} mL)
                  </span>
                  <p className="text-[11px] text-slate-900/80 mt-2 font-medium">
                    Concentração final da solução: <strong>{Math.round(concentrationMcgPerMl)} mcg/mL</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Practical Reconstitution Guide */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-tech text-white">
                COMO RECONSTITUIR PEPTÍDEOS (PASSO A PASSO OFICIAL)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  {
                    step: '1',
                    title: 'Assepsia Total',
                    desc: 'Higienize as mãos e passe álcool 70% nas tampas de borracha de ambos os frascos (peptídeo e água BAC).',
                  },
                  {
                    step: '2',
                    title: 'Puxar Água BAC',
                    desc: 'Com seringa estéril, retire o volume desejado de água bacteriostática (geralmente 1 mL ou 2 mL).',
                  },
                  {
                    step: '3',
                    title: 'Injeção Suave na Parede',
                    desc: 'Insira a agulha em ângulo para a água escorrer pela parede de vidro. NUNCA borrife o jato diretamente sobre o pó.',
                  },
                  {
                    step: '4',
                    title: 'Dissolução sem Agitar',
                    desc: 'Faça movimentos circulares suaves. NUNCA chacoalhe o frasco vigorosamente para não romper as ligações peptídicas.',
                  },
                  {
                    step: '5',
                    title: 'Refrigeração (2 a 8°C)',
                    desc: 'Rotule com a data da diluição e armazene na geladeira. Soluções reconstituídas permanecem estáveis por 30 a 60 dias.',
                  },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 font-extrabold text-sm border border-cyan-500/30 flex items-center justify-center font-tech mb-3">
                        {s.step}
                      </span>
                      <h4 className="text-sm font-bold text-white font-tech mb-1">{s.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Reconstitution Reference Table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
              <h4 className="text-sm font-bold font-tech text-white uppercase tracking-wider mb-4">
                Tabela de Diluição Padrão e Equivalência em UI (Seringa U-100)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Frasco de Peptídeo</th>
                      <th className="p-3">Água BAC Adicionada</th>
                      <th className="p-3">Concentração Final</th>
                      <th className="p-3">Dose a cada 10 UI (0,1 mL)</th>
                      <th className="p-3">Dose a cada 20 UI (0,2 mL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-white">5 mg (5.000 mcg)</td>
                      <td className="p-3">1,0 mL</td>
                      <td className="p-3 text-cyan-400 font-mono">5.000 mcg/mL</td>
                      <td className="p-3 font-bold">500 mcg</td>
                      <td className="p-3 font-bold">1.000 mcg (1 mg)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-white">5 mg (5.000 mcg)</td>
                      <td className="p-3">2,0 mL</td>
                      <td className="p-3 text-cyan-400 font-mono">2.500 mcg/mL</td>
                      <td className="p-3 font-bold">250 mcg</td>
                      <td className="p-3 font-bold">500 mcg</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-white">10 mg (10.000 mcg)</td>
                      <td className="p-3">2,0 mL</td>
                      <td className="p-3 text-cyan-400 font-mono">5.000 mcg/mL</td>
                      <td className="p-3 font-bold">500 mcg</td>
                      <td className="p-3 font-bold">1.000 mcg (1 mg)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        {/* CAPÍTULO 5: GUIA DE LOCAIS DE INJEÇÃO */}
        <div id="aplicacao" className="space-y-8 scroll-mt-24">
          <div className="border-t border-slate-800/80 pt-10">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase border border-emerald-500/30 inline-block mb-2">
              Técnica de Administração
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-tech">LOCAIS DE INJEÇÃO & TÉCNICA CORRETA</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Compreenda as diferenças anatômicas entre a via Subcutânea (SubQ) e Intramuscular (IM) para máxima biodisponibilidade.
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* SubQ Card */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-sm">
                    SubQ
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-tech">Via Subcutânea (No Tecido Adiposo)</h3>
                    <p className="text-[11px] text-cyan-400 font-semibold">Usado para 90% dos peptídeos (BPC-157, GHRPs, GLP-1)</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>Seringa:</strong> Seringa de insulina agulha fina 29G a 31G (½ polegada / 8mm a 12mm).</p>
                  <p><strong>Ângulo:</strong> Inserir a agulha em ângulo de 45° a 90° na pele pinçada.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] block">
                    Principais Locais Anatômicos:
                  </span>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>Abdômen Inferior:</strong> 2 a 5 cm distante da cicatriz umbilical (local preferido).</li>
                    <li>• <strong>Flancos ("Pneuzinhos"):</strong> Excelente rotação caso o abdômen esteja sensível.</li>
                    <li>• <strong>Parte Frontal da Coxa:</strong> Área com boa espessura de tecido adiposo.</li>
                    <li>• <strong>Glúteo Superior:</strong> Para injeções de maior volume.</li>
                  </ul>
                </div>
              </div>

              {/* IM Card */}
              <div className="bg-slate-900/90 border border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm">
                    IM
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-tech">Via Intramuscular (No Músculo)</h3>
                    <p className="text-[11px] text-blue-400 font-semibold">Para L-Carnitina, NAD+, SS-31 e absorção rápida</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>Seringa:</strong> Seringa 25G a 27G (1 polegada / 25mm).</p>
                  <p><strong>Ângulo:</strong> Inserir a agulha a 90° diretamente na massa muscular relaxada.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px] block">
                    Principais Locais Anatômicos:
                  </span>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>Músculo Deltoide (Ombro):</strong> Fácil acesso para autoadministração.</li>
                    <li>• <strong>Vasto Lateral (Coxa Lateral):</strong> Seguro e com ampla margem muscular.</li>
                    <li>• <strong>Glúteo (Quadrante Superior Externo):</strong> Ideal para volumes maiores (acima de 1,5 mL).</li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Crucial Tips */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Regras de Ouro para uma Aplicação Suave e Sem Dor
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">1. Rotação Obrigatória</strong>
                  Nunca aplique sucessivamente no mesmo ponto. Alterne esquerda e direita a cada dia.
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">2. Injeção Lenta</strong>
                  Injete o líquido devagar ao longo de 5 a 10 segundos para não esticar as fibras dérmicas.
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">3. Descarte Seguro</strong>
                  Nunca reutilize agulhas para evitar contaminações ou perda do corte biselado.
                </div>
              </div>
            </div>

          </div>

        {/* CAPÍTULO 6: COMBINAÇÕES & STACKS */}
        <div id="stacks" className="space-y-8 scroll-mt-24">
          <div className="border-t border-slate-800/80 pt-10">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xs uppercase border border-purple-500/30 inline-block mb-2">
              Sinergia e Farmacodinâmica
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-tech">COMBINAÇÃO DE PEPTÍDEOS (STACKING)</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Aprenda a potencializar resultados através da sinergia entre receptores sem causar redundâncias ou desperdícios.
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {popularStacks.map((stk, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-3 inline-block">
                      Protocolo Sinergético
                    </span>
                    <h3 className="text-base font-bold text-white font-tech mb-1">{stk.name}</h3>
                    <p className="text-xs font-bold text-cyan-400 font-mono mb-3">{stk.compounds}</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Objetivo Principal:
                        </span>
                        <p className="text-slate-200">{stk.goal}</p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Por que essa combinação funciona?
                        </span>
                        <p className="text-slate-300 leading-relaxed font-sans">{stk.synergy}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* CAPÍTULO 7: PERGUNTAS FREQUENTES */}
        <div id="faq" className="max-w-4xl mx-auto space-y-6 scroll-mt-24">
          <div className="border-t border-slate-800/80 pt-10">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-xs uppercase border border-cyan-500/30 inline-block mb-2">
              Dúvidas Comuns
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-tech">PERGUNTAS FREQUENTES (FAQ)</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Tire suas principais dúvidas sobre eficácia, biossegurança e protocolos.
            </p>
          </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen
                        ? 'bg-slate-900 border-cyan-500/40 shadow-lg'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <span className="text-sm font-bold text-white font-tech">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180 text-cyan-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 font-sans">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

      </div>
    </div>
  );
};
