import React, { useState } from 'react';
import { X, Check, ShieldCheck, Thermometer, FileText, ShoppingCart, Plus, Minus, Sparkles } from 'lucide-react';
import { PeptideVial } from './PeptideVial';
import { useApp } from '../context/AppContext';

export const ProductDetailModal: React.FC = () => {
  const { selectedProductDetail, setSelectedProductDetail, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);

  if (!selectedProductDetail) return null;

  const product = selectedProductDetail;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setSelectedProductDetail(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={() => setSelectedProductDetail(null)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            
            {/* Product Photo or Vial Showcase */}
            <div className="sm:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-200/80 relative overflow-hidden">
              <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 z-10">
                {product.category}
              </span>
              {product.imageUrl ? (
                <div className="w-full h-48 sm:h-56 flex items-center justify-center py-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-xl drop-shadow-md"
                  />
                </div>
              ) : (
                <PeptideVial
                  capColor={product.capColor}
                  name={product.name}
                  dosage={product.dosage}
                  size="hero"
                  glow={true}
                />
              )}
              <span className="mt-3 text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Laudo HPLC {product.purity}
              </span>
            </div>

            {/* Product Meta */}
            <div className="sm:col-span-7 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-tech">
                    {product.name}
                  </h2>
                  <span className="text-sm font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                    {product.dosage}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Código de Rastreio Farma: <span className="font-mono text-slate-700">{product.id.toUpperCase()}</span>
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Benefits section removed */}

              {/* Price & Stock info */}
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold mr-1">Preço:</span>
                  <span className="text-2xl font-black text-slate-900">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    product.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {product.stock > 10 ? 'Pronta Entrega' : `Apenas ${product.stock} un. em estoque`}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Protocols, Storage and Quality Accordion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <Thermometer className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Armazenamento</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">{product.storage}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <FileText className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Reconstituição</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">{product.reconstitution}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Action */}
        <div className="p-4 sm:px-8 sm:py-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <span className="text-xs font-bold text-slate-700">Qtd:</span>
            <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Diminuir quantidade"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 py-1 text-sm font-bold text-slate-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Aumentar quantidade"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            className="w-full sm:w-auto flex-1 py-3 px-6 rounded-xl bg-[#0F172A] hover:bg-slate-800 active:bg-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
            <span>Adicionar {(quantity > 1 ? `(${quantity})` : '')} por R$ {(product.price * quantity).toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
