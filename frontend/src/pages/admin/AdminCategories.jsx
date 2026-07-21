import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext.jsx';
import {
  fetchCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../../api/client.js';

const blank = { name_fr: '', name_ar: '', slug: '' };

export default function AdminCategories() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = () => fetchCategories().then(setItems);
  useEffect(() => { reload(); }, []);

  const slugify = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (c) => { setForm({ name_fr: c.name_fr, name_ar: c.name_ar, slug: c.slug }); setEditing(c); };
  const close = () => { setEditing(null); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || slugify(form.name_fr) };
      if (editing === 'new') await adminCreateCategory(payload);
      else await adminUpdateCategory(editing.id, payload);
      await reload();
      close();
    } catch (err) {
      setError(err?.response?.data?.error || t('error_generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(t('categories_confirm_delete'))) return;
    await adminDeleteCategory(c.id);
    reload();
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300';

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-4xl text-ink">{t('admin_categories')}</h1>
        <button onClick={openNew} className="px-5 py-2.5 bg-burgundy text-cream rounded-full hover:bg-rose-700 text-sm uppercase tracking-wider">
          + {t('categories_add')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand/50 text-ink/60 uppercase text-xs">
            <tr>
              <th className="text-start p-4">{t('products_name_fr')}</th>
              <th className="text-start p-4">{t('products_name_ar')}</th>
              <th className="text-start p-4">{t('categories_slug')}</th>
              <th className="text-end p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-cream/50">
                <td className="p-4 font-medium">{c.name_fr}</td>
                <td className="p-4" dir="rtl">{c.name_ar}</td>
                <td className="p-4 text-ink/60 font-mono text-xs">{c.slug}</td>
                <td className="p-4 text-end whitespace-nowrap">
                  <button onClick={() => openEdit(c)} className="text-burgundy hover:underline mr-3">
                    {t('products_edit')}
                  </button>
                  <button onClick={() => handleDelete(c)} className="text-rose-600 hover:underline">
                    {t('products_delete')}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan="4" className="p-8 text-center text-ink/40">—</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto" onClick={close}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-4 my-4 md:my-0 max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <h2 className="font-display text-2xl text-ink">
              {editing === 'new' ? t('categories_add') : t('products_edit')}
            </h2>
            <div>
              <label className="block text-xs text-ink/60 mb-1">{t('products_name_fr')} *</label>
              <input required className={inputCls} value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-ink/60 mb-1">{t('products_name_ar')} *</label>
              <input required dir="rtl" className={inputCls} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-ink/60 mb-1">{t('categories_slug')}</label>
              <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" />
            </div>
            {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-sm">{error}</div>}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={close} className="px-5 py-2.5 rounded-full border border-rose-200 text-sm">
                {t('products_cancel')}
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-burgundy text-cream rounded-full text-sm uppercase tracking-wider disabled:opacity-50">
                {saving ? '...' : t('products_save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
