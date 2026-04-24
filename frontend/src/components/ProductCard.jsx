import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';

export default function ProductCard({ product }) {
  const { localized, t } = useLang();
  const name = localized(product, 'name');
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-square bg-sand overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-rose-300">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <path d="M21 15l-5-5L5 21"></path>
            </svg>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl text-ink mb-1 line-clamp-2 leading-snug">{name}</h3>
        <div className="flex items-baseline justify-between mt-3">
          <span className="text-burgundy font-semibold text-lg">
            {Number(product.price).toLocaleString()} <span className="text-xs text-ink/60">{t('currency')}</span>
          </span>
          {product.stock > 0 ? (
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {t('product_in_stock')}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {t('product_out_of_stock')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
