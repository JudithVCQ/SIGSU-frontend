// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as authHook from '../hooks/useAuth';
import ErrorBoundary from '../components/ErrorBoundary';
import AvisoServidor from '../components/AvisoServidor';
import { NotFoundPage, ForbiddenPage } from '../routes/PaginasError';
import ProtectedRoute from '../routes/ProtectedRoute';

const lento = vi.hoisted(() => ({ cb: null }));
vi.mock('../services/apiClient.js', () => ({
  onSlowRequest: (cb) => { lento.cb = cb; return () => {}; },
}));

afterEach(() => vi.restoreAllMocks());

describe('404 y 403', () => {
  it('404: mensaje y enlace al panel del rol', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({ user: { id: 1, rol: 'TECNICO' } });
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a mi panel' })).toHaveAttribute('href', '/tecnico');
  });

  it('403: una ruta de otro rol muestra "sin acceso" y no redirige', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({ user: { id: 1, rol: 'SOLICITANTE' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <Routes>
          <Route element={<ProtectedRoute roles={['ADMINISTRADOR']} />}>
            <Route path="/admin/usuarios" element={<div>Gestión de usuarios</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'No tienes acceso a esta sección' })).toBeInTheDocument();
    expect(screen.queryByText('Gestión de usuarios')).toBeNull();
    expect(screen.getByRole('link', { name: 'Volver a mi panel' })).toHaveAttribute('href', '/solicitante');
  });

  it('403 por separado', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({ user: { id: 1, rol: 'SUPERVISOR' } });
    render(<MemoryRouter><ForbiddenPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Volver a mi panel' })).toHaveAttribute('href', '/supervisor');
  });
});

describe('ErrorBoundary', () => {
  it('muestra "Algo salió mal" con Recargar e Ir al inicio cuando un hijo falla', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Roto = () => { throw new Error('boom'); };
    render(<ErrorBoundary><Roto /></ErrorBoundary>);
    expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir al inicio' })).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).toBeNull();
  });

  it('sin errores renderiza a los hijos', () => {
    render(<ErrorBoundary><p>Todo bien</p></ErrorBoundary>);
    expect(screen.getByText('Todo bien')).toBeInTheDocument();
  });

  it('Recargar vuelve a cargar la página', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const recargar = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload: recargar } });
    const Roto = () => { throw new Error('x'); };
    render(<ErrorBoundary><Roto /></ErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: 'Recargar' }));
    expect(recargar).toHaveBeenCalled();
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });
});

describe('AvisoServidor', () => {
  it('aparece cuando una petición tarda y desaparece al terminar', () => {
    render(<AvisoServidor />);
    expect(screen.queryByRole('status')).toBeNull();
    act(() => lento.cb(true));
    expect(screen.getByRole('status')).toHaveTextContent('El servidor se está iniciando, puede tardar hasta un minuto');
    act(() => lento.cb(false));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
