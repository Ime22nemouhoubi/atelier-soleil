import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { submitOrder, fetchDeliveryPricing } from '../api/client.js';
import { WILAYAS } from '../locales/wilayas.js';

export default function Checkout() {
  const { t, lang } = useLang();
  const { items, total: subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    wilaya: '',
    address: '',
    notes: '',
    delivery_type: 'stopdesk',
  });
  const [pricing, setPricing] = useState(null); // {prices, freeDeliveryThreshold}
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeliveryPricing()
      .then(setPricing)
      .catch(() => setPricing({ prices: {}, freeDeliveryThreshold: 10000 }));
  }, []);

  if (items.length === 0) return <Navigate to="/cart" />;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Compute current delivery fee for display (server re-validates on submit)
  const { deliveryFee, deliveryAvailable, homeAvailable, stopdeskAvailable, freeDelivery } = useMemo(() => {
    if (!pricing || !form.wilaya) {
      return { deliveryFee: null, deliveryAvailable: false, homeAvailable: false, stopdeskAvailable: false, freeDelivery: false };
    }
    const entry = pricing.prices[form.wilaya];
    if (!entry) return { deliveryFee: null, deliveryAvailable: false, homeAvailable: false, stopdeskAvailable: false, freeDelivery: false };

    const isBlida = form.wilaya === 'Blida';
    const homeAvail = isBlida || entry.home > 0;
    const stopAvail = isBlida || entry.stopdesk > 0;
    const free = subtotal >= pricing.freeDeliveryThreshold;

    const rawFee = entry[form.delivery_type] ?? 0;
    const availableNow = form.delivery_type === 'home' ? homeAvail : stopAvail;
    const fee = !availableNow ? null : free ? 0 : rawFee;
    return {
      deliveryFee: fee,
      deliveryAvailable: availableNow,
      homeAvailable: homeAvail,
      stopdeskAvailable: stopAvail,
      freeDelivery: free && availableNow,
    };
  }, [pricing, form.wilaya, form.delivery_type, subtotal]);

  const total = deliveryFee !== null ? subtotal + deliveryFee : subtotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customer_name || !form.customer_phone || !form.wilaya || !form.address) {
      setError(t('checkout_required'));
      return;
    }
    if (!deliveryAvailable) {
      setError(t('checkout_delivery_unavailable'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrder({
        ...form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      clear();
      navigate(`/order/${result.id}`);
    } catch (err) {
      setError(err?.response?.data?.error || t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300';
  const freeHint = pricing?.freeDeliveryThreshold
    ? (lang === 'ar'
        ? `توصيل مجاني ابتداءً من ${pricing.freeDeliveryThreshold.toLocaleString()} ${t('currency')}`
        : `Livraison offerte dès ${pricing.freeDeliveryThreshold.toLocaleString()} ${t('currency')} d'achat`)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 fade-in">
      <h1 className="font-display text-4xl md:text-5xl text-ink mb-3 text-center">{t('checkout_title')}</h1>
      <p className="text-center text-ink/60 mb-10 max-w-xl mx-auto">{t('checkout_intro')}</p>

      <div className="grid lg:grid-cols-3 gap-10">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl shadow-soft p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-sm text-ink/70 mb-2">{t('checkout_name')} *</label>
            <input type="text" value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} className={inputCls} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-ink/70 mb-2">{t('checkout_phone')} *</label>
              <input type="tel" value={form.customer_phone} onChange={(e) => update('customer_phone', e.target.value)} className={inputCls} placeholder="+213 ..." required />
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-2">{t('checkout_wilaya')} *</label>
              <select value={form.wilaya} onChange={(e) => update('wilaya', e.target.value)} className={inputCls} required>
                <option value="">{t('checkout_wilaya_select')}</option>
                {WILAYAS.map(([fr, ar]) => {
                  const label = lang === 'ar' ? ar : fr;
                  return <option key={fr} value={fr}>{label}</option>;
                })}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink/70 mb-2">{t('checkout_address')} *</label>
            <textarea value={form.address} onChange={(e) => update('address', e.target.value)} className={inputCls} rows="3" required />
          </div>

          {/* Delivery type selector */}
          <div className="border-t border-rose-100 pt-5">
            <label className="block text-sm font-medium text-ink mb-3">{t('checkout_delivery_title')} *</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <DeliveryOption
                selected={form.delivery_type === 'stopdesk'}
                disabled={form.wilaya && !stopdeskAvailable}
                onClick={() => update('delivery_type', 'stopdesk')}
                label={t('checkout_delivery_stopdesk')}
                price={form.wilaya && stopdeskAvailable ? (freeDelivery ? 0 : pricing?.prices[form.wilaya]?.stopdesk) : null}
                currency={t('currency')}
                freeDelivery={freeDelivery}
                freeLabel={t('checkout_free_delivery')}
                unavailableLabel={t('checkout_delivery_unavailable')}
                wilayaSelected={!!form.wilaya}
              />
              <DeliveryOption
                selected={form.delivery_type === 'home'}
                disabled={form.wilaya && !homeAvailable}
                onClick={() => update('delivery_type', 'home')}
                label={t('checkout_delivery_home')}
                price={form.wilaya && homeAvailable ? (freeDelivery ? 0 : pricing?.prices[form.wilaya]?.home) : null}
                currency={t('currency')}
                freeDelivery={freeDelivery}
                freeLabel={t('checkout_free_delivery')}
                unavailableLabel={t('checkout_delivery_unavailable')}
                wilayaSelected={!!form.wilaya}
              />
            </div>
            {freeHint && !freeDelivery && (
              <p className="text-xs text-burgundy mt-2">✦ {freeHint}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-2">{t('checkout_notes')}</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputCls} rows="2" />
          </div>
          {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-sm">{error}</div>}
          <button
            type="submit"
            disabled={submitting || (form.wilaya && !deliveryAvailable)}
            className="w-full px-8 py-4 bg-burgundy text-cream rounded-full hover:bg-rose-700 uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {submitting ? t('loading') : t('checkout_submit')}
          </button>
          <p className="text-xs text-ink/50 text-center">{t('checkout_payment_note')}</p>
        </form>

        <aside className="bg-sand/40 rounded-2xl p-6 h-fit border border-rose-100">
          <h2 className="font-display text-2xl text-ink mb-4">{t('checkout_summary')}</h2>
          <div className="space-y-3 mb-5 max-h-[300px] overflow-y-auto">
            {items.map((item) => {
              const name = lang === 'ar' ? item.name_ar : item.name_fr;
              return (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="flex-1 truncate pe-2">
                    {name} <span className="text-ink/50">× {item.quantity}</span>
                  </span>
                  <span className="font-medium">
                    {(item.price * item.quantity).toLocaleString()} {t('currency')}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-rose-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/70">{t('checkout_subtotal')}</span>
              <span>{subtotal.toLocaleString()} {t('currency')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/70">{t('checkout_delivery_fee')}</span>
              <span>
                {!form.wilaya
                  ? <span className="text-ink/40">—</span>
                  : !deliveryAvailable
                    ? <span className="text-rose-600 text-xs">{t('checkout_delivery_unavailable')}</span>
                    : freeDelivery
                      ? <span className="text-emerald-700">{t('checkout_free_delivery')}</span>
                      : `${deliveryFee.toLocaleString()} ${t('currency')}`
                }
              </span>
            </div>
          </div>
          <div className="border-t border-rose-200 pt-4 mt-3 flex justify-between items-baseline">
            <span className="text-sm uppercase tracking-wider text-ink/60">{t('cart_total')}</span>
            <span className="font-display text-3xl text-burgundy">
              {total.toLocaleString()} {t('currency')}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DeliveryOption({ selected, disabled, onClick, label, price, currency, freeDelivery, freeLabel, unavailableLabel, wilayaSelected }) {
  const base = 'border-2 rounded-xl p-4 text-start transition-all cursor-pointer';
  const cls = disabled
    ? `${base} border-rose-100 bg-rose-50/40 opacity-60 cursor-not-allowed`
    : selected
      ? `${base} border-burgundy bg-rose-50`
      : `${base} border-rose-200 hover:border-rose-300 bg-white`;
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={cls}>
      <div className="font-medium text-ink">{label}</div>
      <div className="text-sm mt-1">
        {!wilayaSelected ? (
          <span className="text-ink/40">—</span>
        ) : disabled ? (
          <span className="text-rose-600 text-xs">{unavailableLabel}</span>
        ) : freeDelivery ? (
          <span className="text-emerald-700">{freeLabel}</span>
        ) : (
          <span className="text-burgundy font-semibold">+{Number(price).toLocaleString()} {currency}</span>
        )}
      </div>
    </button>
  );
}
