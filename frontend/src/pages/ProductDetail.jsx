import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { fetchProduct } from '../api/client.js';

export default function ProductDetail() {
  const { id } = useParams();
  const { t, localized } = useLang();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="text-center py-20 text-ink/50">{t('loading')}</div>;
  if (!product) return <div className="text-center py-20 text-ink/50">{t('product_not_found')}</div>;

  const name = localized(product, 'name');
  const desc = localized(product, 'description');
  const inStock = product.stock > 0;
  const images = product.images && product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : [];
  const currentImage = images[activeImg] || null;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 fade-in">
      <Link to="/shop" className="text-sm text-burgundy hover:underline">{t('product_back')}</Link>
      <div className="grid md:grid-cols-2 gap-12 mt-6">
        {/* Image gallery */}
        <div>
          <div className="aspect-square bg-sand rounded-3xl overflow-hidden shadow-soft mb-4">
            {currentImage ? (
              <img src={currentImage} alt={name} className="w-full h-full object-cover transition-opacity duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-rose-300">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 21"></path>
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-lg overflow-hidden bg-sand transition-all ${
                    i === activeImg ? 'ring-2 ring-burgundy ring-offset-2' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category_name_fr && (
            <div className="text-xs uppercase tracking-[0.3em] text-burgundy mb-3">
              {localized(product, 'category_name')}
            </div>
          )}
          <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">{name}</h1>
          <div className="text-3xl text-burgundy font-semibold mb-6">
            {Number(product.price).toLocaleString()} <span className="text-base text-ink/60">{t('currency')}</span>
          </div>

          <div className="mb-6">
            {inStock ? (
              <span className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                ● {t('product_in_stock')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-rose-700 bg-rose-50 px-3 py-1 rounded-full">
                ● {t('product_out_of_stock')}
              </span>
            )}
          </div>

          {desc && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-[0.3em] text-ink/60 mb-2">{t('product_description')}</h2>
              <p className="text-ink/80 leading-relaxed whitespace-pre-line">{desc}</p>
            </div>
          )}

          {inStock && (
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex items-center border border-rose-200 rounded-full overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 hover:bg-rose-50" aria-label="decrease">−</button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-4 py-3 hover:bg-rose-50" aria-label="increase">+</button>
              </div>
              <button
                onClick={handleAdd}
                className={`flex-1 px-8 py-4 rounded-full text-cream uppercase tracking-wider text-sm transition-all ${
                  added ? 'bg-emerald-600' : 'bg-burgundy hover:bg-rose-700'
                }`}
              >
                {added ? `✓ ${t('product_added')}` : t('product_add_to_cart')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
