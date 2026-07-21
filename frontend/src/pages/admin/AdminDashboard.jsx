import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext.jsx';
import { adminFetchStats } from '../../api/client.js';

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-5 ${accent || 'bg-white'} shadow-soft`}>
      <div className="text-xs uppercase tracking-wider text-ink/50">{label}</div>
      <div className="font-display text-3xl text-ink mt-2">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminFetchStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="text-ink/50">{t('loading')}</div>;

  const maxRevenue = Math.max(1, ...stats.dailyRevenue.map((d) => d.revenue));

  return (
    <div className="space-y-8 fade-in">
      <h1 className="font-display text-4xl text-ink">{t('admin_dashboard')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label={t('admin_stats_total_orders')} value={stats.totalOrders} />
        <StatCard label={t('admin_stats_pending')} value={stats.pendingOrders} accent="bg-amber-50" />
        <StatCard label={t('admin_stats_delivered')} value={stats.deliveredOrders} accent="bg-emerald-50" />
        <StatCard
          label={t('admin_stats_revenue')}
          value={`${stats.totalRevenue.toLocaleString()} ${t('currency')}`}
          accent="bg-rose-50"
        />
        <StatCard label={t('admin_stats_products')} value={stats.totalProducts} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-2xl text-ink mb-4">{t('admin_stats_daily')}</h2>
          {stats.dailyRevenue.length === 0 ? (
            <div className="text-ink/50 text-sm py-8 text-center">—</div>
          ) : (
            <div className="space-y-3">
              {stats.dailyRevenue.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <div className="text-xs text-ink/60 w-20 flex-shrink-0">{d.day}</div>
                  <div className="flex-1 bg-sand h-6 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-300 to-burgundy rounded-full flex items-center justify-end pe-2 text-xs text-white"
                      style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                    >
                      {d.revenue > 0 && `${d.revenue.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="text-xs text-ink/60 w-12 text-end">×{d.orders}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-2xl text-ink mb-4">{t('admin_stats_top_products')}</h2>
          {stats.topProducts.length === 0 ? (
            <div className="text-ink/50 text-sm py-8 text-center">—</div>
          ) : (
            <ul className="divide-y divide-rose-100">
              {stats.topProducts.map((p, i) => (
                <li key={p.product_name} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-burgundy text-cream text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-ink">{p.product_name}</span>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-semibold text-ink">{p.qty} ×</div>
                    <div className="text-xs text-ink/50">
                      {Number(p.revenue).toLocaleString()} {t('currency')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
