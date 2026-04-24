/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Atelier Soleil palette — warm gold, bone, dove gray, champagne.
        // Color NAMES kept from the original (rose/burgundy/gold/cream) so that
        // every component that already uses them picks up the new palette
        // automatically without source-level changes.
        cream: '#faf8f5',        // bone white — main background
        sand: '#e8e4de',         // dove gray — subtle surface (from hero coat)
        rose: {                  // remapped to warm gold/champagne scale
          50:  '#fbf7f0',
          100: '#f6ecd8',
          200: '#ecdab0',
          300: '#dec585',
          400: '#d0ac5c',
          500: '#c49960',        // brand gold (from logo script)
          600: '#a8804a',
          700: '#87663a',
          800: '#6a4f2d',
          900: '#4f3b23',
        },
        burgundy: '#c49960',     // was dark red → now warm gold (primary)
        gold: '#d4c4a8',         // now champagne (subtle accent)
        ink: '#1a1613',          // warm deep near-black (logo lettering)
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Outfit"', 'system-ui', 'sans-serif'],
        arabic: ['"Tajawal"', 'Cairo', 'sans-serif'],
        script: ['"Allura"', '"Great Vibes"', 'cursive'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(135, 102, 58, 0.2)',
      },
    },
  },
  plugins: [],
};
