import { Link, useParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { t } = useLang();
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
      </div>
      <h1 className="font-display text-4xl text-ink mb-3">{t('checkout_success_title')}</h1>
      <p className="text-ink/60 mb-2">{t('checkout_success_text')}</p>
      <p className="text-sm text-ink/50 mb-8">
        {t('checkout_order_id')}: <strong>#{id}</strong>
      </p>
      <Link
        to="/"
        className="inline-block px-8 py-4 bg-burgundy text-cream rounded-full hover:bg-rose-700 uppercase tracking-wider text-sm"
      >
        {t('checkout_back_home')}
      </Link>
    </div>
  );
}
