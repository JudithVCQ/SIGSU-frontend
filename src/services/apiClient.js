/**
 * Cliente HTTP centralizado para la API SIGSU.
 * - Lee la URL base exclusivamente de import.meta.env.VITE_API_URL.
 * - Adjunta cabecera Authorization: Bearer <token> si existe sesión.
 * - Timeout de 60 s con aviso visual a los 3 s.
 * - Errores normalizados: mensaje legible, sin detalles técnicos internos.
 * - 401 → limpia sesión y redirige a /login.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const SESSION_TOKEN_KEY = 'sigsu.token';
const SESSION_USER_KEY  = 'sigsu.session';

/** Tiempo en ms tras el cual se muestra el aviso "conectando…" */
const SLOW_THRESHOLD_MS = 3_000;
/** Tiempo máximo de espera antes de cancelar la petición */
const TIMEOUT_MS = 60_000;

/** Suscriptores para el aviso de lentitud ("Conectando con el servidor…") */
let onSlowListeners = new Set();
export function onSlowRequest(cb) { onSlowListeners.add(cb); return () => onSlowListeners.delete(cb); }
function notifySlow(pending) { onSlowListeners.forEach(cb => cb(pending)); }

/** Mapea códigos HTTP a mensajes legibles */
function humanMessage(status, body, hadToken = true) {
  const serverMsg = typeof body?.message === 'string' ? body.message : null;
  switch (status) {
    case 400: return serverMsg ?? 'Datos inválidos. Revisa los campos e inténtalo de nuevo.';
    // "Sesión caducada" solo tiene sentido si había una sesión (token) guardada
    case 401: return hadToken
      ? 'Tu sesión ha caducado. Inicia sesión nuevamente.'
      : (serverMsg ?? 'No pudimos validar tus credenciales. Inténtalo de nuevo.');
    case 403: return 'No tienes permisos para realizar esta acción.';
    case 404: return 'El recurso solicitado no existe.';
    case 409: return serverMsg ?? 'El registro ya existe o hay un conflicto en los datos.';
    case 422: return serverMsg ?? 'Error de validación en los datos enviados.';
    case 500:
    case 502:
    case 503:
    case 504: return 'El servidor tuvo un problema. Intenta más tarde.';
    default:  return serverMsg ?? `Error inesperado (${status}). Intenta más tarde.`;
  }
}

/** Formatea cualquier error hacia un mensaje amigable según su tipo */
export function getErrorMessage(err, fallback = 'Ocurrió un error inesperado.') {
  if (!err) return fallback;
  if (!err.status || err.status === 0 || err.name === 'AbortError' || err.isTimeout || err.isNetwork) {
    return 'No pudimos conectar con el servidor. Puede estar iniciando, intenta de nuevo en unos segundos.';
  }
  if (err.status >= 500) {
    return 'El servidor tuvo un problema. Intenta más tarde.';
  }
  return err.message || fallback;
}

/** Redirige a /login sin mensaje (no había sesión que caducar). Evita recargar si ya está allí. */
function redirectToLogin() {
  if (window.location.pathname === '/login') return;
  window.location.replace('/login');
}

/** Limpia la sesión y redirige a /login */
function clearSessionAndRedirect(message) {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  // Redirigir fuera del ciclo de React usando location, ya que este módulo no es un componente
  const url = `/login?expired=1&msg=${encodeURIComponent(message ?? 'Tu sesión caducó.')}`;
  window.location.replace(url);
}

/**
 * Petición principal. Uso interno; los servicios llaman a apiGet/apiPost/etc.
 * @param {string} path  - ruta relativa (ej. "/api/auth/login")
 * @param {RequestInit} options - opciones de fetch
 * @returns {Promise<any>} - cuerpo JSON deserializado
 */
export async function request(path, options = {}) {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Reemplazamos Content-Type para multipart; fetch lo fija automáticamente con el boundary
  if (options._multipart) {
    delete headers['Content-Type'];
    delete options._multipart;
  }

  const controller = new AbortController();
  const timeoutId   = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let   slowTimerId = null;
  let   slowPending = false;

  slowTimerId = setTimeout(() => {
    slowPending = true;
    notifySlow(true);
  }, SLOW_THRESHOLD_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(slowTimerId);
    if (slowPending) notifySlow(false);

    // Si la respuesta fue 401 en cualquier ruta que no sea login/logout, limpiar y redirigir
    if (response.status === 401 && !path.includes('/api/auth/login')) {
      if (token) {
        clearSessionAndRedirect('Tu sesión ha caducado. Inicia sesión nuevamente.');
        throw Object.assign(new Error('Tu sesión ha caducado.'), { status: 401 });
      }
      // Sin token guardado nunca hubo sesión: no se habla de "sesión caducada"
      redirectToLogin();
      throw Object.assign(new Error('Inicia sesión para continuar.'), { status: 401, sinSesion: true });
    }

    // Respuestas sin cuerpo (ej. 204)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      if (!response.ok) {
        const err = new Error(humanMessage(response.status, null, Boolean(token)));
        err.status = response.status;
        throw err;
      }
      return null;
    }

    let body;
    const ct = response.headers.get('content-type') ?? '';
    try {
      body = ct.includes('application/json') ? await response.json() : await response.text();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const err = new Error(humanMessage(response.status, body, Boolean(token)));
      err.status = response.status;
      err.body   = body;
      throw err;
    }

    return body;
  } catch (err) {
    clearTimeout(timeoutId);
    clearTimeout(slowTimerId);
    if (slowPending) notifySlow(false);

    if (err.name === 'AbortError') {
      const timeoutErr = new Error('No pudimos conectar con el servidor. Puede estar iniciando, intenta de nuevo en unos segundos.');
      timeoutErr.status = 0;
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    // Error de red (sin conexión, CORS, etc.)
    if (!err.status) {
      const netErr = new Error('No pudimos conectar con el servidor. Puede estar iniciando, intenta de nuevo en unos segundos.');
      netErr.status = 0;
      netErr.isNetwork = true;
      throw netErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Helpers semánticos */
export const apiGet    = (path, opts)   => request(path, { ...opts, method: 'GET' });
export const apiPost   = (path, body, opts) => request(path, { ...opts, method: 'POST',  body: JSON.stringify(body) });
export const apiPut    = (path, body, opts) => request(path, { ...opts, method: 'PUT',   body: JSON.stringify(body) });
export const apiDelete = (path, opts)   => request(path, { ...opts, method: 'DELETE' });

/** Subida de un archivo como multipart/form-data */
export function apiUpload(path, file, extraFormFields = {}) {
  const form = new FormData();
  form.append('arquivo', file); // campo "arquivo" – pendiente confirmar con backend (ver diagnóstico §9.3)
  Object.entries(extraFormFields).forEach(([k, v]) => form.append(k, v));
  return request(path, { method: 'POST', body: form, _multipart: true });
}

