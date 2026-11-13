import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, getErrorMessage } from '../services/apiClient.js';

describe('services/apiClient.js', () => {
  let originalFetch;
  let sessionStorageMock;
  let storageState;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    storageState = {
      'sigsu.token': 'jwt-token-valido',
      'sigsu.session': JSON.stringify({ id: 1, nombre: 'Admin' }),
    };

    sessionStorageMock = {
      getItem: vi.fn((k) => storageState[k] ?? null),
      setItem: vi.fn((k, v) => { storageState[k] = String(v); }),
      removeItem: vi.fn((k) => { delete storageState[k]; }),
      clear: vi.fn(() => { storageState = {}; }),
    };

    globalThis.sessionStorage = sessionStorageMock;
    globalThis.window = {
      location: {
        replace: vi.fn(),
      },
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getErrorMessage (función pura de mensajes amigables)', () => {
    it('formatea errores de timeout y red (status 0, isTimeout, isNetwork o AbortError)', () => {
      const msgEsperado = 'No pudimos conectar con el servidor. Puede estar iniciando, intenta de nuevo en unos segundos.';

      expect(getErrorMessage({ status: 0 })).toBe(msgEsperado);
      expect(getErrorMessage({ name: 'AbortError' })).toBe(msgEsperado);
      expect(getErrorMessage({ isTimeout: true })).toBe(msgEsperado);
      expect(getErrorMessage({ isNetwork: true })).toBe(msgEsperado);
    });

    it('formatea errores de servidor 5xx (status >= 500)', () => {
      const msgEsperado = 'El servidor tuvo un problema. Intenta más tarde.';

      expect(getErrorMessage({ status: 500 })).toBe(msgEsperado);
      expect(getErrorMessage({ status: 502 })).toBe(msgEsperado);
      expect(getErrorMessage({ status: 503 })).toBe(msgEsperado);
      expect(getErrorMessage({ status: 504 })).toBe(msgEsperado);
    });

    it('retorna el mensaje propio del error en 4xx (ej. 401, 400, 403, 409)', () => {
      expect(getErrorMessage({ status: 401, message: 'Credenciales inválidas' })).toBe('Credenciales inválidas');
      expect(getErrorMessage({ status: 400, message: 'Datos incorrectos' })).toBe('Datos incorrectos');
    });

    it('retorna fallback cuando no hay error o no tiene mensaje', () => {
      expect(getErrorMessage(null)).toBe('Ocurrió un error inesperado.');
      expect(getErrorMessage(undefined, 'Fallback custom')).toBe('Fallback custom');
    });
  });

  describe('request con fetch simulado', () => {
    it('maneja error 401 en rutas protegidas: limpia sesión, redirige y lanza error 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Token expired' }),
      });

      await expect(request('/api/solicitudes')).rejects.toMatchObject({
        status: 401,
        message: 'Tu sesión ha caducado.',
      });

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('sigsu.token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('sigsu.session');
      expect(globalThis.window.location.replace).toHaveBeenCalledWith(
        expect.stringContaining('/login?expired=1')
      );
    });

    it('maneja error 401 en login: lanza mensaje sin redirigir al propio login', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Correo o contraseña incorrectos' }),
      });

      await expect(request('/api/auth/login')).rejects.toMatchObject({
        status: 401,
        message: 'Tu sesión ha caducado. Inicia sesión nuevamente.',
      });

      // No debe llamar a redirección en login
      expect(globalThis.window.location.replace).not.toHaveBeenCalled();
    });

    it('maneja timeout (AbortError): lanza error con status 0, isTimeout e indicación amigable', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(request('/api/catalogos')).rejects.toMatchObject({
        status: 0,
        isTimeout: true,
        message: 'No pudimos conectar con el servidor. Puede estar iniciando, intenta de nuevo en unos segundos.',
      });
    });

    it('maneja error de red (sin conexión): lanza error con status 0, isNetwork e indicación amigable', async () => {
      const netError = new TypeError('Failed to fetch');

      globalThis.fetch = vi.fn().mockRejectedValue(netError);

      await expect(request('/api/solicitudes')).rejects.toMatchObject({
        status: 0,
        isNetwork: true,
        message: 'No pudimos conectar con el servidor. Puede estar iniciando, intenta de nuevo en unos segundos.',
      });
    });

    it('maneja errores 5xx (500, 502, 503, 504): lanza mensaje "El servidor tuvo un problema"', async () => {
      const codigos5xx = [500, 502, 503, 504];

      for (const status of codigos5xx) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          status,
          ok: false,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: 'Internal Error' }),
        });

        await expect(request('/api/metricas')).rejects.toMatchObject({
          status,
          message: 'El servidor tuvo un problema. Intenta más tarde.',
        });
      }
    });

    it('retorna los datos deserializados ante una respuesta 200 exitosa', async () => {
      const dataMock = [{ id: 1, nombre: 'Soporte' }];
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => dataMock,
      });

      const res = await request('/api/areas');
      expect(res).toEqual(dataMock);
    });
  });
});

