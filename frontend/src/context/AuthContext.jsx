import { createContext, useContext, useEffect, useState } from 'react';
import { setAuthToken } from '../api/client.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('bv_admin_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('bv_admin_username'));

  useEffect(() => {
    setAuthToken(token);
    if (token) localStorage.setItem('bv_admin_token', token);
    else localStorage.removeItem('bv_admin_token');
  }, [token]);

  useEffect(() => {
    if (username) localStorage.setItem('bv_admin_username', username);
    else localStorage.removeItem('bv_admin_username');
  }, [username]);

  const login = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
