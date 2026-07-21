import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';
import {
  fetchCategories,
  fetchProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProductImage,
} from '../../api/client.js';
import { SIZES } from '../../locales/sizes.js';

const MAX_IMAGES = 5;
const HEX_RE = /^#([0-9a-fA-F]{3}){1,2}$/;

const blank = {
  name_fr: '',
  name_ar: '',
  description_fr: '',
  description_ar: '',
  price: '',
  stock: '',
  category_id: '',
  is_active: 1,
};

export default function AdminProductForm({ mode }) {
  const { t, localized } = useLang();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === 'edit';

  const [form, setForm] = useState(blank);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // [{id, image_url}]
  const [newFiles, setNewFiles] = useState([]); // File[]
  const [newPreviews, setNewPreviews] = useState([]); // object URLs
  const [replaceMode, setReplaceMode] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Variants editor state
  // selectedSizes: array of SIZES chosen for this product
  // colors: [{ name, hex }] — hex may be '' for no swatch
  // stockGrid: { "SIZE|colorName": stockNumber }
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [stockGrid, setStockGrid] = useState({});

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchProduct(id)
      .then((p) => {
        setForm({
          name_fr: p.name_fr || '',
          name_ar: p.name_ar || '',
          description_fr: p.description_fr || '',
          description_ar: p.description_ar || '',
          price: p.price ?? '',
          stock: p.stock ?? '',
          category_id: p.category_id || '',
          is_active: p.is_active,
        });
        setExistingImages((p.images || []).map((url, i) => ({ id: null, image_url: url, position: i })));

        // Group variants back into sizes+colors+stockGrid
        const vs = p.variants || [];
        if (vs.length > 0) {
          const sizesSet = new Set();
          const colorMap = new Map(); // name -> hex
          const grid = {};
          for (const v of vs) {
            sizesSet.add(v.size);
            if (!colorMap.has(v.color_name)) colorMap.set(v.color_name, v.color_hex || '');
            grid[`${v.size}|${v.color_name}`] = v.stock;
          }
          setSelectedSizes(SIZES.filter((s) => sizesSet.has(s))); // keep canonical order
          setColors(Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex })));
          setStockGrid(grid);
        }
      })
      .catch(() => setError(t('error_generic')))
      .finally(() => setLoading(false));
  }, [id, isEdit, t]);

  // Handle new file selection with previews
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES);
    setNewFiles(files);
    newPreviews.forEach(URL.revokeObjectURL);
    setNewPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeNewFile = (idx) => {
    const updated = newFiles.filter((_, i) => i !== idx);
    URL.revokeObjectURL(newPreviews[idx]);
    const updatedPrev = newPreviews.filter((_, i) => i !== idx);
    setNewFiles(updated);
    setNewPreviews(updatedPrev);
  };

  // -------- Variants editor helpers --------
  const toggleSize = (size) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) return prev.filter((s) => s !== size);
      // Keep canonical order
      return SIZES.filter((s) => s === size || prev.includes(s));
    });
  };

  const addColor = () => {
    setColors((prev) => [...prev, { name: '', hex: '' }]);
  };

  const updateColor = (idx, field, value) => {
    setColors((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeColor = (idx) => {
    const removedName = colors[idx]?.name;
    setColors((prev) => prev.filter((_, i) => i !== idx));
    if (removedName) {
      // Drop all grid cells for this color
      setStockGrid((prev) => {
        const next = {};
        for (const [k, v] of Object.entries(prev)) {
          if (!k.endsWith(`|${removedName}`)) next[k] = v;
        }
        return next;
      });
    }
  };

  const setStock = (size, colorName, value) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setStockGrid((prev) => ({ ...prev, [`${size}|${colorName}`]: n }));
  };

  // Build the variants array from state, validating on the fly.
  const buildVariants = () => {
    // Filter blank colors
    const validColors = colors
      .map((c) => ({ name: (c.name || '').trim(), hex: (c.hex || '').trim() }))
      .filter((c) => c.name);
    if (selectedSizes.length === 0 || validColors.length === 0) {
      throw new Error(t('products_variants_required'));
    }
    // Detect duplicate color names (case-insensitive)
    const seen = new Set();
    for (const c of validColors) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) throw new Error(`Couleur en double : "${c.name}"`);
      seen.add(key);
      if (c.hex && !HEX_RE.test(c.hex)) throw new Error(`Code hex invalide pour "${c.name}" (ex. #B8365B)`);
    }
    const out = [];
    for (const size of selectedSizes) {
      for (const c of validColors) {
        const stock = Number(stockGrid[`${size}|${c.name}`] ?? 0);
        out.push({
          size,
          color_name: c.name,
          color_hex: c.hex || null,
          stock: Math.max(0, stock),
        });
      }
    }
    return out;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let variants;
      try { variants = buildVariants(); }
      catch (err) { setError(err.message); setSaving(false); return; }

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      newFiles.forEach((f) => fd.append('images', f));
      if (isEdit && replaceMode) fd.append('replace_images', '1');
      fd.append('variants', JSON.stringify(variants));
      if (isEdit) {
        await adminUpdateProduct(id, fd);
      } else {
        await adminCreateProduct(fd);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err?.response?.data?.error || t('error_generic'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-ink/50">{t('loading')}</div>;

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300';
  const totalImagesAfter = (replaceMode ? 0 : existingImages.length) + newFiles.length;
  const slotsRemaining = Math.max(0, MAX_IMAGES - (replaceMode ? 0 : existingImages.length));

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <Link to="/admin/products" className="text-sm text-burgundy hover:underline">{t('products_back_to_list')}</Link>
      <h1 className="font-display text-4xl text-ink mt-2 mb-8">
        {isEdit ? t('products_edit_page_title') : t('products_new_page_title')}
      </h1>

      <form onSubmit={submit} className="bg-white rounded-3xl shadow-soft p-6 md:p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_name_fr')} *</label>
            <input required className={inputCls} value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_name_ar')} *</label>
            <input required dir="rtl" className={inputCls} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_desc_fr')}</label>
            <textarea className={inputCls} rows="4" value={form.description_fr} onChange={(e) => setForm({ ...form, description_fr: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_desc_ar')}</label>
            <textarea dir="rtl" className={inputCls} rows="4" value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_price')} *</label>
            <input required type="number" step="0.01" min="0" className={inputCls}
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_stock')}</label>
            <input type="number" min="0" className={inputCls}
              value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_category')}</label>
            <select className={inputCls} value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">{t('products_no_category')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{localized(c, 'name')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">{t('products_active')}</label>
            <select className={inputCls} value={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}>
              <option value={1}>✓</option>
              <option value={0}>✗</option>
            </select>
          </div>
        </div>

        {/* IMAGES */}
        <div className="border-t border-rose-100 pt-6">
          <label className="block text-sm font-medium text-ink mb-3">{t('products_images')}</label>

          {/* Existing images (edit mode) */}
          {isEdit && existingImages.length > 0 && !replaceMode && (
            <div className="mb-4">
              <div className="text-xs text-ink/60 mb-2">Images actuelles ({existingImages.length}/{MAX_IMAGES})</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {existingImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-sand">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-1 left-1 text-[10px] bg-burgundy text-cream px-2 py-0.5 rounded-full">Principale</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode toggle for edit */}
          {isEdit && existingImages.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-ink/70 mb-3 cursor-pointer">
              <input type="checkbox" checked={replaceMode} onChange={(e) => setReplaceMode(e.target.checked)} />
              {t('products_replace_images')}
            </label>
          )}

          {/* New file picker */}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="block w-full text-sm text-ink/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-rose-50 file:text-burgundy hover:file:bg-rose-100"
          />
          <p className="text-xs text-ink/50 mt-2">{t('products_drop_hint')}</p>
          {isEdit && !replaceMode && slotsRemaining < MAX_IMAGES && (
            <p className="text-xs text-amber-700 mt-1">{slotsRemaining} emplacements restants</p>
          )}

          {/* New image previews */}
          {newPreviews.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-ink/60 mb-2">Nouveaux fichiers ({newPreviews.length})</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {newPreviews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-sand group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-ink/70 text-cream rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalImagesAfter > MAX_IMAGES && (
            <p className="text-xs text-rose-700 mt-2">⚠ Total après enregistrement dépasse {MAX_IMAGES}. Seuls les {MAX_IMAGES} premiers seront conservés.</p>
          )}
        </div>

        {/* VARIANTS — sizes × colors × stock */}
        <div className="border-t border-rose-100 pt-6">
          <label className="block text-sm font-medium text-ink mb-1">{t('products_variants')} *</label>
          <p className="text-xs text-ink/60 mb-4">{t('products_variants_intro')}</p>

          {/* Sizes */}
          <div className="mb-5">
            <div className="text-xs uppercase tracking-wider text-ink/60 mb-2">{t('products_variants_sizes')}</div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => {
                const isChecked = selectedSizes.includes(size);
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={
                      isChecked
                        ? 'min-w-[52px] px-4 py-2 rounded-full border-2 border-burgundy bg-burgundy text-cream text-sm font-medium'
                        : 'min-w-[52px] px-4 py-2 rounded-full border-2 border-rose-200 hover:border-burgundy text-ink text-sm'
                    }
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors */}
          <div className="mb-5">
            <div className="text-xs uppercase tracking-wider text-ink/60 mb-2 flex items-center justify-between">
              <span>{t('products_variants_colors')}</span>
              <button
                type="button"
                onClick={addColor}
                className="text-xs text-burgundy hover:underline normal-case tracking-normal"
              >+ {t('products_variants_add_color')}</button>
            </div>
            {colors.length === 0 && (
              <div className="text-sm text-ink/40 italic py-3">{t('products_variants_empty')}</div>
            )}
            <div className="space-y-2">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-rose-50/40 border border-rose-100 rounded-xl p-2">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateColor(i, 'name', e.target.value)}
                    placeholder={t('products_variants_color_name_placeholder')}
                    className="flex-1 px-3 py-2 rounded-lg border border-rose-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={HEX_RE.test(c.hex) ? c.hex : '#c49960'}
                      onChange={(e) => updateColor(i, 'hex', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-rose-200 cursor-pointer p-0.5 bg-white"
                      title={t('products_variants_color_hex_optional')}
                    />
                    <input
                      type="text"
                      value={c.hex}
                      onChange={(e) => updateColor(i, 'hex', e.target.value)}
                      placeholder="#RRGGBB"
                      maxLength={7}
                      className="w-24 px-2 py-2 rounded-lg border border-rose-200 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                    {c.hex && (
                      <button
                        type="button"
                        onClick={() => updateColor(i, 'hex', '')}
                        className="text-xs text-ink/50 hover:text-rose-600 px-1"
                        title="Effacer le hex"
                      >×</button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeColor(i)}
                    className="text-xs text-rose-600 hover:underline whitespace-nowrap"
                  >{t('products_variants_remove_color')}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Stock grid */}
          {selectedSizes.length > 0 && colors.some((c) => c.name.trim()) && (
            <div className="mb-2">
              <div className="text-xs uppercase tracking-wider text-ink/60 mb-2">{t('products_variants_stock_grid')}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-rose-100 rounded-xl overflow-hidden">
                  <thead className="bg-rose-50/60">
                    <tr>
                      <th className="text-start p-2 text-xs uppercase tracking-wider text-ink/60">{t('products_variants_sizes')}</th>
                      {colors.filter((c) => c.name.trim()).map((c) => (
                        <th key={c.name} className="p-2 text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            {c.hex && HEX_RE.test(c.hex) && (
                              <span
                                className="inline-block w-3.5 h-3.5 rounded-full border border-rose-200"
                                style={{ backgroundColor: c.hex }}
                              />
                            )}
                            <span className="normal-case">{c.name}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {selectedSizes.map((size) => (
                      <tr key={size}>
                        <td className="p-2 font-medium">{size}</td>
                        {colors.filter((c) => c.name.trim()).map((c) => (
                          <td key={c.name} className="p-1.5">
                            <input
                              type="number"
                              min="0"
                              value={stockGrid[`${size}|${c.name}`] ?? 0}
                              onChange={(e) => setStock(size, c.name, e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border border-rose-200 text-center text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-sm">{error}</div>}

        <div className="flex gap-3 justify-end border-t border-rose-100 pt-6">
          <Link to="/admin/products" className="px-5 py-2.5 rounded-full border border-rose-200 text-sm flex items-center">
            {t('products_cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-burgundy text-cream rounded-full text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {saving ? '...' : t('products_save')}
          </button>
        </div>
      </form>
    </div>
  );
}
