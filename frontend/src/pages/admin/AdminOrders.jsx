import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext.jsx';
import {
  adminFetchOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from '../../api/client.js';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');

  const reload = () => adminFetchOrders().then(setOrders);
  useEffect(() => { reload(); }, []);

  const setStatus = async (id, status) => {
    await adminUpdateOrderStatus(id, status);
    reload();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await adminDeleteOrder(id);
    setSelected(null);
    reload();
  };

  const visible = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-4xl text-ink">{t('admin_orders')}</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-rose-200 bg-white text-sm"
        >
          <option value="">— All —</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t(`orders_status_${s}`)}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-12 text-center text-ink/50">{t('orders_no_orders')}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand/50 text-ink/60 uppercase text-xs">
                <tr>
                  <th className="text-start p-4">#</th>
                  <th className="text-start p-4">{t('orders_date')}</th>
                  <th className="text-start p-4">{t('orders_customer')}</th>
                  <th className="text-start p-4">{t('orders_phone')}</th>
                  <th className="text-start p-4">Wilaya</th>
                  <th className="text-start p-4">{t('orders_total')}</th>
                  <th className="text-start p-4">{t('orders_status')}</th>
                  <th className="text-end p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                {visible.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/50">
                    <td className="p-4 font-mono text-xs">#{o.id}</td>
                    <td className="p-4 text-ink/60">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="p-4 font-medium">{o.customer_name}</td>
                    <td className="p-4 text-ink/60">{o.customer_phone}</td>
                    <td className="p-4 text-ink/60">{o.wilaya}</td>
                    <td className="p-4 font-semibold text-burgundy">
                      {Number(o.total).toLocaleString()} {t('currency')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[o.status]}`}>
                        {t(`orders_status_${o.status}`)}
                      </span>
                    </td>
                    <td className="p-4 text-end">
                      <button onClick={() => setSelected(o)} className="text-burgundy hover:underline">
                        {t('orders_view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 my-4 md:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-ink/50">Commande</div>
                <h2 className="font-display text-3xl text-ink">#{selected.id}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-ink/50 hover:text-ink text-2xl leading-none">×</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
              <Field label={t('orders_customer')} value={selected.customer_name} />
              <Field label={t('orders_phone')} value={selected.customer_phone} />
              <Field label="Wilaya" value={selected.wilaya} />
              <Field label={t('orders_date')} value={new Date(selected.created_at).toLocaleString()} />
              <div className="sm:col-span-2">
                <Field label={t('orders_address')} value={selected.address} />
              </div>
              {selected.notes && (
                <div className="sm:col-span-2">
                  <Field label="Notes" value={selected.notes} />
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="text-xs uppercase tracking-wider text-ink/50 mb-2">{t('orders_items')}</div>
              <ul className="divide-y divide-rose-100 border border-rose-100 rounded-xl">
                {selected.items.map((it) => (
                  <li key={it.id} className="p-3 flex justify-between text-sm">
                    <span>{it.product_name} <span className="text-ink/50">× {it.quantity}</span></span>
                    <span className="font-medium">
                      {(it.unit_price * it.quantity).toLocaleString()} {t('currency')}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 text-sm">
                {selected.subtotal > 0 && (
                  <div className="flex justify-between text-ink/70">
                    <span>{t('checkout_subtotal')}</span>
                    <span>{Number(selected.subtotal).toLocaleString()} {t('currency')}</span>
                  </div>
                )}
                {selected.delivery_fee !== undefined && selected.delivery_fee !== null && (
                  <div className="flex justify-between text-ink/70">
                    <span>
                      {t('checkout_delivery_fee')}
                      {selected.delivery_type && (
                        <span className="text-xs text-ink/50 ms-2">
                          ({selected.delivery_type === 'home' ? t('checkout_delivery_home') : t('checkout_delivery_stopdesk')})
                        </span>
                      )}
                    </span>
                    <span>
                      {Number(selected.delivery_fee) === 0 && selected.subtotal > 0
                        ? t('checkout_free_delivery')
                        : `${Number(selected.delivery_fee).toLocaleString()} ${t('currency')}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-rose-100">
                  <span className="text-xs uppercase tracking-wider text-ink/60">{t('orders_total')}</span>
                  <span className="font-display text-2xl text-burgundy">
                    {Number(selected.total).toLocaleString()} {t('currency')}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-rose-100 pt-5 flex flex-wrap gap-3 items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-ink/50 mb-2">{t('orders_change_status')}</div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-full text-xs ${
                        selected.status === s
                          ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-burgundy'
                          : 'bg-white border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      {t(`orders_status_${s}`)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleDelete(selected.id)}
                className="text-rose-600 hover:underline text-sm"
              >
                {t('products_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-ink/50">{label}</div>
      <div className="text-ink">{value}</div>
    </div>
  );
}
