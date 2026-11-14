// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as authHook from '../hooks/useAuth';
import BandejaSolicitudes from '../solicitudes/BandejaSolicitudes';
import MisAsignaciones from '../solicitudes/MisAsignaciones';
import MisSolicitudes from '../solicitudes/MisSolicitudes';

// Datos: src/mocks/solicitudes.js (modo mocks por defecto en las pruebas)
function renderLista(Componente, path, ruta, user) {
  vi.spyOn(authHook, 'useAuth').mockReturnValue({ user });
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={path} element={<Componente />} />
      </Routes>
    </MemoryRouter>,
  );
}

const aparece = (codigo) => screen.queryAllByText(codigo).length > 0;

describe('Listas filtradas por ?vista=', () => {
  afterEach(() => vi.restoreAllMocks());

  it('Bandeja: "Sin clasificar" muestra solo REGISTRADA y se puede quitar', async () => {
    renderLista(BandejaSolicitudes, '/supervisor/solicitudes', '/supervisor/solicitudes?vista=sin-clasificar',
      { id: 2, nombre: 'Ana', rol: 'SUPERVISOR' });

    expect(await screen.findByRole('button', { name: 'Quitar la vista rápida Sin clasificar' })).toBeInTheDocument(); // chip
    expect(aparece('SIG-00133')).toBe(true);  // Registrada
    expect(aparece('SIG-00131')).toBe(false); // En atención
    expect(aparece('SIG-00118')).toBe(false); // Resuelta

    fireEvent.click(screen.getByRole('button', { name: 'Quitar la vista rápida Sin clasificar' }));
    await waitFor(() => expect(aparece('SIG-00131')).toBe(true));
  });

  it('Bandeja: "Por cerrar" muestra solo RESUELTA', async () => {
    renderLista(BandejaSolicitudes, '/supervisor/solicitudes', '/supervisor/solicitudes?vista=por-cerrar',
      { id: 2, nombre: 'Ana', rol: 'SUPERVISOR' });
    await screen.findByText('Por cerrar');
    expect(aparece('SIG-00118')).toBe(true);
    expect(aparece('SIG-00133')).toBe(false);
  });

  it('Mis asignaciones: "En atención" muestra solo EN_ATENCION', async () => {
    renderLista(MisAsignaciones, '/tecnico', '/tecnico?vista=en-atencion',
      { id: 9, nombre: 'Diego Morales', rol: 'TECNICO' });
    await screen.findByText('Vista rápida:', { exact: false });
    expect(aparece('SIG-00131')).toBe(true);  // En atención (Diego)
    expect(aparece('SIG-00129')).toBe(false); // Asignada (Diego)
  });

  it('Mis solicitudes: "Cerradas" y "Abiertas"', async () => {
    const user = { id: 5, nombre: 'Camila Rojas', rol: 'SOLICITANTE' };
    const { unmount } = renderLista(MisSolicitudes, '/solicitante/solicitudes', '/solicitante/solicitudes?vista=cerradas', user);
    await screen.findByText('Cerradas');
    expect(aparece('SIG-00109')).toBe(true);  // Cerrada
    expect(aparece('SIG-00133')).toBe(false); // Registrada
    unmount();

    renderLista(MisSolicitudes, '/solicitante/solicitudes', '/solicitante/solicitudes?vista=abiertas', user);
    await screen.findByText('Abiertas');
    expect(aparece('SIG-00133')).toBe(true);
    expect(aparece('SIG-00109')).toBe(false);
  });

  it('una vista desconocida se ignora (lista completa, sin chip)', async () => {
    renderLista(BandejaSolicitudes, '/supervisor/solicitudes', '/supervisor/solicitudes?vista=inventada',
      { id: 2, nombre: 'Ana', rol: 'SUPERVISOR' });
    await waitFor(() => expect(aparece('SIG-00131')).toBe(true));
    expect(screen.queryByText('Vista rápida:', { exact: false })).toBeNull();
  });
});
