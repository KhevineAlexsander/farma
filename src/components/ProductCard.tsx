import React from 'react';
import { Check, ShoppingCart, Info, Star, Tag, Lock } from 'lucide-react';
import { Product } from '../types';
import { PeptideVial } from './PeptideVial';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProductDetail, storeSettings, showToast } = useApp();
  const isSuspended = Boolean(storeSettings.purchasesSuspended);

  return (
    <div className={`bg-white rounded-2xl border apple-card-hover flex flex-col justify-between overflow-hidden group relative ${
      product.isPromotion
        ? 'border-rose-300 shadow-md shadow-rose-500/5 hover:border-rose-400'
        : product.featured
        ? 'border-cyan-300 shadow-md shadow-cyan-500/5 hover:border-cyan-400'
        : 'border-slate-200/90 shadow-sm hover:shadow-xl hover:border-cyan-400/40'
    }`}>
      
      {/* Top Floating Badges (Promotion & Featured) */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
        {product.isPromotion && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm animate-pulse">
            <Tag className="w-2.5 h-2.5" />
            {product.promotionDiscount ? `-${product.promotionDiscount}% OFF` : 'OFERTA'}
          </span>
        )}
        {product.featured && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm">
            <Star className="w-2.5 h-2.5 fill-white" />
            Destaque
          </span>
        )}
      </div>

      {/* Top Body (Clickable for full details) */}
      <div
        onClick={() => setSelectedProductDetail(product)}
        className="p-4 sm:p-5 pt-8 cursor-pointer flex flex-col flex-grow"
      >
        <div className="grid grid-cols-12 gap-3 items-center">
          
          {/* Left: Product Photo or Peptide 3D Lab Vial */}
          <div className="col-span-5 flex items-center justify-center py-2 bg-slate-50/70 rounded-xl group-hover:bg-cyan-50/40 transition-colors overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-24 object-contain rounded-lg p-1"
              />
            ) : (
              <PeptideVial
                capColor={product.capColor}
                name={product.name}
                dosage={product.dosage}
                size="sm"
              />
            )}
          </div>

          {/* Right: Info, Benefits, Price */}
          <div className="col-span-7 flex flex-col justify-between h-full pl-1">
            <div>
              {/* Product Title */}
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight tracking-tight group-hover:text-cyan-700 transition-colors">
                {product.name}
              </h3>
              
              {/* Dosage */}
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mt-0.5">
                {product.dosage}
              </p>

              {/* Benefits list removed */}
            </div>

            {/* Price in BRL (R$) with strikethrough if on promotion */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-end justify-between">
              <div>
                {product.isPromotion && product.originalPrice ? (
                  <span className="text-[11px] text-slate-400 line-through block leading-none mb-0.5">
                    De R$ {(product.originalPrice || 0).toFixed(2).replace('.', ',')}
                  </span>
                ) : null}
                <div className="flex items-baseline">
                  <span className="text-xs text-slate-700 font-semibold mr-1">
                    {product.isPromotion ? 'Por R$' : 'R$'}
                  </span>
                  <span className={`text-lg sm:text-xl font-extrabold ${product.isPromotion ? 'text-rose-600' : 'text-slate-950'}`}>
                    {(product.price || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Quick View hint */}
              <span className="text-[10px] text-cyan-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <Info className="w-3 h-3" /> Detalhes
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Card Footer: Full-width "Adicionar ao carrinho" Button */}
      <div className="p-3 pt-0 bg-white">
        {isSuspended ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              showToast(storeSettings.suspensionMessage || '⚠️ Estamos fechando o caixa no momento. As compras estão temporariamente suspensas e voltaremos em breve!');
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            title="Compras suspensas temporariamente para fechamento de caixa"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Caixa Fechando • Compras Suspensas</span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer group/btn ${
              product.isPromotion
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-[#0F172A] hover:bg-slate-800 active:bg-cyan-600'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-cyan-400 group-hover/btn:translate-x-0.5 transition-transform" />
            <span>{product.isPromotion ? 'Aproveitar Oferta' : 'Adicionar ao carrinho'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

