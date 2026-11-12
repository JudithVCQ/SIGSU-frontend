import { createContext, useState, useCallback, useEffect } from 'react';
import { loginApi, getPerfilApi, logoutApi } from '../services/auth.js';

const USE_MOCKS     = import.meta.env.VITE_USE_MOCKS === 'true';
const SESSION_TOKEN = 'sigsu.token';
const SESSION_USER  = 'sigsu.session';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true mientras se valida el token inicial

  // Al montar, si existe un token guardado, lo validamos contra /api/auth/perfil
  useEffect(() => {
    if (USE_MOCKS) {
      // Modo mocks: restaurar directamente de sessionStorage sin llamar a la API
      try {
        const stored = JSON.parse(sessionStorage.getItem(SESSION_USER));
        setUser(stored);
      } catch {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    const token = sessionStorage.getItem(SESSION_TOKEN);
    if (!token) {
      setLoading(false);
      return;
    }

    getPerfilApi()
      .then((u) => setUser(u))
      .catch(() => {
        // Token inválido o expirado: limpiar todo
        sessionStorage.removeItem(SESSION_TOKEN);
        sessionStorage.removeItem(SESSION_USER);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * login():
   * - Modo mocks: recibe el objeto de usuario directamente (como antes).
   * - Modo real:  recibe { correo, contrasena }, llama a la API y persiste el token.
   */
  const login = useCallback(async (payload) => {
    if (USE_MOCKS) {
      // Compatibilidad con el flujo de mocks: payload es el objeto usuario
      sessionStorage.setItem(SESSION_USER, JSON.stringify(payload));
      setUser(payload);
      return payload;
    }

    const { token, usuario } = await loginApi(payload.correo, payload.contrasena);
    sessionStorage.setItem(SESSION_TOKEN, token);
    sessionStorage.setItem(SESSION_USER, JSON.stringify(usuario));
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(async () => {
    if (!USE_MOCKS) {
      await logoutApi(); // llama POST /api/auth/logout; los errores se ignoran internamente
    }
    sessionStorage.removeItem(SESSION_TOKEN);
    sessionStorage.removeItem(SESSION_USER);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
