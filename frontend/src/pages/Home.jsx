import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { fetchCategories, fetchProducts } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const { t, localized } = useLang();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchProducts().then((p) => setFeatured(p.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div className="fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh opacity-80 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-burgundy mb-6">
              ✦ {t('brand_tagline')} ✦
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-ink mb-6">
              {t('hero_title_line1')}
              <br />
              <em className="text-burgundy not-italic font-medium">{t('hero_title_line2')}</em>
            </h1>
            <p className="text-ink/70 text-lg max-w-md mb-8 leading-relaxed">{t('hero_subtitle')}</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 px-8 py-4 bg-burgundy text-cream rounded-full hover:bg-rose-700 transition-all hover:gap-4 group"
            >
              <span className="tracking-wide uppercase text-sm">{t('hero_cta')}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="relative h-[460px] md:h-[600px]">
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-soft ring-1 ring-rose-100">
              <img
                src="/hero.jpg"
                alt="Atelier Soleil — collection prêt-à-porter"
                className="w-full h-full object-cover object-center"
                loading="eager"
                fetchpriority="high"
              />
              {/* Subtle darkening at bottom-left so the floating badge stays readable */}
              <div className="absolute inset-0 bg-gradient-to-tr from-burgundy/40 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="absolute -bottom-6 -left-6 md:-left-12 bg-cream rounded-2xl shadow-soft px-6 py-4 border border-rose-100">
              <div className="text-xs uppercase tracking-wider text-burgundy">Nouvelle collection</div>
              <div className="font-display text-2xl text-ink">Automne · Hiver</div>
            </div>
            {/* Optional decorative flourish top-right */}
            <div className="hidden md:block absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gold/30 blur-2xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[0.4em] text-burgundy mb-3">{t('home_categories_sub')}</div>
            <h2 className="font-display text-4xl md:text-5xl text-ink">{t('home_categories_title')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c, idx) => (
              <Link
                key={c.id}
                to={`/shop?category=${c.slug}`}
                className="group aspect-square rounded-2xl bg-gradient-to-br from-sand to-rose-50 hover:from-rose-100 hover:to-rose-200 transition-all flex items-center justify-center p-4 text-center border border-rose-100"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className="font-display text-lg text-burgundy group-hover:scale-110 transition-transform">
                  {localized(c, 'name')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="bg-sand/40 py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <div className="text-xs uppercase tracking-[0.4em] text-burgundy mb-3">{t('home_featured_sub')}</div>
              <h2 className="font-display text-4xl md:text-5xl text-ink">{t('home_featured_title')}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-24 text-center">
        <div className="text-xs uppercase tracking-[0.4em] text-burgundy mb-6">✦ Atelier Soleil ✦</div>
        <h2 className="font-display text-4xl md:text-5xl text-ink mb-6">{t('home_about_title')}</h2>
        <p className="text-ink/70 text-lg leading-relaxed max-w-2xl mx-auto">{t('home_about_text')}</p>
      </section>
    </div>
  );
}
