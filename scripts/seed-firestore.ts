import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Product } from '../src/types';

export const OFFICIAL_CATALOG_PRODUCTS: Product[] = [
  {
    id: 'prod-ghkcu-100',
    name: 'GHK-CU',
    dosage: '100 MG',
    category: 'Beleza',
    description: 'Tripeptídeo de cobre biológico de alta pureza. Estimula síntese de colágeno e elastina, acelera a regeneração celular e elasticidade da pele.',
    benefits: [
      'Regeneração celular profunda',
      'Rejuvenescimento e elasticidade',
      'Pele firme e redução de rugas',
    ],
    price: 55.00,
    originalPrice: 75.00,
    costPrice: 22.00,
    stock: 50,
    capColor: '#0088FF',
    purity: '99.7% HPLC',
    storage: '2°C a 8°C (Refrigerado). Proteger da luz.',
    reconstitution: 'Reconstituir com 2ml a 3ml de Água Bacteriostática.',
    featured: true,
    isPromotion: true,
    promotionDiscount: 26,
  },
  {
    id: 'prod-klow-80',
    name: 'KLOW',
    dosage: '80 MG',
    category: 'Emagrecimento',
    description: 'Blend avançado de sinalizadores peptídicos bioativos para modulação de saciedade, controle de apetite e termogênese mitocondrial acelerada.',
    benefits: [
      'Emagrecimento acelerado',
      'Controle intenso do apetite',
      'Aumento da taxa metabólica',
    ],
    price: 260.00,
    originalPrice: 320.00,
    costPrice: 110.00,
    stock: 35,
    capColor: '#16A34A',
    purity: '99.5% HPLC',
    storage: '2°C a 8°C (Refrigerado).',
    reconstitution: 'Reconstituir suavemente com diluente estéril sem agitação brusca.',
    featured: true,
    isPromotion: true,
    promotionDiscount: 18,
  },
  {
    id: 'prod-glow-70',
    name: 'GLOW',
    dosage: '70 MG',
    category: 'Emagrecimento',
    description: 'Complexo lipotrópico e peptídico formulado para aceleração metabólica basal, queima de gordura resistente e definição com proteção celular.',
    benefits: [
      'Queima de gordura localizada',
      'Acelera o metabolismo basal',
      'Definição e firmeza corporal',
    ],
    price: 150.00,
    originalPrice: 180.00,
    costPrice: 65.00,
    stock: 40,
    capColor: '#EC4899',
    purity: '99.6% HPLC',
    storage: '2°C a 8°C após reconstituição.',
    reconstitution: 'Diluir em 3ml de água bacteriostática estéril.',
    featured: true,
    isPromotion: false,
  },
  {
    id: 'prod-motsc-40',
    name: 'MOTS-C',
    dosage: '40 MG',
    category: 'Saúde',
    description: 'Peptídeo derivado da mitocôndria regulador da homeostase metabólica, otimização da sensibilidade insulínica e longevidade celular sistêmica.',
    benefits: [
      'Longevidade celular e mitocondrial',
      'Otimização da sensibilidade insulínica',
      'Mais vigor físico e disposição',
    ],
    price: 170.00,
    originalPrice: 195.00,
    costPrice: 75.00,
    stock: 30,
    capColor: '#06B6D4',
    purity: '99.8% HPLC',
    storage: 'Manter a 2°C a 8°C ou -20°C liofilizado.',
    reconstitution: 'Reconstituir lentamente com diluente estéril.',
    featured: true,
    isPromotion: true,
    promotionDiscount: 12,
  },
  {
    id: 'prod-tesamorelin-10',
    name: 'TESAMORELIN',
    dosage: '10 MG',
    category: 'Desempenho',
    description: 'Análogo potente do hormônio liberador de GH (GHRH). Indicado para redução de gordura visceral profunda e estímulo da secreção pulsátil de GH.',
    benefits: [
      'Redução de gordura visceral',
      'Estímulo natural de GH e IGF-1',
      'Melhora da densidade e sono reparador',
    ],
    price: 165.00,
    originalPrice: 190.00,
    costPrice: 70.00,
    stock: 25,
    capColor: '#1D4ED8',
    purity: '99.4% HPLC',
    storage: '2°C a 8°C. Não congelar após reconstituído.',
    reconstitution: 'Reconstituir com 2ml de água estéril.',
    featured: false,
    isPromotion: false,
  },
  {
    id: 'prod-semax-10',
    name: 'SEMAX',
    dosage: '10 MG',
    category: 'Saúde',
    description: 'Peptídeo nootrópico de ação neuroprotetora e cognitiva. Eleva expressão de BDNF no cérebro, aprimorando foco, memória operacional e reflexos.',
    benefits: [
      'Foco e clareza mental superior',
      'Memória e retenção acelerada',
      'Neuroproteção e neuroplasticidade',
    ],
    price: 65.00,
    originalPrice: 85.00,
    costPrice: 28.00,
    stock: 45,
    capColor: '#EA580C',
    purity: '99.9% HPLC',
    storage: '2°C a 8°C (Refrigerado).',
    reconstitution: 'Solúvel em água bacteriostática ou solução estéril.',
    featured: false,
    isPromotion: false,
  },
  {
    id: 'prod-selank-10',
    name: 'SELANK',
    dosage: '10 MG',
    category: 'Saúde',
    description: 'Heptapeptídeo regulador de serotonina e dopamina com potente efeito ansiolítico e estabilizador de humor sem provocar sonolência.',
    benefits: [
      'Alívio de ansiedade e estresse',
      'Equilíbrio emocional sem sedação',
      'Melhora do foco sob pressão',
    ],
    price: 65.00,
    originalPrice: 85.00,
    costPrice: 28.00,
    stock: 45,
    capColor: '#2563EB',
    purity: '99.8% HPLC',
    storage: '2°C a 8°C.',
    reconstitution: 'Reconstituir com 2ml de água bacteriostática.',
    featured: false,
    isPromotion: false,
  },
  {
    id: 'prod-cagrilintide-10',
    name: 'CAGRILINTIDE',
    dosage: '10 MG',
    category: 'Emagrecimento',
    description: 'Análogo sintético de amilina de longa ação. Age nos receptores de saciedade hipotalâmicos e desacelera o esvaziamento gástrico de forma sinérgica.',
    benefits: [
      'Supressão prolongada do apetite',
      'Aceleração da perda ponderal',
      'Controle de picos glicêmicos',
    ],
    price: 150.00,
    originalPrice: 175.00,
    costPrice: 62.00,
    stock: 30,
    capColor: '#22C55E',
    purity: '99.5% HPLC',
    storage: '2°C a 8°C. Proteger da luz.',
    reconstitution: 'Reconstituir com diluente estéril adequado.',
    featured: false,
    isPromotion: false,
  },
  {
    id: 'prod-retratutida-60',
    name: 'RETRATUTIDA',
    dosage: '60 MG',
    category: 'Emagrecimento',
    description: 'Triplo agonista inovador dos receptores GLP-1, GIP e Glucagon. A nova fronteira biotecnológica global em queima de gordura e reprogramação metabólica.',
    benefits: [
      'Triplo agonista GLP-1 / GIP / Glucagon',
      'Máxima redução de gordura corporal',
      'Aceleração metabólica sem precedentes',
    ],
    price: 285.00,
    originalPrice: 340.00,
    costPrice: 125.00,
    stock: 35,
    capColor: '#DC2626',
    purity: '99.7% HPLC',
    storage: '2°C a 8°C (Refrigerado).',
    reconstitution: 'Reconstituir com 2ml a 3ml de água bacteriostática estéril.',
    featured: true,
    isPromotion: true,
    promotionDiscount: 16,
  },
  {
    id: 'prod-epithalon-10',
    name: 'EPITHALON',
    dosage: '10 MG',
    category: 'Saúde',
    description: 'Tetrapeptídeo epitalâmico ativador da enzima telomerase. Estimula a regeneração de tecidos, equilíbrio neuroendócrino e desaceleração do envelhecimento.',
    benefits: [
      'Ativação comprovada da telomerase',
      'Reversão de biomarcadores de idade',
      'Sono profundo e sincronização circadiana',
    ],
    price: 60.00,
    originalPrice: 80.00,
    costPrice: 25.00,
    stock: 40,
    capColor: '#F59E0B',
    purity: '99.6% HPLC',
    storage: '2°C a 8°C.',
    reconstitution: 'Reconstituir com 2ml de diluente estéril.',
    featured: false,
    isPromotion: false,
  },
  {
    id: 'prod-tirze-60',
    name: 'TIRZE',
    dosage: '60 MG',
    category: 'Emagrecimento',
    description: 'Duplo agonista dos receptores GIP e GLP-1 em apresentação concentrada de 60mg. Promove regulação metabólica avançada, controle de glicose e perda de gordura.',
    benefits: [
      'Duplo agonista GIP e GLP-1',
      'Redução profunda da compulsão alimentar',
      'Otimização lipídica e sensibilidade à insulina',
    ],
    price: 160.00,
    originalPrice: 190.00,
    costPrice: 68.00,
    stock: 50,
    capColor: '#9333EA',
    purity: '99.8% HPLC',
    storage: '2°C a 8°C (Refrigerado). Proteger da radiação solar.',
    reconstitution: 'Reconstituir com cuidado sem agitação turbulenta.',
    featured: true,
    isPromotion: true,
    promotionDiscount: 15,
  },
  {
    id: 'prod-botox-100',
    name: 'BOTOX',
    dosage: '100 UI',
    category: 'Beleza',
    description: 'Toxina botulínica de padrão internacional e pureza máxima. Indicada para suavização estética de linhas de expressão dinâmicas e relaxamento muscular.',
    benefits: [
      'Alta pureza e estabilidade clínica',
      'Atenuação de rugas e linhas faciais',
      'Padrão internacional de qualidade',
    ],
    price: 100.00,
    originalPrice: 130.00,
    costPrice: 42.00,
    stock: 35,
    capColor: '#94A3B8',
    purity: '100 UI Liofilizado',
    storage: 'Manter a -5°C a -20°C ou refrigerado 2°C a 8°C.',
    reconstitution: 'Diluir em 2,5ml de soro fisiológico estéril conforme protocolo.',
    featured: false,
    isPromotion: false,
  },
  {
    id: 'prod-botox-allergan-100',
    name: 'BOTOX ALLERGAN',
    dosage: '100 U',
    category: 'Beleza',
    description: 'Toxina Botulínica Tipo A Allergan Original (100 Unidades). Padrão ouro mundial em medicina estética e harmonização facial, pó liofilizado sob vácuo estéril com máxima estabilidade e pureza comprovada.',
    benefits: [
      'Allergan Original (Padrão Ouro)',
      'Máxima eficácia e durabilidade clínica',
      'Pó liofilizado a vácuo estéril (100 U)',
    ],
    price: 300.00,
    originalPrice: 360.00,
    costPrice: 150.00,
    stock: 25,
    capColor: '#6B21A8',
    imageUrl: '/images/botox_allergan_100u.jpg',
    purity: '100 U Original Allergan',
    storage: '-5°C a -20°C ou 2°C a 8°C (Refrigerado).',
    reconstitution: 'Reconstituir com 2,5ml de soro fisiológico 0,9% estéril sem conservantes.',
    featured: true,
    isPromotion: false,
  },
  {
    id: 'prod-agua-bac-3',
    name: 'ÁGUA BAC',
    dosage: '3 MG',
    category: 'Saúde',
    description: 'Água bacteriostática estéril para reconstituição de peptídeos, com 0,9% de álcool benzílico bacteriostático. Impede a proliferação bacteriana por semanas.',
    benefits: [
      'Pureza microbiológica estéril',
      'Preserva peptídeos na geladeira por 30+ dias',
      'Ampola/frasco de grau farmacêutico',
    ],
    price: 20.00,
    originalPrice: 25.00,
    costPrice: 6.00,
    stock: 120,
    capColor: '#0891B2',
    purity: 'Grau Farmacêutico USP',
    storage: 'Temperatura ambiente controlada ou 2°C a 8°C.',
    reconstitution: 'Pronta para uso na diluição de peptídeos.',
    featured: false,
    isPromotion: false,
  },
  {
    id: 'prod-acido-bac-10',
    name: 'ÁCIDO BAC',
    dosage: '10 MG',
    category: 'Saúde',
    description: 'Solução bacteriostática de pH levemente ácido formulada especificamente para a dissolução imediata de peptídeos com solubilidade hidrofóbica e sensíveis.',
    benefits: [
      'Solubilização instantânea e transparente',
      'pH calibrado para máxima estabilidade',
      'Grau laboratorial de alta pureza',
    ],
    price: 25.00,
    originalPrice: 32.00,
    costPrice: 8.00,
    stock: 90,
    capColor: '#7C3AED',
    purity: 'Pureza Laboratorial',
    storage: 'Armazenar em local seco e fresco, protegido da luz.',
    reconstitution: 'Pronta para uso.',
    featured: false,
    isPromotion: false,
  },
];

async function seed() {
  console.log('Iniciando conexão com o Firebase Firestore real...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  // Clean up any test product
  const existingDocs = await getDocs(collection(db, 'products'));
  const officialIds = new Set(OFFICIAL_CATALOG_PRODUCTS.map(p => p.id));
  for (const docSnap of existingDocs.docs) {
    if (!officialIds.has(docSnap.id) && (docSnap.data().name?.toUpperCase().includes('TESTE') || docSnap.data().name === 'PRODUTO TESTE')) {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'products', docSnap.id));
      console.log(`[LIMPEZA] Removido item de teste legado: ${docSnap.id} - ${docSnap.data().name}`);
    }
  }

  console.log(`Cadastrando ${OFFICIAL_CATALOG_PRODUCTS.length} produtos oficiais no banco de dados Firestore (${firebaseConfig.firestoreDatabaseId})...`);

  for (const product of OFFICIAL_CATALOG_PRODUCTS) {
    try {
      const docRef = doc(db, 'products', product.id);
      await setDoc(docRef, product, { merge: true });
      console.log(`[OK] Produto cadastrado: ${product.name} ${product.dosage} - R$ ${product.price.toFixed(2)} (ID: ${product.id})`);
    } catch (err) {
      console.error(`[ERRO] Falha ao cadastrar ${product.name}:`, err);
    }
  }

  console.log('\nVerificando produtos na coleção "products"...');
  const snapshot = await getDocs(collection(db, 'products'));
  console.log(`Total de produtos no Firestore: ${snapshot.size}`);
  snapshot.forEach((d) => {
    const data = d.data();
    console.log(` - ${data.name} (${data.dosage}): R$ ${data.price}`);
  });

  console.log('\nFinalizado com sucesso!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro fatal ao rodar o seeder:', err);
  process.exit(1);
});
