import { createContext, useState, useCallback, useEffect } from 'react';
import { loginApi, getPerfilApi, logoutApi } from '../services/auth.js';
import { tokenVigente } from './jwt.js';

const USE_MOCKS     = import.meta.env.VITE_USE_MOCKS === 'true';
const SESSION_TOKEN = 'sigsu.token';
const SESSION_USER  = 'sigsu.session';
/** Reintento de /perfil mientras el servidor arranca y no hay usuario guardado */
const REINTENTO_PERFIL_MS = 5000;

export const AuthContext = createContext(null);

function limpiarSesion() {
  sessionStorage.removeItem(SESSION_TOKEN);
  sessionStorage.removeItem(SESSION_USER);
}

function leerUsuarioGuardado() {
  try {
    const u = JSON.parse(sessionStorage.getItem(SESSION_USER));
    return u && typeof u === 'object' ? u : null;
  } catch {
    return null;
  }
}

/**
 * Estado inicial, calculado de forma síncrona para no mostrar pantallas de espera de más:
 *  - mocks: usuario guardado, sin llamadas a la API.
 *  - sin token: sin sesión.
 *  - token vencido o ilegible: se limpia el almacenamiento y no se llama a la API.
 *  - token vigente con usuario guardado: se restaura al instante (se valida después en segundo plano).
 *  - token vigente sin usuario guardado: hay que esperar al servidor (loading = true).
 */
function estadoInicial() {
  if (USE_MOCKS) return { user: leerUsuarioGuardado(), loading: false, validar: false };

  const token = sessionStorage.getItem(SESSION_TOKEN);
  if (!token) return { user: null, loading: false, validar: false };

  if (!tokenVigente(token)) {
    limpiarSesion();
    return { user: null, loading: false, validar: false };
  }

  const guardado = leerUsuarioGuardado();
  return { user: guardado, loading: !guardado, validar: true };
}

export function AuthProvider({ children }) {
  const [inicial] = useState(estadoInicial);
  const [user, setUser]       = useState(inicial.user);
  // true solo si hay un token vigente pero ningún usuario guardado: hay que esperar al servidor
  const [loading, setLoading] = useState(inicial.loading);

  // Validación en segundo plano: GET /api/auth/perfil
  useEffect(() => {
    if (!inicial.validar) return undefined;
    const guardado = inicial.user;

    let activo = true;
    let temporizador = null;

    const validar = () => {
      getPerfilApi()
        .then((perfil) => {
          if (!activo) return;
          sessionStorage.setItem(SESSION_USER, JSON.stringify(perfil));
          setUser(perfil);
          setLoading(false);
        })
        .catch((err) => {
          if (!activo) return;
          if (err?.status === 401) {
            // apiClient ya redirige a /login con el aviso de sesión caducada
            limpiarSesion();
            setUser(null);
            setLoading(false);
            return;
          }
          // Servidor iniciándose o sin conexión: con usuario guardado se sigue trabajando;
          // sin él se mantiene la pantalla de espera y se reintenta.
          if (!guardado) temporizador = setTimeout(validar, REINTENTO_PERFIL_MS);
        });
    };
    validar();

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [inicial]);

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
    limpiarSesion();
    setUser(null);
  }, []);

  /** Descarta la sesión solo en este navegador (sin llamar al servidor). */
  const descartarSesion = useCallback(() => {
    limpiarSesion();
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, descartarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}
