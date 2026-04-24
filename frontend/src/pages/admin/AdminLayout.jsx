import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminLayout() {
  const { t, toggleLang } = useLang();
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const linkCls = ({ isActive }) =>
    `block px-4 py-3 rounded-xl text-sm transition-colors ${
      isActive ? 'bg-burgundy text-cream' : 'text-ink/70 hover:bg-rose-50'
    }`;

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      <aside className="md:w-64 bg-white border-e border-rose-100 md:min-h-screen flex md:flex-col">
        <div className="p-6 border-b border-rose-100 hidden md:block">
          <div className="font-script text-3xl text-burgundy">Atelier Soleil</div>
          <div className="text-xs uppercase tracking-wider text-ink/50">Admin</div>
          {username && <div className="text-xs text-ink/40 mt-1">@{username}</div>}
        </div>
        <nav className="p-3 flex md:flex-col gap-1 flex-1 overflow-x-auto md:overflow-visible">
          <NavLink to="/admin" end className={linkCls}>📊 {t('admin_dashboard')}</NavLink>
          <NavLink to="/admin/products" className={linkCls}>🛍️ {t('admin_products')}</NavLink>
          <NavLink to="/admin/categories" className={linkCls}>🏷️ {t('admin_categories')}</NavLink>
          <NavLink to="/admin/orders" className={linkCls}>📦 {t('admin_orders')}</NavLink>
        </nav>
        <div className="p-3 border-t border-rose-100 hidden md:block space-y-2">
          <button
            onClick={toggleLang}
            className="w-full px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-sm"
          >
            🌐 {t('language')}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm"
          >
            ↪ {t('admin_logout')}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <Outlet />
        <div className="md:hidden mt-8 flex gap-2">
          <button onClick={toggleLang} className="flex-1 px-4 py-2 rounded-xl border border-rose-200 text-sm">
            {t('language')}
          </button>
          <button onClick={handleLogout} className="flex-1 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 text-sm">
            {t('admin_logout')}
          </button>
        </div>
      </main>
    </div>
  );
}
