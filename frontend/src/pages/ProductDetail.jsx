import { useEffect, useMemo, useState } from 'react';
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
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null); // color_name string
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setError('');
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Derive unique sizes and colors from the variant list.
  // We preserve variant order so admin's intended ordering shows through.
  const { sizes, colors, variantMap, hasVariants } = useMemo(() => {
    const variants = product?.variants || [];
    if (variants.length === 0) {
      return { sizes: [], colors: [], variantMap: new Map(), hasVariants: false };
    }
    const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL'];
    const sizeSet = new Set(variants.map((v) => v.size));
    const sizes = sizeOrder.filter((s) => sizeSet.has(s));

    // Unique colors keyed by color_name (preserve first-seen order)
    const colorMap = new Map();
    for (const v of variants) {
      if (!colorMap.has(v.color_name)) {
        colorMap.set(v.color_name, { name: v.color_name, hex: v.color_hex });
      }
    }
    const colors = Array.from(colorMap.values());

    // (size, color_name) -> variant lookup
    const variantMap = new Map();
    for (const v of variants) variantMap.set(`${v.size}|${v.color_name}`, v);

    return { sizes, colors, variantMap, hasVariants: true };
  }, [product]);

  // Currently selected variant (only when both selected)
  const currentVariant = selectedSize && selectedColor
    ? variantMap.get(`${selectedSize}|${selectedColor}`)
    : null;

  // Helpers: is a given size/color available given the OTHER selection?
  const sizeIsAvailable = (size) => {
    // Available if any variant with this size has stock, filtered by selected color if any
    for (const v of product?.variants || []) {
      if (v.size !== size) continue;
      if (selectedColor && v.color_name !== selectedColor) continue;
      if (v.stock > 0) return true;
    }
    return false;
  };
  const colorIsAvailable = (colorName) => {
    for (const v of product?.variants || []) {
      if (v.color_name !== colorName) continue;
      if (selectedSize && v.size !== selectedSize) continue;
      if (v.stock > 0) return true;
    }
    return false;
  };

  const maxQty = currentVariant ? currentVariant.stock : 99;

  const handleAdd = () => {
    setError('');
    if (!product) return;
    if (hasVariants && !currentVariant) {
      setError(t('product_pick_variant_first'));
      return;
    }
    if (currentVariant && qty > currentVariant.stock) {
      setQty(currentVariant.stock);
      return;
    }
    addItem(product, qty, currentVariant || null);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="text-center py-20 text-ink/50">{t('loading')}</div>;
  if (!product) return <div className="text-center py-20 text-ink/50">{t('product_not_found')}</div>;

  const name = localized(product, 'name');
  const desc = localized(product, 'description');
  const images = product.images && product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : [];
  const currentImage = images[activeImg] || null;

  // Overall availability shown as pill: does ANY variant have stock (or if no variants, legacy stock > 0)?
  const anyStock = hasVariants
    ? (product.variants || []).some((v) => v.stock > 0)
    : (product.stock > 0);

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
            {anyStock ? (
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
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-[0.3em] text-ink/60 mb-2">{t('product_description')}</h2>
              <p className="text-ink/80 leading-relaxed whitespace-pre-line">{desc}</p>
            </div>
          )}

          {/* Variants section — only shown for products with variants */}
          {hasVariants ? (
            <>
              {/* Sizes */}
              <div className="mb-5">
                <div className="text-xs uppercase tracking-[0.3em] text-ink/60 mb-2">{t('product_size')}</div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const available = sizeIsAvailable(size);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => available && setSelectedSize(size)}
                        disabled={!available}
                        className={
                          isSelected
                            ? 'min-w-[52px] px-4 py-2 rounded-full border-2 border-burgundy bg-burgundy text-cream text-sm font-medium transition-colors'
                            : available
                              ? 'min-w-[52px] px-4 py-2 rounded-full border-2 border-rose-200 hover:border-burgundy text-ink text-sm transition-colors'
                              : 'min-w-[52px] px-4 py-2 rounded-full border-2 border-rose-100 text-ink/30 line-through cursor-not-allowed text-sm'
                        }
                        aria-label={size}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-[0.3em] text-ink/60 mb-2">
                  {t('product_color')}
                  {selectedColor && <span className="text-ink/60 ms-2 normal-case tracking-normal">— {selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const available = colorIsAvailable(c.name);
                    const isSelected = selectedColor === c.name;
                    if (c.hex) {
                      // Swatch button
                      return (
                        <button
                          key={c.name}
                          type="button"
                          title={c.name}
                          onClick={() => available && setSelectedColor(c.name)}
                          disabled={!available}
                          className={
                            isSelected
                              ? 'w-10 h-10 rounded-full border-2 border-burgundy ring-2 ring-burgundy/40 ring-offset-2 transition-all'
                              : available
                                ? 'w-10 h-10 rounded-full border-2 border-rose-200 hover:border-burgundy transition-colors'
                                : 'w-10 h-10 rounded-full border-2 border-rose-100 opacity-30 cursor-not-allowed relative'
                          }
                          style={{ backgroundColor: c.hex }}
                          aria-label={c.name}
                        >
                          {!available && (
                            <span className="absolute inset-0 flex items-center justify-center text-ink/60 text-lg leading-none">×</span>
                          )}
                        </button>
                      );
                    }
                    // No hex — render text pill
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => available && setSelectedColor(c.name)}
                        disabled={!available}
                        className={
                          isSelected
                            ? 'px-4 py-2 rounded-full border-2 border-burgundy bg-burgundy text-cream text-sm transition-colors'
                            : available
                              ? 'px-4 py-2 rounded-full border-2 border-rose-200 hover:border-burgundy text-ink text-sm transition-colors'
                              : 'px-4 py-2 rounded-full border-2 border-rose-100 text-ink/30 line-through cursor-not-allowed text-sm'
                        }
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock hint under the variant selectors */}
              {currentVariant && (
                <div className="mb-5 text-sm">
                  {currentVariant.stock === 0 ? (
                    <span className="text-rose-700">{t('product_variant_out_of_stock')}</span>
                  ) : currentVariant.stock <= 5 ? (
                    <span className="text-amber-700">✦ {t('product_variant_stock_left')(currentVariant.stock)}</span>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            // Legacy product with no variants defined — show a note
            (product.stock > 0 ? null : (
              <div className="mb-5 text-sm text-ink/60 italic">{t('product_no_variants')}</div>
            ))
          )}

          {/* Quantity + Add to cart */}
          {anyStock && (!hasVariants || currentVariant) && (
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex items-center border border-rose-200 rounded-full overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-4 py-3 hover:bg-rose-50"
                  aria-label="decrease"
                >−</button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  className="px-4 py-3 hover:bg-rose-50 disabled:opacity-40"
                  disabled={qty >= maxQty}
                  aria-label="increase"
                >+</button>
              </div>
              <button
                onClick={handleAdd}
                disabled={hasVariants && !currentVariant}
                className={`flex-1 px-8 py-4 rounded-full text-cream uppercase tracking-wider text-sm transition-all ${
                  added ? 'bg-emerald-600' : 'bg-burgundy hover:bg-rose-700 disabled:opacity-50'
                }`}
              >
                {added ? `✓ ${t('product_added')}` : t('product_add_to_cart')}
              </button>
            </div>
          )}

          {hasVariants && !currentVariant && anyStock && (
            <div className="mt-3 text-xs text-ink/60">{t('product_pick_variant_first')}</div>
          )}
          {error && <div className="mt-3 text-sm text-rose-700">{error}</div>}
        </div>
      </div>
    </div>
  );
}
