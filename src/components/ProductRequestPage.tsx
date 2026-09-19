import React, { useState } from 'react';
import { 
  Package, 
  ArrowLeft, 
  Copy, 
  Check, 
  DollarSign, 
  Tag, 
  FileText, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Upload, 
  Clock, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DnaLogo } from './DnaLogo';
import { PeptideVial } from './PeptideVial';

const POPULAR_CATEGORIES = [
  'Emagrecimento & Metabolismo',
  'Recuperação & Peptídeos',
  'Neurológicos & Sono',
  'Longevidade & Metabolismo Celular',
  'Hormonais & Outros',
  'Beleza & Estética',
  'Saúde & Imunidade',
];

const POPULAR_DOSAGES = [
  '5 MG',
  '10 MG',
  '15 MG',
  '30 MG',
  '60 MG',
  '100 MG',
  '500 MG',
  '1000 MG',
  '5000 UI',
];

const CAP_COLORS = [
  { name: 'Azul Cyan', hex: '#0088FF' },
  { name: 'Verde Esmeralda', hex: '#22C55E' },
  { name: 'Rosa Magenta', hex: '#EC4899' },
  { name: 'Roxo Índigo', hex: '#8B5CF6' },
  { name: 'Dourado Âmbar', hex: '#F59E0B' },
  { name: 'Vermelho Rubi', hex: '#EF4444' },
];

export const ProductRequestPage: React.FC = () => {
  const { 
    currentUser, 
    setCurrentView, 
    addProductRequest, 
    approveProductRequest, 
    deleteProductRequest, 
    productRequests, 
    getProductRequestShareUrl,
    showToast 
  } = useApp();

  // Form states
  const [category, setCategory] = useState('Emagrecimento & Metabolismo');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('10 MG');
  const [costPrice, setCostPrice] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('30');
  const [capColor, setCapColor] = useState('#0088FF');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);

  // UI helpers
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const isMasterAdmin = currentUser?.isMaster || currentUser?.email?.toLowerCase().trim() === 'khevineoliveira@gmail.com' || currentUser?.role === 'ADMIN';

  // Math: Cost vs Sale calculation
  const numCost = parseFloat(costPrice.replace(',', '.')) || 0;
  const numPrice = parseFloat(price.replace(',', '.')) || 0;
  const profit = numPrice - numCost;
  const margin = numPrice > 0 ? (profit / numPrice) * 100 : 0;
  const markup = numCost > 0 ? (profit / numCost) * 100 : 0;

  const handleCopyLink = () => {
    const url = getProductRequestShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Link de cadastro copiado com sucesso!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFillStandardDescription = () => {
    const chosenName = name.trim() || 'Peptídeo';
    const chosenDosage = dosage.trim() || '10 MG';
    setDescription(
      `Produto farmacêutico importado de altíssima pureza (${chosenName} ${chosenDosage}). Acompanha laudo analítico HPLC de pureza > 99.5%, livre de endotoxinas e conservantes prejudiciais. Armazenar refrigerado entre 2°C a 8°C. Reconstituir com água bacteriostática estéril.`
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Por favor, informe o nome do produto.');
      return;
    }
    if (!dosage.trim()) {
      showToast('Por favor, informe a dosagem do produto.');
      return;
    }
    if (numPrice <= 0) {
      showToast('O preço de venda deve ser maior que zero.');
      return;
    }

    const finalCategory = isCustomCategory && customCategory.trim() ? customCategory.trim() : category;

    setIsSubmitting(true);
    try {
      const shouldApproveNow = isMasterAdmin && autoApprove;
      const created = await addProductRequest({
        name: name.trim().toUpperCase(),
        category: finalCategory,
        dosage: dosage.trim().toUpperCase(),
        costPrice: numCost,
        price: numPrice,
        description: description.trim() || `Produto importado de alta pureza ${name.trim().toUpperCase()} (${dosage.trim().toUpperCase()}).`,
        stock: parseInt(stock) || 20,
        capColor,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        status: shouldApproveNow ? 'Aprovado' : 'Pendente',
      });

      if (shouldApproveNow) {
        await approveProductRequest(created.id);
      }

      setSubmittedRequest({ ...created, autoApproved: shouldApproveNow });

      // Reset form
      setName('');
      setCostPrice('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setNotes('');
    } catch (err) {
      console.error('Erro ao cadastrar pedido:', err);
      showToast('Ocorreu um erro ao salvar o pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Top Header */}
      <header className="bg-[#0B0F17]/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DnaLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono">PORTAL DO PROPRIETÁRIO</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">Oficial</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">Cadastro de Novo Produto</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              id="copy-product-request-link-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all hover:border-cyan-500/50 cursor-pointer"
              title="Copiar link direto para esta página"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            {isMasterAdmin ? (
              <button
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Painel Admin</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('store')}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar à Loja</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-cyan-950/30 border border-cyan-500/20 rounded-2xl p-4 sm:p-6 mb-8 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-300">Formulário Oficial de Homologação</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Pedido de Cadastro de Produto
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Preencha a categoria, nome, dosagem, custos, venda e descrição. Você pode compartilhar este link diretamente com sócios ou equipe técnica.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showHistory ? 'Ocultar Pedidos' : `Ver Pedidos (${productRequests.length})`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Modal / Banner when request submitted */}
        {submittedRequest && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 mb-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono uppercase text-emerald-400 tracking-wider">
                    {submittedRequest.autoApproved ? 'CADASTRADO & PUBLICADO NA LOJA' : 'SOLICITAÇÃO RECEBIDA COM SUCESSO'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  {submittedRequest.name} ({submittedRequest.dosage})
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {submittedRequest.autoApproved
                    ? 'O produto foi aprovado e já está visível para compra no catálogo online da loja!'
                    : 'O pedido de cadastro foi registrado e está pronto para homologação no Painel Administrativo.'}
                </p>

                {/* Price & profit recap */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Categoria</span>
                    <p className="text-xs font-bold text-slate-200 truncate">{submittedRequest.category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Custo</span>
                    <p className="text-xs font-bold text-slate-300">R$ {submittedRequest.costPrice?.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Venda</span>
                    <p className="text-xs font-bold text-cyan-300">R$ {submittedRequest.price?.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Lucro Un.</span>
                    <p className="text-xs font-bold text-emerald-400">
                      R$ {((submittedRequest.price || 0) - (submittedRequest.costPrice || 0)).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setSubmittedRequest(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Fazer Outro Pedido
                  </button>
                  {isMasterAdmin && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      Ir para Painel de Produtos
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentView('store')}
                    className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                  >
                    Ver Loja Virtual
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests History Drawer/Section */}
        {showHistory && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Histórico de Pedidos de Cadastro</h3>
              </div>
              <span className="text-xs text-slate-400">{productRequests.length} solicitações registradas</span>
            </div>

            {productRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Nenhum pedido de cadastro realizado ainda.
              </div>
            ) : (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
                {productRequests.map((req) => {
                  const reqProfit = (req.price || 0) - (req.costPrice || 0);
                  const isApproved = req.status === 'Aprovado';
                  return (
                    <div
                      key={req.id}
                      className="bg-[#070A10] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{req.name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-cyan-300 font-mono">
                            {req.dosage}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>Categoria: <strong className="text-slate-300">{req.category}</strong></span>
                          <span>Custo: <strong className="text-slate-300">R$ {req.costPrice?.toFixed(2).replace('.', ',')}</strong></span>
                          <span>Venda: <strong className="text-cyan-300">R$ {req.price?.toFixed(2).replace('.', ',')}</strong></span>
                          <span>Lucro: <strong className="text-emerald-400">R$ {reqProfit.toFixed(2).replace('.', ',')}</strong></span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString('pt-BR')} às {new Date(req.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isApproved && isMasterAdmin && (
                          <button
                            onClick={() => approveProductRequest(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprovar & Inserir</span>
                          </button>
                        )}
                        {isMasterAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Excluir solicitação de "${req.name}"?`)) {
                                deleteProductRequest(req.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir pedido de cadastro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* The Main Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Inputs (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: Categoria & Identificação */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Categoria do Produto</h3>
                </div>

                {/* Popular category chips */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Selecione a Categoria Principal:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CATEGORIES.map((cat) => {
                      const isSelected = !isCustomCategory && category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setIsCustomCategory(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isCustomCategory
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      + Outra Categoria
                    </button>
                  </div>
                </div>

                {isCustomCategory && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nome da Nova Categoria:
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Ex: Terapia de Reposição, Fitoterápicos, etc."
                      className="w-full bg-[#070A10] border border-cyan-500/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>

              {/* Card 2: Nome e Dosagem */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Nome e Dosagem</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nome do Produto <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Tirzepatida, BPC-157, NAD+"
                      className="w-full bg-[#070A10] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white uppercase placeholder:normal-case focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Nome comercial ou princípio ativo do composto.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Dosagem / Apresentação <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="Ex: 10 MG, 60 MG, 5000 UI"
                      className="w-full bg-[#070A10] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white uppercase placeholder:normal-case focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_DOSAGES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDosage(d)}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                            dosage === d ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Preço de Custo e Preço de Venda */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. Preços & Formação de Margem</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Valores em Reais (R$)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Preço de Custo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preço de Custo (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="Ex: 80,00"
                        className="w-full bg-[#070A10] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Custo de aquisição do frasco ou importação.</p>
                  </div>

                  {/* Preço de Venda */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preço de Venda (R$) <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Ex: 180,00"
                        className="w-full bg-[#070A10] border border-cyan-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Preço final ao cliente na loja virtual.</p>
                  </div>
                </div>

                {/* Real-time Profit & Margin Simulator */}
                {numPrice > 0 && (
                  <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 mt-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lucro Bruto/Un.</span>
                      <span className={`text-sm sm:text-base font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        R$ {profit.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Margem Líquida</span>
                      <span className={`text-sm sm:text-base font-bold ${margin >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Markup</span>
                      <span className="text-sm sm:text-base font-bold text-cyan-300">
                        {numCost > 0 ? `${markup.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Descrição do Produto */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">4. Descrição do Produto</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillStandardDescription}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    Preencher Padrão HPLC
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descrição Detalhada & Instruções
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva a finalidade do composto, especificações farmacêuticas, recomendações de armazenamento e modo de conservação..."
                    className="w-full bg-[#070A10] border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Esta descrição será exibida no modal de detalhes do produto para os compradores da loja.
                  </p>
                </div>
              </div>

              {/* Card 5: Informações Complementares Opcionais */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">5. Dados Complementares (Opcionais)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Estoque Inicial */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Estoque Inicial Sugerido
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full bg-[#070A10] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Cor da Tampa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Cor da Tampa do Frasco
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {CAP_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setCapColor(c.hex)}
                          className={`w-7 h-7 rounded-full transition-transform cursor-pointer border ${
                            capColor === c.hex ? 'scale-125 ring-2 ring-white border-transparent' : 'border-slate-700 hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Imagem do Produto */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Imagem do Produto (Foto do Frasco ou Caixa)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Cole o link da imagem (URL) ou use o upload ao lado"
                      className="flex-1 bg-[#070A10] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Upload de Arquivo</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Observações do Dono */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Observações Internas / Fornecedor (Não visível ao cliente)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Fornecedor Xangai Lab, prazo de entrega 7 dias, lote 2026-A"
                    className="w-full bg-[#070A10] border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Master Admin Direct Approval Toggle */}
              {isMasterAdmin && (
                <div className="bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Publicação Imediata na Loja
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Como administrador, você pode inserir o produto diretamente no catálogo ativo ao enviar.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="submit-product-request-btn"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-cyan-500/25 active:scale-[0.99] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Processando cadastro...'
                      : autoApprove && isMasterAdmin
                      ? 'Cadastrar & Publicar Agora na Loja'
                      : 'Enviar Pedido de Cadastro de Produto'}
                  </span>
                </button>
              </div>

            </div>

            {/* Right Column: Live Preview Card (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-24 space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Prévia do Produto
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">Tempo Real</span>
                </div>

                {/* Preview Card styled identically to the store */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  {/* Visual: Peptide Vial or Uploaded Photo */}
                  <div className="bg-gradient-to-b from-[#070A10] to-slate-950 rounded-xl p-4 flex items-center justify-center min-h-[160px] border border-slate-800/80">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name || 'Produto'}
                        className="max-h-36 object-contain rounded-lg"
                      />
                    ) : (
                      <PeptideVial
                        name={name || 'PRODUTO'}
                        dosage={dosage || '10 MG'}
                        capColor={capColor}
                      />
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      {isCustomCategory && customCategory ? customCategory : category}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {name || 'Nome do Peptídeo'}
                    </h4>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">
                      {dosage || 'Dosagem'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {description || 'A descrição detalhada inserida no formulário será exibida aqui para o cliente.'}
                  </p>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Preço de Venda</span>
                      <span className="text-lg font-bold text-white">
                        R$ {numPrice > 0 ? numPrice.toFixed(2).replace('.', ',') : '0,00'}
                      </span>
                    </div>

                    {numCost > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block">Lucro Previsto</span>
                        <span className="text-xs font-bold text-emerald-400">
                          +R$ {profit.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Share Link Box */}
                <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    Link do Dono do Site
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Salve este endereço em seus favoritos ou compartilhe com quem gerencia os pedidos de produtos.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={getProductRequestShareUrl()}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 font-medium transition-colors"
                      title="Copiar Link"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
