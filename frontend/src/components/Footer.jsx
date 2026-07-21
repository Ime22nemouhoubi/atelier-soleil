import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLang();
  const loc = useLocation();
  if (loc.pathname.startsWith('/admin')) return null;
  return (
    <footer className="mt-24 bg-burgundy text-cream">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-script text-4xl mb-3">Atelier Soleil</div>
          <p className="text-cream/70 text-sm leading-relaxed">{t('footer_about')}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-3">{t('footer_navigation')}</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-gold">{t('nav_home')}</Link></li>
            <li><Link to="/shop" className="hover:text-gold">{t('nav_shop')}</Link></li>
            <li><Link to="/cart" className="hover:text-gold">{t('nav_cart')}</Link></li>
            <li><Link to="/admin/login" className="hover:text-gold">{t('nav_admin')}</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-3">{t('footer_contact')}</div>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>contact@ateliersoleil.dz</li>
            <li>+213 555 00 00 00</li>
            <li>Alger, Algérie</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Atelier Soleil. {t('footer_rights')}
      </div>
    </footer>
  );
}
