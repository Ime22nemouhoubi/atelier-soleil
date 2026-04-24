import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';
import { adminFetchProducts, adminDeleteProduct } from '../../api/client.js';

export default function AdminProducts() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const reload = () => adminFetchProducts().then(setProducts);
  useEffect(() => { reload(); }, []);

  const handleDelete = async (p) => {
    if (!confirm(t('products_confirm_delete'))) return;
    await adminDeleteProduct(p.id);
    reload();
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-4xl text-ink">{t('admin_products')}</h1>
        <Link
          to="/admin/products/new"
          className="px-5 py-2.5 bg-burgundy text-cream rounded-full hover:bg-rose-700 text-sm uppercase tracking-wider"
        >
          + {t('products_add')}
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand/50 text-ink/60 uppercase text-xs">
              <tr>
                <th className="text-start p-4">Image</th>
                <th className="text-start p-4">{t('products_name_fr')}</th>
                <th className="text-start p-4">{t('products_category')}</th>
                <th className="text-start p-4">{t('products_price')}</th>
                <th className="text-start p-4">{t('products_stock')}</th>
                <th className="text-start p-4">{t('products_active')}</th>
                <th className="text-end p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-cream/50">
                  <td className="p-3">
                    <div className="w-12 h-12 rounded-lg bg-sand overflow-hidden relative">
                      {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                      {p.images && p.images.length > 1 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-burgundy text-cream text-[10px] font-semibold flex items-center justify-center">
                          {p.images.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-ink">{p.name_fr}</td>
                  <td className="p-4 text-ink/60">{p.category_name_fr || '—'}</td>
                  <td className="p-4 text-burgundy font-semibold">
                    {Number(p.price).toLocaleString()} {t('currency')}
                  </td>
                  <td className="p-4">{p.stock}</td>
                  <td className="p-4">
                    {p.is_active ? <span className="text-emerald-700">●</span> : <span className="text-ink/30">○</span>}
                  </td>
                  <td className="p-4 text-end whitespace-nowrap">
                    <Link to={`/admin/products/${p.id}/edit`} className="text-burgundy hover:underline mr-3">
                      {t('products_edit')}
                    </Link>
                    <button onClick={() => handleDelete(p)} className="text-rose-600 hover:underline">
                      {t('products_delete')}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-ink/40">—</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
