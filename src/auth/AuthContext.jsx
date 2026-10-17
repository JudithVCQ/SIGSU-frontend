import { createContext, useState, useCallback } from 'react';

const SESSION_KEY = 'sigsu.session';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  });

  // TODO: conectar con el backend cuando exista el endpoint de login
  const login = useCallback((usuario) => {
    // usuario: { id, nombre, correo, rol }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
    setUser(usuario);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
