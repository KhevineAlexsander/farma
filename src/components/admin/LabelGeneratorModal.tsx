import React, { useEffect, useMemo, useState } from 'react';
import { X, Tags, Search, Download, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import {
  generateLabelsPdf,
  renderLabelCanvas,
  formatLabelProductText,
  LabelOptions,
  LABELS_PER_PAGE,
} from '../../utils/labelPdf';

interface LabelGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  storeName: string;
  showToast: (msg: string) => void;
}

const DEFAULT_QTY = 10;

export const LabelGeneratorModal: React.FC<LabelGeneratorModalProps> = ({ isOpen, onClose, products, storeName, showToast }) => {
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => formatLabelProductText(a).localeCompare(formatLabelProductText(b))),
    [products]
  );

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [bulkQty, setBulkQty] = useState(String(DEFAULT_QTY));
  const [options, setOptions] = useState<LabelOptions>({
    storeName: storeName || 'Glow Imports Farma',
    subtitle: 'Premium Peptides',
    sideText: '99% Purity',
    footerText: 'Research Use Only',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOptions((o) => ({ ...o, storeName: storeName || o.storeName }));
    }
  }, [isOpen, storeName]);

  const selectedItems = useMemo(
    () => sortedProducts.filter((p) => (quantities[p.id] || 0) > 0).map((p) => ({ product: p, quantity: quantities[p.id] })),
    [sortedProducts, quantities]
  );
  const totalLabels = selectedItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalPages = Math.ceil(totalLabels / LABELS_PER_PAGE);

  // Prévia da etiqueta (primeiro produto selecionado, ou o primeiro do catálogo)
  const previewProduct = selectedItems[0]?.product || sortedProducts[0];
  useEffect(() => {
    if (!isOpen || !previewProduct) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        await document.fonts.ready;
      } catch {}
      if (!cancelled) setPreviewUrl(renderLabelCanvas(previewProduct, options).toDataURL('image/png'));
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [isOpen, previewProduct, options]);

  if (!isOpen) return null;

  const filtered = sortedProducts.filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || formatLabelProductText(p).toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
  });

  const setQty = (id: string, value: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, Math.min(999, Math.floor(value) || 0)) }));

  const applyToVisible = (value: number) =>
    setQuantities((prev) => {
      const next = { ...prev };
      filtered.forEach((p) => (next[p.id] = Math.max(0, Math.min(999, Math.floor(value) || 0))));
      return next;
    });

  const handleGenerate = async () => {
    if (totalLabels === 0) {
      showToast('Selecione ao menos um produto e informe a quantidade de etiquetas.');
      return;
    }
    setIsGenerating(true);
    try {
      const safeName = (options.storeName || 'loja').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const count = await generateLabelsPdf(selectedItems, options, `etiquetas_4x2_${safeName || 'loja'}.pdf`);
      showToast(`PDF gerado com ${count} etiqueta(s) em ${Math.ceil(count / LABELS_PER_PAGE)} página(s) A4.`);
    } catch (e: any) {
      console.error('Erro ao gerar PDF de etiquetas:', e);
      showToast(`Erro ao gerar o PDF: ${e?.message || e}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="label-gen-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h2 id="label-gen-title" className="text-sm font-bold text-white">
              Gerar Etiquetas em PDF (4 x 2 cm · A4 · 40 por folha)
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Configuração + prévia */}
          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-xl bg-white p-3 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Prévia da etiqueta" className="w-full max-w-[320px] h-auto" />
              ) : (
                <span className="text-xs text-slate-500">Prévia</span>
              )}
            </div>
            <label className="block text-[11px] font-semibold text-slate-400">
              Nome do site / marca
              <input className={inputCls} value={options.storeName} maxLength={40} onChange={(e) => setOptions({ ...options, storeName: e.target.value })} />
            </label>
            <label className="block text-[11px] font-semibold text-slate-400">
              Subtítulo
              <input className={inputCls} value={options.subtitle} maxLength={40} onChange={(e) => setOptions({ ...options, subtitle: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[11px] font-semibold text-slate-400">
                Texto lateral
                <input className={inputCls} value={options.sideText} maxLength={20} onChange={(e) => setOptions({ ...options, sideText: e.target.value })} />
              </label>
              <label className="block text-[11px] font-semibold text-slate-400">
                Rodapé
                <input className={inputCls} value={options.footerText} maxLength={30} onChange={(e) => setOptions({ ...options, footerText: e.target.value })} />
              </label>
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input className={`${inputCls} pl-8`} placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <input
                className={`${inputCls} !w-16 text-center`}
                type="number"
                min={0}
                max={999}
                value={bulkQty}
                onChange={(e) => setBulkQty(e.target.value)}
                aria-label="Quantidade para aplicar"
              />
              <button
                type="button"
                onClick={() => applyToVisible(parseInt(bulkQty, 10))}
                className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/25"
              >
                Aplicar a todos
              </button>
              <button
                type="button"
                onClick={() => applyToVisible(0)}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Limpar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[45vh] lg:max-h-[52vh] rounded-xl border border-slate-800 divide-y divide-slate-800">
              {filtered.length === 0 && <p className="p-4 text-xs text-slate-500 text-center">Nenhum produto encontrado.</p>}
              {filtered.map((p) => {
                const qty = quantities[p.id] || 0;
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-3 py-2 ${qty > 0 ? 'bg-amber-500/5' : ''}`}>
                    <input
                      type="checkbox"
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                      checked={qty > 0}
                      onChange={(e) => setQty(p.id, e.target.checked ? DEFAULT_QTY : 0)}
                      aria-label={`Selecionar ${formatLabelProductText(p)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{formatLabelProductText(p)}</p>
                      <p className="text-[10px] text-slate-500 truncate">{p.category}</p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={qty}
                      onChange={(e) => setQty(p.id, parseInt(e.target.value, 10))}
                      className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs text-center focus:outline-none focus:border-amber-500"
                      aria-label={`Quantidade de etiquetas de ${formatLabelProductText(p)}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            <span className="font-bold text-amber-300">{totalLabels}</span> etiqueta(s) · {selectedItems.length} produto(s) ·{' '}
            {totalPages} folha(s) A4
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || totalLabels === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isGenerating ? 'Gerando...' : 'Gerar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
