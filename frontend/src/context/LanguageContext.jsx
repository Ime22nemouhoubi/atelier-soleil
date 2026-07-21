import { createContext, useContext, useEffect, useState } from 'react';
import translations from '../locales/translations.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('bv_lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('bv_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key) => translations[lang]?.[key] ?? translations.fr[key] ?? key;
  const toggleLang = () => setLang((prev) => (prev === 'fr' ? 'ar' : 'fr'));

  // Helper: pick the right field by language (e.g. name_fr vs name_ar)
  const localized = (obj, base) => {
    if (!obj) return '';
    return obj[`${base}_${lang}`] || obj[`${base}_fr`] || '';
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, localized }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
