import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../redux/productSlice';
import ProductCard from '../components/Product/ProductCard';
import { Grid, List, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';

const Shop = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { products, categories, loading } = useSelector((state) => state.products);

  // Read URL query values
  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlSort = searchParams.get('sort') || 'newest';

  // Local state reflecting current query filters
  const [localSearch, setLocalSearch] = useState(urlSearch);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({
      category: urlCategory,
      search: urlSearch,
      sort: urlSort
    }));
  }, [urlCategory, urlSearch, urlSort, dispatch]);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters('search', localSearch);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setLocalSearch('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page title header */}
        <div className="border-b border-neutral-100 dark:border-neutral-900 pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide">
              The BLC Collection
            </h1>
            <p className="text-neutral-400 dark:text-neutral-500 text-xs md:text-sm font-light mt-1">
              Showing {products.length} luxury statement pieces
            </p>
          </div>
          
          {/* Breadcrumbs or quick sorting */}
          <div className="flex items-center space-x-4 self-start md:self-auto">
            <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Sort By</span>
            <select
              value={urlSort}
              onChange={(e) => updateFilters('sort', e.target.value)}
              className="text-xs font-semibold py-2.5 px-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="ratings">Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Sidebar & Grid Main section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filter Sidebar */}
          <div className="space-y-8 lg:sticky lg:top-28 self-start bg-neutral-50 dark:bg-neutral-950 p-6 rounded-xl border border-neutral-100 dark:border-neutral-900">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60 dark:border-neutral-800">
              <span className="font-playfair font-bold text-base tracking-wide flex items-center">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-luxury-gold-500" /> Filters
              </span>
              {(urlCategory || urlSearch) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center font-semibold"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </button>
              )}
            </div>

            {/* Search Input Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Search
              </label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Keyword..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full text-xs py-3 pl-3 pr-10 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-luxury-gold-500 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Categories filter */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Categories
              </label>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => updateFilters('category', '')}
                  className={`text-left text-sm py-1.5 px-2.5 rounded transition-all font-medium ${
                    !urlCategory 
                      ? 'bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 text-black shadow' 
                      : 'hover:text-luxury-gold-500 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilters('category', cat.name)}
                    className={`text-left text-sm py-1.5 px-2.5 rounded transition-all font-medium ${
                      urlCategory === cat.name 
                        ? 'bg-gradient-to-r from-luxury-gold-600 to-luxury-gold-500 text-black shadow' 
                        : 'hover:text-luxury-gold-500 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Products Catalog Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-neutral-200 dark:bg-neutral-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-900">
                <h3 className="font-playfair text-xl font-bold mb-2">No Items Found</h3>
                <p className="text-neutral-400 text-sm max-w-sm mx-auto mb-6">
                  We couldn't find any products matching your active filters. Try refining your keywords or sorting criteria.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                >
                  Reset Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Shop;
