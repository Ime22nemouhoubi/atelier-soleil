import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminLogin } from '../api/client.js';

export default function AdminLogin() {
  const { t } = useLang();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      login(res.token, res.username);
      navigate('/admin');
    } catch {
      setError(t('admin_login_error'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300';

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-3xl shadow-soft p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="font-script text-4xl text-burgundy">Atelier Soleil</div>
          <div className="text-xs uppercase tracking-[0.3em] text-ink/50 mt-1">{t('admin_login_title')}</div>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-ink/70 mb-2">{t('admin_username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-ink/70 mb-2">{t('admin_password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-burgundy text-cream rounded-full hover:bg-rose-700 uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {loading ? t('loading') : t('admin_login_btn')}
          </button>
        </div>
      </form>
    </div>
  );
}
