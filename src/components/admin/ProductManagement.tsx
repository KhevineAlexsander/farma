import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Check, Eye, X, DollarSign, Package, Sparkles, Tag, Star, Image, UploadCloud, Layers, Database, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { PeptideVial } from '../PeptideVial';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, toggleProductPromotion, toggleProductFeatured, syncOfficialCatalog, saveAllProductsToCloud } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingProducts, setIsSavingProducts] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

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
  const [stock, setStock] = useState('');
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
    setStock('25');
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
    setStock('30');
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
    setStock(product.stock.toString());
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

    const productPayload: Omit<Product, 'id'> = {
      name: name.trim().slice(0, 100).toUpperCase(),
      dosage: dosage.trim().slice(0, 50).toUpperCase(),
      category,
      price: parsedPrice,
      costPrice: Math.max(0, parseFloat(costPrice) || 0),
      stock: Math.max(0, Math.min(100000, parseInt(stock, 10) || 0)),
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

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dosage.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const promoCount = products.filter((p) => p.isPromotion).length;
  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Atenção: <strong>{lowStockCount} produto(s)</strong> estão com estoque crítico abaixo de 10 frascos!
            </span>
          </div>
          <span className="font-mono font-bold bg-amber-500/20 px-2.5 py-1 rounded-lg">
            Reposição urgente sugerida
          </span>
        </div>
      )}

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

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {[
              { id: 'Todos', label: 'Todos' },
              { id: 'Promoções', label: `Promoções (${promoCount})` },
              { id: 'Destaques', label: `Destaques (${featuredCount})` },
              { id: 'Emagrecimento', label: 'Emagrecimento' },
              { id: 'Saúde', label: 'Saúde' },
              { id: 'Beleza', label: 'Beleza' },
              { id: 'Desempenho', label: 'Desempenho' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === f.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
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

      {/* Products Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Foto / Frasco</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Preço Venda</th>
                <th className="py-3.5 px-4">Estoque</th>
                <th className="py-3.5 px-4">Promoção (Oferta)</th>
                <th className="py-3.5 px-4">Destaque</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((product) => {
                const profit = product.price - product.costPrice;
                const marginPercent = ((profit / product.price) * 100).toFixed(0);
                const isLowStock = product.stock < 10;

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
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        {product.isPromotion && product.originalPrice && (
                          <span className="text-[10px] text-slate-500 line-through block">
                            De R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-400">
                          Margem: {marginPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Stock with Low-Stock Alert */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isLowStock
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {product.stock} un.
                      </span>
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
                    <td className="py-3 px-4 text-right space-x-2">
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

              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Qtd. em Estoque *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:border-cyan-500"
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

              {/* 3 Main Benefits */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">3 Benefícios Principais (Cards):</label>
                <input
                  type="text"
                  value={benefit1}
                  onChange={(e) => setBenefit1(e.target.value)}
                  placeholder="Benefício 1 (ex: Regeneração celular)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
                <input
                  type="text"
                  value={benefit2}
                  onChange={(e) => setBenefit2(e.target.value)}
                  placeholder="Benefício 2 (ex: Rejuvenescimento)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
                <input
                  type="text"
                  value={benefit3}
                  onChange={(e) => setBenefit3(e.target.value)}
                  placeholder="Benefício 3 (ex: Pele mais firme)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
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
    </div>
  );
};

