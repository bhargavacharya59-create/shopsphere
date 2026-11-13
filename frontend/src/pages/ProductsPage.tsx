import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Product, Category, ProductListResponse } from '../types';
import api from '../lib/api';
import { ProductCard } from '../components/product/ProductCard';
import { PageLoader, LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/ErrorMessage';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'created_at_desc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Rated', value: 'rating_desc' },
  { label: 'Name A-Z', value: 'name_asc' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const categoryId = searchParams.get('category_id') || '';
  const search = searchParams.get('search') || '';
  const sortRaw = searchParams.get('sort') || 'created_at_desc';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const featured = searchParams.get('featured') === 'true';
  const trending = searchParams.get('trending') === 'true';

  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);

  const [sortBy, sortOrder] = (() => {
    // Handle compound sort keys like 'created_at_desc', 'price_asc', 'rating_desc', 'name_asc'
    const parts = sortRaw.split('_');
    const order = parts[parts.length - 1]; // last segment is always asc/desc
    const col = parts.slice(0, -1).join('_'); // everything before is the column
    return [col || 'created_at', order || 'desc'];
  })();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', '20');
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);
      if (categoryId) params.set('category_id', categoryId);
      if (search) params.set('search', search);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (featured) params.set('featured', 'true');
      if (trending) params.set('trending', 'true');

      const res = await api.get<ProductListResponse>(`/products?${params}`);
      setProducts(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, search, sortRaw, minPrice, maxPrice, featured, trending]);

  useEffect(() => {
    api.get('/products/categories').then(r => setCategories(r.data));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const applyPriceFilter = () => {
    const next = new URLSearchParams(searchParams);
    if (priceMin) next.set('min_price', priceMin); else next.delete('min_price');
    if (priceMax) next.set('max_price', priceMax); else next.delete('max_price');
    next.delete('page');
    setSearchParams(next);
    setFilterOpen(false);
  };

  const clearAll = () => {
    setSearchParams(new URLSearchParams());
    setPriceMin(''); setPriceMax('');
  };

  const activeCategory = categories.find(c => c.id === parseInt(categoryId));
  const hasFilters = !!(categoryId || search || minPrice || maxPrice || featured || trending);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {search ? `Results for "${search}"` :
           activeCategory ? activeCategory.name :
           featured ? '⭐ Featured Products' :
           trending ? '🔥 Trending Products' : 'All Products'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? 'Loading...' : `${total.toLocaleString()} products`}
        </p>
      </div>

      <div className="flex gap-6">

        {/* Sidebar Filters — Desktop */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="card p-4 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              {hasFilters && (
                <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">Clear all</button>
              )}
            </div>

            {/* Category */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
              <button
                onClick={() => updateParam('category_id', null)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 ${!categoryId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => updateParam('category_id', String(cat.id))}
                  className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm mb-0.5 ${categoryId === String(cat.id) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Price Range */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Range</p>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="input-field text-xs"
                  min={0}
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="input-field text-xs"
                  min={0}
                />
              </div>
              <button onClick={applyPriceFilter} className="w-full btn-primary text-xs py-1.5">Apply</button>
            </div>

            {/* Quick Filters */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Collections</p>
              <button
                onClick={() => updateParam('featured', featured ? null : 'true')}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm mb-0.5 ${featured ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                ⭐ Featured
              </button>
              <button
                onClick={() => updateParam('trending', trending ? null : 'true')}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${trending ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                🔥 Trending
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setFilterOpen(true)}
              className="lg:hidden btn-secondary text-sm flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" /> Filters
              {hasFilters && <span className="badge-blue">{[categoryId, minPrice, maxPrice, featured && 'f', trending && 't'].filter(Boolean).length}</span>}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-600 hidden sm:block">Sort:</label>
              <select
                value={sortRaw}
                onChange={e => updateParam('sort', e.target.value)}
                className="input-field text-sm w-auto"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {search && (
                <span className="badge-blue flex items-center gap-1">
                  "{search}"
                  <button onClick={() => updateParam('search', null)}><XMarkIcon className="h-3 w-3" /></button>
                </span>
              )}
              {activeCategory && (
                <span className="badge-blue flex items-center gap-1">
                  {activeCategory.name}
                  <button onClick={() => updateParam('category_id', null)}><XMarkIcon className="h-3 w-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="badge-blue flex items-center gap-1">
                  ${minPrice || '0'} – ${maxPrice || '∞'}
                  <button onClick={() => { updateParam('min_price', null); updateParam('max_price', null); setPriceMin(''); setPriceMax(''); }}><XMarkIcon className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms."
              action={<button onClick={clearAll} className="btn-primary">Clear Filters</button>}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="btn-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => updateParam('page', String(p))}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => updateParam('page', String(page + 1))}
                className="btn-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative ml-auto w-80 bg-white h-full overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              <button onClick={() => setFilterOpen(false)}><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Category</p>
              {[{ id: 0, name: 'All' }, ...categories].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { updateParam('category_id', cat.id ? String(cat.id) : null); setFilterOpen(false); }}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${(cat.id ? categoryId === String(cat.id) : !categoryId) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Price Range</p>
              <div className="flex gap-2 mb-2">
                <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min" className="input-field text-sm" />
                <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max" className="input-field text-sm" />
              </div>
              <button onClick={applyPriceFilter} className="w-full btn-primary text-sm">Apply Price</button>
            </div>
            {hasFilters && <button onClick={() => { clearAll(); setFilterOpen(false); }} className="w-full btn-secondary text-sm">Clear All Filters</button>}
          </div>
        </div>
      )}
    </div>
  );
}
