import React, { useState } from 'react';
import { ArrowRight, SearchX, SlidersHorizontal, Tag, Star, Sparkles, Search, X } from 'lucide-react';
import { ProductCategory } from '../types';
import { ProductCard } from './ProductCard';
import { useApp } from '../context/AppContext';

export const ProductCatalog: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [specialFilter, setSpecialFilter] = useState<'all' | 'promotions' | 'featured'>('all');

  const categories: ProductCategory[] = [
    'Todos',
    ...(Array.from(new Set(products.map(p => p.category).filter(Boolean))) as ProductCategory[])
  ];

  // Count available promotions and featured items
  const promoCount = products.filter((p) => p.isPromotion).length;
  const featuredCount = products.filter((p) => p.featured).length;

  // Filter products based on Category, Search Query, and Special Filters
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategory === 'Todos' || product.category === selectedCategory;

      let matchesSpecial = true;
      if (specialFilter === 'promotions') {
        matchesSpecial = !!product.isPromotion;
      } else if (specialFilter === 'featured') {
        matchesSpecial = !!product.featured;
      }

      const query = (searchQuery || '').toLowerCase().trim();
      const matchesQuery =
        !query ||
        (product.name || '').toLowerCase().includes(query) ||
        (product.dosage || '').toLowerCase().includes(query) ||
        (product.category || '').toLowerCase().includes(query) ||
        (product.description || '').toLowerCase().includes(query) ||
        (Array.isArray(product.benefits) &&
          product.benefits.some((b) => typeof b === 'string' && b.toLowerCase().includes(query)));

      return matchesCategory && matchesSpecial && matchesQuery;
    })
    .sort((a, b) => {
      // Prioritize featured and promotion items to top
      const scoreA = (a.featured ? 2 : 0) + (a.isPromotion ? 1 : 0);
      const scoreB = (b.featured ? 2 : 0) + (b.isPromotion ? 1 : 0);
      return scoreB - scoreA;
    });

  return (
    <section id="catalogo" className="w-full bg-[#F8FAFC] py-12 md:py-16 text-slate-900 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header: Title + Accent Line + "Ver todos os produtos" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-tech whitespace-nowrap">
              NOSSO <span className="text-cyan-600">CATÁLOGO</span>
            </h2>
            {/* Elegant horizontal divider line extending right */}
            <div className="hidden sm:block h-[2px] bg-slate-300 flex-1 max-w-xs rounded-full" />
          </div>

          {/* Quick special filters: Promotions & Featured (Removed duplicate) */}
          <div className="hidden"></div>
        </div>

        {/* Search Bar & Special Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar peptídeo, dosagem ou categoria..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick special filters: Promotions & Featured */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpecialFilter(specialFilter === 'promotions' ? 'all' : 'promotions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                specialFilter === 'promotions'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                  : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 shadow-xs'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Promoções ({promoCount})</span>
            </button>

            <button
              onClick={() => setSpecialFilter(specialFilter === 'featured' ? 'all' : 'featured')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                specialFilter === 'featured'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20'
                  : 'bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50 shadow-xs'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-cyan-600 text-cyan-600" />
              <span>Destaques ({featuredCount})</span>
            </button>
          </div>
        </div>

        {/* Category Filters (Pills) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 px-1 mb-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSpecialFilter('all');
                }}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F172A] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                {cat}
              </button>
            );
          })}

          {searchQuery && (
            <div className="flex items-center gap-2 pl-3 ml-auto text-xs text-slate-500">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
              <span>Filtro por busca: &ldquo;{searchQuery}&rdquo;</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-cyan-600 hover:underline font-bold ml-1"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Product Grid: 4 columns on desktop, 2 on tablet, 1-2 on mobile */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs p-8 max-w-md mx-auto">
            <SearchX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Não encontramos nenhum peptídeo para &ldquo;{searchQuery}&rdquo; com os filtros selecionados.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSpecialFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Exibir todo o catálogo
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

