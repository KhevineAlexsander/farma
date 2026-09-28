import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_PRODUCTS } from '../src/data/mockData';
import { Product } from '../src/types';

export const ALL_STORE_PRODUCTS: Product[] = INITIAL_PRODUCTS;

async function seed() {
  console.log('Iniciando conexão com o Firebase Firestore oficial...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log(`Cadastrando ${ALL_STORE_PRODUCTS.length} produtos oficiais no Firestore (${firebaseConfig.firestoreDatabaseId})...`);

  let added = 0;
  for (const product of ALL_STORE_PRODUCTS) {
    try {
      const docRef = doc(db, 'products', product.id);
      await setDoc(docRef, product, { merge: true });
      added++;
      console.log(`[OK] (${added}/${ALL_STORE_PRODUCTS.length}) ${product.name} [${product.dosage}] - R$ ${product.price.toFixed(2)} (ID: ${product.id})`);
    } catch (err) {
      console.error(`[ERRO] Falha ao cadastrar ${product.name}:`, err);
    }
  }

  // Clean up any stale documents that are not in the official catalog
  const officialIds = new Set(ALL_STORE_PRODUCTS.map((p) => p.id));
  const snapshot = await getDocs(collection(db, 'products'));
  for (const d of snapshot.docs) {
    if (!officialIds.has(d.id)) {
      console.log(`Removendo documento obsoleto ou duplicado do Firestore: ${d.id}`);
      await deleteDoc(doc(db, 'products', d.id));
    }
  }

  const finalSnap = await getDocs(collection(db, 'products'));
  console.log(`\nTotal final de produtos ativos e consistentes no Firestore: ${finalSnap.size}`);
  console.log('Todos os produtos foram gravados no banco de dados com sucesso!');
  process.exit(0);
}

if (process.argv[1]?.includes('seed-firestore')) {
  seed().catch((err) => {
    console.error('Erro fatal ao rodar o seeder:', err);
    process.exit(1);
  });
}
