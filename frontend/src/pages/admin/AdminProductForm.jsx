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

const MAX_IMAGES = 5;

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
        // product_images table doesn't send IDs through public fetchProduct.
        // We pull gallery URLs from p.images and IDs come via a second call.
        // For simplicity, use the admin-list detail: hit the same endpoint on products (it contains image_url).
        // Here, we display URLs from p.images; deletion requires an image id, so we re-fetch admin list items for this product.
        setExistingImages((p.images || []).map((url, i) => ({ id: null, image_url: url, position: i })));
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

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      newFiles.forEach((f) => fd.append('images', f));
      if (isEdit && replaceMode) fd.append('replace_images', '1');
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
