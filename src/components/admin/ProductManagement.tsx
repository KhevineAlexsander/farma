import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  Eye,
  X,
  DollarSign,
  Package,
  Sparkles,
  Tag,
  Star,
  Image,
  UploadCloud,
  Layers,
  Database,
  RefreshCw,
  FileText,
  ChevronDown,
  Copy,
  ExternalLink,
  FilePlus2,
  Clock,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { PeptideVial } from '../PeptideVial';
import {
  validateProductForCreation,
  auditDatabaseDeduplication,
  DeduplicationAuditReport,
  normalizeProductName,
  normalizeDosage,
} from '../../utils/productDeduplication';
import { DatabaseBackupModal } from './DatabaseBackupModal';

export const ProductManagement: React.FC = () => {
  const { 
    products, 
    orders,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductPromotion, 
    toggleProductFeatured, 
    syncOfficialCatalog, 
    executeCatalogDeduplication,
    saveAllProductsToCloud, 
    currentUser,
    productRequests,
    approveProductRequest,
    deleteProductRequest,
    getProductRequestShareUrl,
    setCurrentView,
    showToast
  } = useApp();
  const isMasterAdmin = currentUser?.isMaster || currentUser?.email?.toLowerCase().trim() === 'khevineoliveira@gmail.com';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingProducts, setIsSavingProducts] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(true);

  // Anti-Deduplication System State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isResolvingDeduplication, setIsResolvingDeduplication] = useState(false);
  const [auditTestInput, setAuditTestInput] = useState('');
  const [auditTestDosage, setAuditTestDosage] = useState('');
  const auditReport = useMemo(() => auditDatabaseDeduplication(products, orders), [products, orders]);

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState(`categoria,produto,dosagem,unidade,preco
Emagrecimento & Metabolismo,Tirzepatida,60,mg,175.00
Emagrecimento & Metabolismo,Tirzepatida,100,mg,230.00
Emagrecimento & Metabolismo,Retratutida,30,mg,185.00
Emagrecimento & Metabolismo,Retratutida,60,mg,285.00
Emagrecimento & Metabolismo,Cagrilintide,10,mg,150.00
Emagrecimento & Metabolismo,AOD-9604,5,mg,80.00
Emagrecimento & Metabolismo,SLU-PP-322,5,mg,120.00
Recuperação & Peptídeos,BPC-157 + TB-500,10,mg,110.00
Recuperação & Peptídeos,GHK-Cu,100,mg,60.00
Recuperação & Peptídeos,CJC + Ipamorelin,10,mg,110.00
Recuperação & Peptídeos,Ipamorelin,10,mg,80.00
Recuperação & Peptídeos,Tesamorelin,10,mg,165.00
Recuperação & Peptídeos,SS-31,10,mg,80.00
Neurológicos & Sono,Semax,10,mg,75.00
Neurológicos & Sono,Selank,5,mg,65.00
Neurológicos & Sono,DSIP,10,mg,120.00
Neurológicos & Sono,KPV,10,mg,70.00
Longevidade & Metabolismo Celular,NAD+,1000,mg,95.00
Longevidade & Metabolismo Celular,Epithalon,10,mg,65.00
Longevidade & Metabolismo Celular,GHK-Cu,100,mg,60.00
Hormonais & Outros,HCG,5000,UI,120.00
Hormonais & Outros,PT-141,10,mg,65.00
Hormonais & Outros,Melanotan II,10,mg,65.00
Hormonais & Outros,VIP,10,mg,135.00
Hormonais & Outros,KLOW,80,mg,260.00
Hormonais & Outros,GLOW,70,mg,160.00
Hormonais & Outros,MOTS-C,10,mg,80.00`);

  const handleImportCsv = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] || '').trim();
      if (!line) continue;
      // Skip header row if it contains descriptive column names
      if (i === 0 && (line.toLowerCase().includes('categoria') || line.toLowerCase().includes('produto') || line.toLowerCase().includes('nome'))) {
        continue;
      }

      // Detect delimiter: comma, semicolon, or tab
      const delimiter = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 5) {
        const [catRaw, nameRaw, dosVal, unitVal, priceVal] = parts;
        
        // Clean price string (remove R$, spaces, replace comma with dot)
        const cleanPriceStr = priceVal.replace(/[R$\s]/g, '').replace(',', '.');
        const priceNum = parseFloat(cleanPriceStr);

        if (isNaN(priceNum)) {
          errorCount++;
          continue;
        }

        const category = catRaw || 'Geral';
        const dosageStr = `${dosVal} ${unitVal}`.toUpperCase();
        const productName = nameRaw.toUpperCase();

        if (!productName || !dosageStr) {
          errorCount++;
          continue;
        }

        // Anti-Deduplication validation check (normalizes Retratutida, Epithalon, Mots-c, etc.)
        const validation = validateProductForCreation(
          { name: productName, dosage: dosageStr },
          products
        );

        if (!validation.isValid && validation.isDuplicate) {
          skippedCount++;
          continue;
        }

        const canonicalName = validation.suggestedName || normalizeProductName(productName);
        const canonicalDosage = validation.suggestedDosage || normalizeDosage(dosageStr);

        const newProd: Omit<Product, 'id'> = {
          name: canonicalName,
          dosage: canonicalDosage,
          category,
          price: priceNum,
          costPrice: Math.round(priceNum * 0.4 * 100) / 100,
          stock: 35,
          capColor: (category || '').toLowerCase().includes('emagrecimento') ? '#22C55E' : (category || '').toLowerCase().includes('beleza') ? '#EC4899' : '#0088FF',
          description: `Produto farmacêutico importado de alta pureza (${canonicalName} ${canonicalDosage}).`,
          benefits: ['Laudo HPLC certificado', 'Alta biodisponibilidade'],
          purity: '99.6% HPLC',
          storage: '2°C a 8°C (Refrigerado)',
          reconstitution: 'Reconstituir com água bacteriostática estéril',
          featured: false,
          isPromotion: false,
        };

        addProduct(newProd);
        importedCount++;
      } else {
        errorCount++;
      }
    }

    let msg = `Importação concluída!\n• ${importedCount} novos produtos adicionados com validação anti-duplicidade.\n• ${skippedCount} produtos ignorados por já existirem no catálogo (duplicidades bloqueadas).`;
    if (errorCount > 0) {
      msg += `\n• ${errorCount} linhas ignoradas por formatação inválida.`;
    }
    alert(msg);
    setIsImportModalOpen(false);
  };

  const handleSaveToCloud = async () => {
    setIsSavingProducts(true);
    const success = await saveAllProductsToCloud();
    setIsSavingProducts(false);
    if (success) {
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCustomProductMode, setIsCustomProductMode] = useState(false); // Mode for other products with photo

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [category, setCategory] = useState<'Emagrecimento' | 'Saúde' | 'Beleza' | 'Desempenho'>('Saúde');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [capColor, setCapColor] = useState('#0088FF');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [benefit1, setBenefit1] = useState('');
  const [benefit2, setBenefit2] = useState('');
  const [benefit3, setBenefit3] = useState('');
  const [isPromotion, setIsPromotion] = useState(false);
  const [originalPrice, setOriginalPrice] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState('15');
  const [featured, setFeatured] = useState(false);

  const openNewPeptideModal = () => {
    setEditingProductId(null);
    setIsCustomProductMode(false);
    setName('');
    setDosage('10 MG');
    setCategory('Saúde');
    setPrice('150');
    setCostPrice('60');
    setCapColor('#0088FF');
    setImageUrl('');
    setDescription('');
    setBenefit1('Alta biodisponibilidade');
    setBenefit2('Restauração molecular');
    setBenefit3('Pureza > 99% HPLC');
    setIsPromotion(false);
    setOriginalPrice('180');
    setPromotionDiscount('15');
    setFeatured(false);
    setIsModalOpen(true);
  };

  const openNewOtherProductModal = () => {
    setEditingProductId(null);
    setIsCustomProductMode(true);
    setName('');
    setDosage('500 MG');
    setCategory('Saúde');
    setPrice('120');
    setCostPrice('45');
    setCapColor('#6366F1');
    setImageUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80');
    setDescription('Produto especial com certificação e laudo de pureza laboratorial.');
    setBenefit1('Qualidade farmacêutica comprovada');
    setBenefit2('Absorção e eficácia garantida');
    setBenefit3('Rastreabilidade lote a lote');
    setIsPromotion(false);
    setOriginalPrice('150');
    setPromotionDiscount('20');
    setFeatured(false);
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProductId(product.id);
    setIsCustomProductMode(!!product.imageUrl);
    setName(product.name);
    setDosage(product.dosage);
    setCategory(product.category);
    setPrice(product.price.toString());
    setCostPrice(product.costPrice.toString());
    setCapColor(product.capColor || '#0088FF');
    setImageUrl(product.imageUrl || '');
    setDescription(product.description);
    setBenefit1(product.benefits[0] || '');
    setBenefit2(product.benefits[1] || '');
    setBenefit3(product.benefits[2] || '');
    setIsPromotion(!!product.isPromotion);
    setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setPromotionDiscount(product.promotionDiscount ? product.promotionDiscount.toString() : '15');
    setFeatured(!!product.featured);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPrice = parseFloat(price);
    const parsedPrice = isNaN(rawPrice) ? 0 : Math.max(0, Math.min(1000000, rawPrice));
    const rawOrigPrice = parseFloat(originalPrice);
    const parsedOrigPrice = !isNaN(rawOrigPrice) && rawOrigPrice > 0 
      ? Math.max(0, Math.min(1000000, rawOrigPrice)) 
      : (isPromotion ? parsedPrice * 1.25 : undefined);

    const validation = validateProductForCreation(
      {
        name: name.trim().slice(0, 100),
        dosage: dosage.trim().slice(0, 50),
        id: editingProductId || undefined,
      },
      products
    );

    if (!validation.isValid && validation.isDuplicate) {
      showToast(validation.message || 'Produto com mesma especificação já cadastrado no catálogo!');
      alert(`Atenção: Duplicidade Detectada!\n\n${validation.message}\n\nPara manter a integridade dos relatórios e vendas, edite o produto já existente ou altere a especificação.`);
      return;
    }

    const canonicalName = validation.suggestedName || normalizeProductName(name.trim().slice(0, 100).toUpperCase());
    const canonicalDosage = validation.suggestedDosage || normalizeDosage(dosage.trim().slice(0, 50).toUpperCase());

    const productPayload: Omit<Product, 'id'> = {
      name: canonicalName,
      dosage: canonicalDosage,
      category,
      price: parsedPrice,
      costPrice: Math.max(0, parseFloat(costPrice) || 0),
      stock: 999,
      capColor: capColor || '#0088FF',
      imageUrl: imageUrl.trim() || undefined,
      description: description.slice(0, 1000) || (isCustomProductMode ? 'Produto farmacêutico importado com controle de qualidade rigoroso.' : 'Peptídeo importado liofilizado com laudo HPLC de pureza superior.'),
      benefits: [benefit1.slice(0, 100), benefit2.slice(0, 100), benefit3.slice(0, 100)].filter(Boolean),
      purity: '99.6% HPLC',
      storage: '2°C a 8°C (Refrigerado).',
      reconstitution: isCustomProductMode ? 'Seguir instruções da bula ou rotulagem.' : 'Reconstituir com água bacteriostática.',
      isPromotion,
      originalPrice: isPromotion ? parsedOrigPrice : undefined,
      promotionDiscount: isPromotion ? Math.max(1, Math.min(99, parseInt(promotionDiscount, 10) || 15)) : undefined,
      featured,
    };

    if (editingProductId) {
      updateProduct(editingProductId, productPayload);
    } else {
      addProduct(productPayload);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    let matchesCat = true;
    if (categoryFilter === 'Promoções') {
      matchesCat = !!p.isPromotion;
    } else if (categoryFilter === 'Destaques') {
      matchesCat = !!p.featured;
    } else if (categoryFilter !== 'Todos') {
      matchesCat = p.category === categoryFilter;
    }

    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.dosage || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const promoCount = products.filter((p) => p.isPromotion).length;
  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div className="space-y-6">
      {/* Header Controls: Search, Category Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou dosagem..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Quick Filter Dropdown */}
          <div className="relative">
            {(() => {
              const filterOptions = [
                { id: 'Todos', label: 'Todos' },
                { id: 'Promoções', label: `Promoções (${promoCount})` },
                { id: 'Destaques', label: `Destaques (${featuredCount})` },
                { id: 'Emagrecimento', label: 'Emagrecimento' },
                { id: 'Saúde', label: 'Saúde' },
                { id: 'Beleza', label: 'Beleza' },
                { id: 'Desempenho', label: 'Desempenho' },
              ];
              const currentLabel = filterOptions.find(f => f.id === categoryFilter)?.label || categoryFilter;

              return (
                <>
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium flex items-center gap-2 hover:border-cyan-500 transition-all cursor-pointer shadow-md"
                  >
                    <span>Filtrar: <strong className="text-cyan-400">{currentLabel}</strong></span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFilterOpen && (
                    <div className="absolute left-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-30 py-2 animate-in fade-in duration-150">
                      {filterOptions.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setCategoryFilter(f.id);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                            categoryFilter === f.id
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold border-l-2 border-cyan-400'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{f.label}</span>
                          {categoryFilter === f.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Add Product Buttons: Peptides and Other Products with Photo */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={async () => {
              setIsSyncing(true);
              await syncOfficialCatalog();
              setIsSyncing(false);
            }}
            disabled={isSyncing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Restaurar e gravar o catálogo oficial original diretamente no banco de dados"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Gravando...' : 'Restaurar Catálogo Base'}</span>
            <span className="sm:hidden">{isSyncing ? 'Gravando...' : 'Catálogo Base'}</span>
          </button>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
              auditReport.isClean
                ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border-amber-500/60 animate-pulse'
            }`}
            title="Sistema de Prevenção e Auditoria de Duplicidades"
          >
            {auditReport.isClean ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {auditReport.isClean ? 'Sistema Anti-Duplicidade' : `Duplicidades (${auditReport.totalCatalogDuplicates})`}
            </span>
            <span className="sm:hidden">
              {auditReport.isClean ? 'Anti-Duplicidade' : `Dupl. (${auditReport.totalCatalogDuplicates})`}
            </span>
          </button>

          {isMasterAdmin && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Importar lista de produtos em lote via CSV"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Importar CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            title="Salvar Backup completo de produtos e pedidos ou restaurar no banco de dados"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Backup & Restaurar</span>
            <span className="sm:hidden">Backup</span>
          </button>

          {/* Direct link for the store owner to request/register products - ONLY FOR MASTER ADMIN */}
          {isMasterAdmin && (
            <>
              <button
                onClick={() => {
                  const url = getProductRequestShareUrl();
                  navigator.clipboard.writeText(url);
                  setCopiedShareLink(true);
                  showToast('Link de cadastro copiado com sucesso!');
                  setTimeout(() => setCopiedShareLink(false), 2500);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="Copiar link onde o dono pode pedir cadastro de produto (categoria, nome, dosagem, custos, venda e descrição)"
              >
                {copiedShareLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span className="hidden md:inline">{copiedShareLink ? 'Link Copiado!' : 'Copiar Link do Dono'}</span>
                <span className="md:hidden">Link Dono</span>
              </button>

              <button
                onClick={() => setCurrentView('product-request')}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-600/40 hover:to-cyan-600/40 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="Abrir página dedicada onde o dono faz o pedido de cadastro"
              >
                <FilePlus2 className="w-4 h-4 text-emerald-400" />
                <span>Fazer Pedido de Cadastro</span>
              </button>
            </>
          )}

          <button
            onClick={openNewPeptideModal}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Peptídeo</span>
          </button>

          <button
            onClick={openNewOtherProductModal}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            title="Cadastrar outro tipo de produto com foto (acessórios, suplementos, dermocosméticos, etc.)"
          >
            <Image className="w-4 h-4 text-cyan-400" />
            <span>Outro Produto (Foto)</span>
          </button>
        </div>
      </div>

      {/* Product Requests Banner / Section (Solicitações do Dono) */}
      {productRequests.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <FilePlus2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Solicitações de Cadastro de Produtos pelo Dono
                  </h3>
                  {productRequests.filter((r) => r.status === 'Pendente').length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      {productRequests.filter((r) => r.status === 'Pendente').length} Pendentes
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Produtos solicitados via link com categoria, dosagem, preço de custo, preço de venda e descrição.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMasterAdmin && (
                <>
                  <button
                    onClick={() => {
                      const url = getProductRequestShareUrl();
                      navigator.clipboard.writeText(url);
                      setCopiedShareLink(true);
                      showToast('Link do formulário copiado!');
                      setTimeout(() => setCopiedShareLink(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>Copiar Link</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('product-request')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Formulário</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setShowRequestsPanel(!showRequestsPanel)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors cursor-pointer"
                title={showRequestsPanel ? 'Recolher' : 'Expandir'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showRequestsPanel ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {showRequestsPanel && (
            <div className="mt-4 space-y-2.5 overflow-x-auto">
              <div className="min-w-[650px] space-y-2">
                {productRequests.map((req) => {
                  const reqProfit = (req.price || 0) - (req.costPrice || 0);
                  const isApproved = req.status === 'Aprovado';
                  return (
                    <div
                      key={req.id}
                      className="bg-[#070A10] border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase">{req.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] font-bold">
                              {req.dosage}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isApproved
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                            <span>Categoria: <strong className="text-slate-300">{req.category}</strong></span>
                            <span>Custo: <strong className="text-slate-300">R$ {req.costPrice?.toFixed(2).replace('.', ',')}</strong></span>
                            <span>Venda: <strong className="text-cyan-300">R$ {req.price?.toFixed(2).replace('.', ',')}</strong></span>
                            <span>Lucro: <strong className="text-emerald-400">R$ {reqProfit.toFixed(2).replace('.', ',')}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isApproved && (
                          <button
                            onClick={() => approveProductRequest(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprovar & Publicar</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o pedido de "${req.name}"?`)) {
                              deleteProductRequest(req.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Foto / Frasco</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Preço Venda</th>
                <th className="py-3.5 px-4">Promoção (Oferta)</th>
                <th className="py-3.5 px-4">Destaque</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 z-20 bg-slate-950 border-l border-slate-800 shadow-[-10px_0_15px_-4px_rgba(0,0,0,0.6)]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((product) => {
                const profit = (product.price || 0) - (product.costPrice || 0);
                const marginPercent = product.price ? (((profit / product.price) * 100) || 0).toFixed(0) : '0';

                return (
                  <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Product Photo & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden p-1">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain rounded"
                            />
                          ) : (
                            <PeptideVial capColor={product.capColor} size="sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block text-sm font-tech">
                              {product.name}
                            </span>
                            {product.imageUrl && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                                Foto
                              </span>
                            )}
                          </div>
                          <span className="text-cyan-400 text-[11px] font-semibold">
                            {product.dosage}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                        {product.category}
                      </span>
                    </td>

                    {/* Sale Price */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block text-sm">
                          R$ {(product.price || 0).toFixed(2).replace('.', ',')}
                        </span>
                        {product.isPromotion && product.originalPrice ? (
                          <span className="text-[10px] text-slate-500 line-through block">
                            De R$ {(product.originalPrice || 0).toFixed(2).replace('.', ',')}
                          </span>
                        ) : null}
                        <span className="text-[10px] text-emerald-400">
                          Margem: {marginPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Promotion Toggle Button */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleProductPromotion(product.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          product.isPromotion
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 shadow-xs'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                        }`}
                        title="Clique para ativar/desativar promoção"
                      >
                        <Tag className="w-3 h-3 text-rose-400" />
                        <span>{product.isPromotion ? `Promoção (${product.promotionDiscount || 15}%)` : 'Normal'}</span>
                      </button>
                    </td>

                    {/* Featured Toggle Button */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleProductFeatured(product.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          product.featured
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30 shadow-xs'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                        }`}
                        title="Clique para destacar/ocultar destaque"
                      >
                        <Star className={`w-3 h-3 ${product.featured ? 'text-cyan-400 fill-cyan-400' : 'text-slate-500'}`} />
                        <span>{product.featured ? 'Destaque' : 'Padrão'}</span>
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 z-10 bg-slate-900 group-hover:bg-[#161f30] border-l border-slate-800 shadow-[-10px_0_15px_-4px_rgba(0,0,0,0.6)] space-x-2 transition-colors">
                      <button
                        onClick={() => openEditProductModal(product)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors"
                        title="Editar Produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir ${product.name}?`)) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 transition-colors"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-extrabold font-tech text-white">
                {editingProductId
                  ? (isCustomProductMode ? 'EDITAR PRODUTO COM FOTO' : 'EDITAR PEPTÍDEO')
                  : (isCustomProductMode ? 'NOVO CADASTRO DE PRODUTO (COM FOTO)' : 'NOVO CADASTRO DE PEPTÍDEO')}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isCustomProductMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                {isCustomProductMode ? 'Outro Produto' : 'Peptídeo Farmacêutico'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              {isCustomProductMode
                ? 'Insira o link ou foto do produto, dosagem, custos e informações para exibição no e-commerce.'
                : 'Preencha os dados de dosagem, cor da tampa crimp, custos e laudo para o catálogo e ERP.'}
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Photo Upload / Link Input (Mandatory/Highlighted if isCustomProductMode) */}
              <div className={`p-3.5 rounded-2xl border ${isCustomProductMode ? 'bg-indigo-950/30 border-indigo-700/50' : 'bg-slate-950 border-slate-800'} space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-cyan-400" />
                    <span>Foto do Produto {isCustomProductMode && <span className="text-rose-400 font-bold">*</span>}</span>
                  </label>
                  {isCustomProductMode && (
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800">
                      Obrigatório para outros produtos
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Photo Preview Box */}
                  <div className="sm:col-span-3 flex items-center justify-center h-24 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden relative group">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-500 text-[10px]">
                        <Image className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        Sem foto
                      </div>
                    )}
                  </div>

                  {/* URL Input & File Upload */}
                  <div className="sm:col-span-9 space-y-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Cole o link da imagem (https://...)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 text-xs"
                      required={isCustomProductMode}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer">
                        <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Carregar do Computador</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Quick demo photos for convenience */}
                      <button
                        type="button"
                        onClick={() => setImageUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80')}
                        className="px-2 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
                      >
                        Exemplo 1 (Frasco)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl('https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80')}
                        className="px-2 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
                      >
                        Exemplo 2 (Suplemento)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isCustomProductMode ? 'Nome do Produto *' : 'Nome do Peptídeo *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isCustomProductMode ? 'Ex: Colágeno Hidrolisado, Coenzima Q10' : 'Ex: GHK-CU, MOTS-C'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isCustomProductMode ? 'Apresentação / Dosagem *' : 'Dosagem do Frasco *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder={isCustomProductMode ? 'Ex: 60 Cápsulas, 500 MG, 100 ML' : 'Ex: 10 MG, 100 MG'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  >
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Beleza">Beleza</option>
                    <option value="Desempenho">Desempenho</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isCustomProductMode ? 'Cor Temática / Etiqueta' : 'Cor da Tampa (Selo Crimp)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={capColor}
                      onChange={(e) => setCapColor(e.target.value)}
                      className="w-10 h-8 bg-transparent border-0 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={capColor}
                      onChange={(e) => setCapColor(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Promotion & Featured Section */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Destaque & Promoção Especial
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                    <div>
                      <span className="font-bold text-white block">Produto em Destaque</span>
                      <span className="text-[10px] text-slate-400 block">Exibido no topo do catálogo com selo especial</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={isPromotion}
                      onChange={(e) => setIsPromotion(e.target.checked)}
                      className="accent-rose-500 w-4 h-4 rounded"
                    />
                    <div>
                      <span className="font-bold text-rose-300 block">Marcar como Promoção</span>
                      <span className="text-[10px] text-slate-400 block">Exibe selo de oferta e preço riscado</span>
                    </div>
                  </label>
                </div>

                {isPromotion && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Preço Original "De R$"</label>
                      <input
                        type="number"
                        step="0.01"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="Ex: 199.00"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Desconto (%)</label>
                      <input
                        type="number"
                        value={promotionDiscount}
                        onChange={(e) => setPromotionDiscount(e.target.value)}
                        placeholder="Ex: 15"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>



              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição Detalhada</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mecanismo de ação, indicação clínica, etc."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Salvar no Banco & Atualizar Site</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-sm">Importar Produtos em Lote (CSV)</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportCsv} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-xs">
                  Cole os dados no formato <code className="text-cyan-400">categoria,produto,dosagem,unidade,preco</code>:
                </label>
                <p className="text-[11px] text-slate-400">
                  Cada linha representa um produto. As colunas são separadas por vírgula.
                </p>
              </div>

              <textarea
                rows={12}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-emerald-500"
              />

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-500 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 text-xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Processar e Importar Produtos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Anti-Duplication System Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  auditReport.isClean
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                }`}>
                  {auditReport.isClean ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    Sistema Anti-Duplicidade de Produtos
                    {auditReport.isClean ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Ativo & Protegido
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        Ação Necessária ({auditReport.totalCatalogDuplicates})
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Prevenção de cadastros repetidos, normalização de sinônimos e unificação de pedidos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Status Banner */}
              {auditReport.isClean ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-emerald-300 font-bold text-sm">Catálogo 100% Íntegro e Livre de Duplicidades</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Nenhum produto duplicado foi encontrado no banco de dados. Todas as variações ortográficas conhecidas (como <em>Retratutida / Retatrutide</em>, <em>Epithalon / Ephitalon</em>, <em>MOTS-C / Most-C</em> e <em>Tirzepatida / Tirze</em>) estão canonicamente sincronizadas e protegidas contra novas repetições.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-amber-300 font-bold text-sm">
                      {(auditReport?.duplicateGroups || []).length} Grupo(s) de Produtos Duplicados Detectados no Banco
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      Foram localizados produtos no catálogo com mesma substância e dosagem gravados sob grafias ou registros diferentes. Você pode unificá-los abaixo com 1 clique para consolidar estoques, relatórios e vendas.
                    </p>
                  </div>
                </div>
              )}

              {/* Duplicate Groups List (if any detected) */}
              {(auditReport?.duplicateGroups || []).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-300">
                      Grupos Duplicados para Unificação
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {(auditReport?.duplicateGroups || []).length} grupo(s) pendente(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(auditReport?.duplicateGroups || []).map((group, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5"
                      >
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                          <div>
                            <span className="text-xs font-bold text-cyan-300 uppercase">
                              {group.canonicalName}
                            </span>
                            <span className="ml-2 text-xs font-semibold text-slate-400">
                              {group.canonicalDosage || 'Dosagem Padrão'}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            {(group?.duplicateProducts || []).length + 1} registros encontrados
                          </span>
                        </div>

                        {/* Primary vs Duplicates Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Primary Product */}
                          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Registro Principal (Mantido)
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">{group.primaryProduct?.id}</span>
                            </div>
                            <p className="text-white font-bold text-xs">{group.primaryProduct?.name} {group.primaryProduct?.dosage}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-1">
                              <span>Preço: <strong className="text-emerald-300">R$ {group.primaryProduct?.price?.toFixed(2) || '0.00'}</strong></span>
                              <span>Estoque: <strong className="text-white">{group.primaryProduct?.stock || 0} un.</strong></span>
                            </div>
                          </div>

                          {/* Redundant Products */}
                          <div className="space-y-2">
                            {(group?.duplicateProducts || []).map((dup) => (
                              <div
                                key={dup.id}
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-rose-400">
                                    Variação Duplicada (Removida e Fundida)
                                  </span>
                                  <span className="text-slate-400 font-mono text-[10px]">{dup.id}</span>
                                </div>
                                <p className="text-slate-200 font-semibold text-xs">{dup.name} {dup.dosage}</p>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                                  <span>Preço: R$ {(dup.price || 0).toFixed(2)}</span>
                                  <span>Estoque: {dup.stock || 0} un.</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Merge Action Button */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={async () => {
                              if (!group.primaryProduct) return;
                              setIsResolvingDeduplication(true);
                              await executeCatalogDeduplication(
                                group.primaryProduct.id,
                                (group.duplicateProducts || []).map((p) => p.id)
                              );
                              setIsResolvingDeduplication(false);
                            }}
                            disabled={isResolvingDeduplication}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isResolvingDeduplication ? 'animate-spin' : ''}`} />
                            <span>Unificar este Grupo no Banco</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Protective Layers Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-300">
                  Camadas de Proteção Ativas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                      1
                    </div>
                    <h5 className="font-bold text-white text-xs">Normalização Fonética</h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Reconhece automaticamente variações como <em>Retratutida</em> / <em>Retatrutide</em>, <em>Epithalon</em> / <em>Ephitalon</em>, <em>MOTS-C</em> / <em>Most-C</em> e <em>Tirzepatida</em> / <em>Tirze</em>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      2
                    </div>
                    <h5 className="font-bold text-white text-xs">Bloqueio Proativo</h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Valida em tempo real o formulário de cadastro e importações CSV. Impede novos itens se a mesma substância e dosagem já existirem.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                      3
                    </div>
                    <h5 className="font-bold text-white text-xs">Consolidação em Vendas</h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Pedidos e relatórios de vendas (WhatsApp / PDF) agrupam os itens pelo peptídeo canônico, eliminando linhas repetidas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Rule Simulator */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Simulador de Validação Anti-Duplicidade
                  </h4>
                  <span className="text-[10px] text-slate-400">Teste qualquer nome ou variação ortográfica</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nome ou Variação:</label>
                    <input
                      type="text"
                      placeholder="Ex: retratutida, epitalon, most-c, tirze"
                      value={auditTestInput}
                      onChange={(e) => setAuditTestInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Dosagem:</label>
                    <input
                      type="text"
                      placeholder="Ex: 60mg, 10 mg, 40mg"
                      value={auditTestDosage}
                      onChange={(e) => setAuditTestDosage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-500"
                    />
                  </div>
                </div>

                {auditTestInput.trim() && (
                  (() => {
                    const testValidation = validateProductForCreation(
                      { name: auditTestInput, dosage: auditTestDosage },
                      products
                    );
                    const normN = normalizeProductName(auditTestInput);
                    const normD = normalizeDosage(auditTestDosage);

                    return (
                      <div className={`p-3 rounded-xl border space-y-1.5 ${
                        testValidation.isDuplicate
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                          : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            {testValidation.isDuplicate ? (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                Duplicidade Detectada (Cadastro Bloqueado)
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                Válido para Cadastro
                              </>
                            )}
                          </span>
                          <span className="font-mono text-[10px] text-slate-300">
                            Canônico: {normN} {normD}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {testValidation.message}
                        </p>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 text-xs transition-colors cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Backup & Restore Modal */}
      <DatabaseBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};

