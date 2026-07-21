import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { t, toggleLang, lang } = useLang();
  const { count } = useCart();
  const loc = useLocation();
  const onAdmin = loc.pathname.startsWith('/admin');
  if (onAdmin) return null; // admin pages have their own chrome

  const linkCls = ({ isActive }) =>
    `px-3 py-2 text-sm tracking-wide uppercase transition-colors ${
      isActive ? 'text-burgundy' : 'text-ink/70 hover:text-burgundy'
    }`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-cream/85 border-b border-rose-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-script text-4xl text-burgundy leading-none tracking-wide">Atelier Soleil</span>
          <span className="hidden md:block text-[10px] text-ink/50 tracking-[0.3em] uppercase border-l border-rose-200 pl-2 ml-1">
            Everyday fashion
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={linkCls} end>{t('nav_home')}</NavLink>
          <NavLink to="/shop" className={linkCls}>{t('nav_shop')}</NavLink>
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleLang}
            className="text-sm px-3 py-1.5 rounded-full border border-rose-200 hover:bg-rose-50 transition-colors"
            aria-label="Toggle language"
          >
            {t('language')}
          </button>
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-burgundy text-cream hover:bg-rose-700 transition-colors"
            aria-label={t('nav_cart')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {count > 0 && (
              <span className={`absolute -top-1 ${lang === 'ar' ? '-left-1' : '-right-1'} w-5 h-5 rounded-full bg-gold text-ink text-[11px] font-semibold flex items-center justify-center`}>
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      {/* Mobile sub-nav */}
      <nav className="md:hidden flex justify-center gap-2 pb-3 border-t border-rose-50 pt-2">
        <NavLink to="/" className={linkCls} end>{t('nav_home')}</NavLink>
        <NavLink to="/shop" className={linkCls}>{t('nav_shop')}</NavLink>
      </nav>
    </header>
  );
}
