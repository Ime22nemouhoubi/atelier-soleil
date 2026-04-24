import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Cart() {
  const { t, lang } = useLang();
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center fade-in">
        <h1 className="font-display text-4xl text-ink mb-4">{t('cart_title')}</h1>
        <p className="text-ink/60 mb-8">{t('cart_empty')}</p>
        <Link
          to="/shop"
          className="inline-block px-8 py-4 bg-burgundy text-cream rounded-full hover:bg-rose-700 uppercase tracking-wider text-sm"
        >
          {t('cart_continue_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 fade-in">
      <h1 className="font-display text-4xl md:text-5xl text-ink mb-8 text-center">{t('cart_title')}</h1>
      <div className="space-y-4">
        {items.map((item) => {
          const name = lang === 'ar' ? item.name_ar : item.name_fr;
          return (
            <div
              key={item.product_id}
              className="bg-white rounded-2xl shadow-soft p-4 flex flex-col sm:flex-row gap-4 items-center"
            >
              <div className="w-24 h-24 bg-sand rounded-xl overflow-hidden flex-shrink-0">
                {item.image_url && (
                  <img src={item.image_url} alt={name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-start">
                <Link to={`/product/${item.product_id}`} className="font-display text-xl text-ink hover:text-burgundy">
                  {name}
                </Link>
                <div className="text-sm text-ink/60 mt-1">
                  {t('cart_unit_price')}: {Number(item.price).toLocaleString()} {t('currency')}
                </div>
              </div>
              <div className="flex items-center border border-rose-200 rounded-full overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="px-3 py-2 hover:bg-rose-50"
                >−</button>
                <span className="w-10 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="px-3 py-2 hover:bg-rose-50"
                >+</button>
              </div>
              <div className="font-semibold text-burgundy text-lg min-w-[120px] text-center sm:text-end">
                {(item.price * item.quantity).toLocaleString()} {t('currency')}
              </div>
              <button
                onClick={() => removeItem(item.product_id)}
                className="text-sm text-rose-600 hover:underline"
              >
                {t('cart_remove')}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 bg-burgundy text-cream rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-cream/70">{t('cart_total')}</div>
          <div className="font-display text-4xl">
            {total.toLocaleString()} <span className="text-base">{t('currency')}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="px-8 py-4 bg-cream text-burgundy rounded-full hover:bg-gold hover:text-ink transition-colors uppercase tracking-wider text-sm font-semibold"
        >
          {t('cart_checkout')} →
        </button>
      </div>
    </div>
  );
}
