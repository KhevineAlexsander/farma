import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { PeptideVial } from './PeptideVial';
import { useApp } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    cartTotal,
    removeFromCart,
    updateCartQuantity,
    setCurrentView,
    storeSettings,
    appliedCoupon,
    couponDiscount,
    deliveryFee,
    applyCouponCode,
    removeCoupon,
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success?: string; error?: string }>({});

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput);
    if (res.success) {
      setCouponFeedback({ success: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ error: res.message });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponFeedback({});
  };

  const subtotalAfterCoupon = Math.max(0, cartTotal - (storeSettings.couponsEnabled !== false ? couponDiscount : 0));
  const importTax = cart.length > 0 ? 100.00 : 0;
  const estimatedTotal = subtotalAfterCoupon + importTax;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setCurrentView('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white text-slate-900 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-cyan-600" />
              <h2 className="text-lg font-extrabold text-slate-900 font-tech">
                SEU CARRINHO ({cart.length})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              aria-label="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length > 0 ? (
              cart.map((item, idx) => (
                <div
                  key={item.product?.id || idx}
                  className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors"
                >
                  {/* Miniature Vial */}
                  <div className="w-14 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                    <PeptideVial
                      capColor={item.product?.capColor}
                      name={item.product?.name || 'Peptídeo'}
                      dosage={item.product?.dosage || ''}
                      size="sm"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {item.product?.name || 'Produto'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {item.product?.dosage || '-'} • R$ {(item.product?.price || 0).toFixed(2).replace('.', ',')}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                        <button
                          onClick={() => item.product?.id && updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => item.product?.id && updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-900 ml-auto">
                        R$ {((item.product?.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => item.product?.id && removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <ShoppingBag className="w-14 h-14 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-base font-bold text-slate-700">Seu carrinho está vazio</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore nosso catálogo e adicione os melhores peptídeos importados de pureza garantida.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Explorar Catálogo
                </button>
              </div>
            )}
          </div>

          {/* Footer with totals and CTA */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
              {/* Coupon Form */}
              {storeSettings.couponsEnabled !== false && (
                <>
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Cupom (ex: PEPTIDE10)"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-500 uppercase tracking-wider"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </form>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-emerald-800 tracking-wider">
                            CUPOM {appliedCoupon.code}
                          </span>
                          <span className="text-[11px] text-emerald-600 block">
                            {appliedCoupon.type === 'PERCENTAGE'
                              ? `${appliedCoupon.value}% de desconto`
                              : `R$ ${(appliedCoupon.value || 0).toFixed(2).replace('.', ',')} de desconto`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                        title="Remover cupom"
                      >
                        Remover
                      </button>
                    </div>
                  )}

                  {couponFeedback.success && (
                    <p className="text-xs text-emerald-600 font-medium">{couponFeedback.success}</p>
                  )}
                  {couponFeedback.error && (
                    <p className="text-xs text-red-500 font-medium">{couponFeedback.error}</p>
                  )}
                </>
              )}

              {/* Subtotal breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal dos produtos</span>
                  <span className="font-semibold text-slate-800">
                    R$ {(cartTotal || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {storeSettings.couponsEnabled !== false && appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Desconto Cupom ({appliedCoupon.code})</span>
                    <span>- R$ {(couponDiscount || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxa de Importação</span>
                  <span className="font-semibold text-slate-800">
                    R$ 100,00
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-950 pt-2 border-t border-slate-200">
                  <span>Total estimado</span>
                  <span className="text-lg text-slate-900 font-tech">
                    R$ {(estimatedTotal || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0F172A] hover:bg-slate-800 active:bg-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              >
                <span>Finalizar Pedido</span>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
