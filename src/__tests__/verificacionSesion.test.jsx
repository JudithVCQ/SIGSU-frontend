// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { decodificarPayload, expiracionMs, tokenVigente } from '../auth/jwt';

// ── Utilidades ──────────────────────────────────────────────────────────────
const base64url = (obj) =>
  Buffer.from(JSON.stringify(obj), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const crearToken = (payload) => `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.firma`;
const enSegundos = (delta) => Math.floor(Date.now() / 1000) + delta;

describe('jwt.js', () => {
  it('decodifica el payload base64url (incluye tildes y caracteres - _)', () => {
    const token = crearToken({ sub: 'camila@u.edu', nombre: 'Ñandú Ángel', exp: 123, x: '??>>' });
    expect(decodificarPayload(token)).toMatchObject({ sub: 'camila@u.edu', nombre: 'Ñandú Ángel', exp: 123 });
  });

  it('lee exp en milisegundos', () => {
    expect(expiracionMs(crearToken({ exp: 2000 }))).toBe(2_000_000);
    expect(expiracionMs(crearToken({ sub: 'x' }))).toBeNull();
  });

  it('un token ilegible no es vigente', () => {
    for (const malo of [null, undefined, '', 'abc', 'a.b', 'a.b.c', 'x.%%%.z', 123]) {
      expect(decodificarPayload(malo)).toBeNull();
      expect(tokenVigente(malo)).toBe(false);
    }
  });

  it('distingue vigente y vencido', () => {
    expect(tokenVigente(crearToken({ exp: enSegundos(3600) }))).toBe(true);
    expect(tokenVigente(crearToken({ exp: enSegundos(-1) }))).toBe(false);
    expect(tokenVigente(crearToken({ sub: 'sin exp' }))).toBe(false);
    expect(tokenVigente(crearToken({ exp: 100 }), 99_000)).toBe(true);
    expect(tokenVigente(crearToken({ exp: 100 }), 100_000)).toBe(false);
  });
});

// ── AuthProvider + ProtectedRoute en modo API ───────────────────────────────
describe('Verificación de sesión (AuthProvider y ProtectedRoute)', () => {
  const usuario = { id: 7, nombre: 'Ana López', rol: 'SUPERVISOR' };
  let perfilMock;

  beforeEach(() => {
    sessionStorage.clear();
    perfilMock = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
    sessionStorage.clear();
  });

  async function montar({ token, guardado } = {}) {
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    vi.resetModules();
    vi.doMock('../services/auth.js', () => ({
      loginApi: vi.fn(),
      logoutApi: vi.fn(),
      getPerfilApi: perfilMock,
    }));
    if (token) sessionStorage.setItem('sigsu.token', token);
    if (guardado) sessionStorage.setItem('sigsu.session', JSON.stringify(guardado));

    const { AuthProvider } = await import('../auth/AuthContext.jsx');
    const { default: ProtectedRoute } = await import('../routes/ProtectedRoute.jsx');
    const Ubicacion = () => <div data-testid="ruta">{useLocation().pathname}</div>;

    render(
      <MemoryRouter initialEntries={['/panel']}>
        <AuthProvider>
          <Ubicacion />
          <Routes>
            <Route path="/login" element={<div>Pantalla de login</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/panel" element={<div>Panel privado</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it('token vencido: limpia sessionStorage y va a /login sin llamar a la API', async () => {
    await montar({ token: crearToken({ exp: enSegundos(-60) }), guardado: usuario });
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
    expect(perfilMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('sigsu.token')).toBeNull();
    expect(sessionStorage.getItem('sigsu.session')).toBeNull();
  });

  it('token ilegible: limpia y va a /login sin llamar a la API', async () => {
    await montar({ token: 'esto-no-es-un-jwt', guardado: usuario });
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
    expect(perfilMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('sigsu.token')).toBeNull();
  });

  it('sin token: va a /login sin llamar a la API', async () => {
    await montar();
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
    expect(perfilMock).not.toHaveBeenCalled();
  });

  it('token vigente con usuario guardado: restaura al instante y valida /perfil en segundo plano', async () => {
    let resolver;
    perfilMock.mockReturnValue(new Promise((r) => { resolver = r; }));
    await montar({ token: crearToken({ exp: enSegundos(3600) }), guardado: usuario });

    // Se ve el panel sin esperar la respuesta del servidor
    expect(screen.getByText('Panel privado')).toBeInTheDocument();
    expect(perfilMock).toHaveBeenCalledTimes(1);

    await act(async () => { resolver({ ...usuario, nombre: 'Ana María López' }); });
    expect(screen.getByText('Panel privado')).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem('sigsu.session')).nombre).toBe('Ana María López');
  });

  it('token vigente, usuario guardado y /perfil responde 401: cierra la sesión', async () => {
    perfilMock.mockRejectedValue(Object.assign(new Error('Tu sesión ha caducado.'), { status: 401 }));
    await montar({ token: crearToken({ exp: enSegundos(3600) }), guardado: usuario });

    await waitFor(() => expect(screen.getByText('Pantalla de login')).toBeInTheDocument());
    expect(sessionStorage.getItem('sigsu.token')).toBeNull();
    expect(sessionStorage.getItem('sigsu.session')).toBeNull();
  });

  it('token vigente, usuario guardado y el servidor no responde: no se cierra la sesión', async () => {
    perfilMock.mockRejectedValue(Object.assign(new Error('red'), { status: 0, isNetwork: true }));
    await montar({ token: crearToken({ exp: enSegundos(3600) }), guardado: usuario });

    await waitFor(() => expect(perfilMock).toHaveBeenCalled());
    expect(screen.getByText('Panel privado')).toBeInTheDocument();
    expect(sessionStorage.getItem('sigsu.token')).not.toBeNull();
  });

  it('token vigente sin usuario guardado: muestra "servidor iniciándose" con botón para ir al login', async () => {
    perfilMock.mockReturnValue(new Promise(() => {})); // el servidor aún no responde
    await montar({ token: crearToken({ exp: enSegundos(3600) }) });

    expect(screen.getByRole('heading', { name: 'Esto está tardando más de lo habitual…' })).toBeInTheDocument();
    expect(screen.queryByText('Panel privado')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Ir al inicio de sesión' }));
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
    expect(sessionStorage.getItem('sigsu.token')).toBeNull();
  });

  it('token vigente sin usuario guardado: al responder el servidor entra al panel', async () => {
    perfilMock.mockResolvedValue(usuario);
    await montar({ token: crearToken({ exp: enSegundos(3600) }) });
    expect(await screen.findByText('Panel privado')).toBeInTheDocument();
  });
});
