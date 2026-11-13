/** src/services/auth.js — Operaciones de autenticación */
import { apiGet, apiPost } from './apiClient.js';
import { mapUsuario } from './mappers.js';

/** POST /api/auth/login — devuelve { token, tipo, expiraEn, usuario } mapeado */
export async function loginApi(correo, contrasena) {
  const data = await apiPost('/api/auth/login', { correo, contrasena });
  return {
    token:    data.token,
    tipo:     data.tipo,
    expiraEn: data.expiraEn,
    usuario:  mapUsuario(data.usuario),
  };
}

/** GET /api/auth/perfil — devuelve el usuario autenticado (mapeado) */
export async function getPerfilApi() {
  const data = await apiGet('/api/auth/perfil');
  return mapUsuario(data);
}

/** POST /api/auth/logout — cierra sesión en el servidor */
export async function logoutApi() {
  try {
    await apiPost('/api/auth/logout', {});
  } catch {
    // Si el logout falla (ej. token ya expirado) lo ignoramos:
    // la limpieza local siempre se ejecuta en AuthContext.
  }
}

