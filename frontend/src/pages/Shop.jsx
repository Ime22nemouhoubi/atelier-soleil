import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { fetchCategories, fetchProducts } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Shop() {
  const { t, localized } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (search.trim()) params.q = search.trim();
    fetchProducts(params)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const setCategory = (slug) => {
    if (slug) setSearchParams({ category: slug });
    else setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 fade-in">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-[0.4em] text-burgundy mb-3">✦</div>
        <h1 className="font-display text-5xl text-ink">{t('shop_title')}</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <input
          type="search"
          placeholder={t('shop_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-5 py-3 rounded-full border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <select
          value={activeCategory}
          onChange={(e) => setCategory(e.target.value)}
          className="px-5 py-3 rounded-full border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 min-w-[200px]"
        >
          <option value="">{t('shop_filter_all')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{localized(c, 'name')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-ink/50 py-20">{t('loading')}</div>
      ) : products.length === 0 ? (
        <div className="text-center text-ink/50 py-20">{t('shop_no_results')}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
