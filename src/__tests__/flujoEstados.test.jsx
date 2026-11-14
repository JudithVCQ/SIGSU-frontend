// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Solicitud tal como la devuelve mapSolicitud
const base = {
  id: 7,
  codigo: 'SOL-2026-000007',
  titulo: 'Proyector sin señal',
  descripcion: 'No detecta HDMI',
  ubicacion: 'Aula 205',
  categoriaId: 1, categoria: 'Mantenimiento',
  prioridadId: 1, prioridad: 'Alta',
  areaId: 1, area: 'TI',
  responsableId: null, responsable: 'Sin asignar',
  solicitanteId: 5, solicitante: 'Camila Rojas',
  creadoEn: '2026-11-13T15:00:00Z',
};
const conEstado = (estadoApi, estado, extra = {}) => ({ ...base, estadoApi, estado, ...extra });
const errorBackend = (message, status = 409) => Object.assign(new Error(message), { status, body: { message } });

/** Carga módulos en modo API real y devuelve los servicios para espiarlos. */
async function modoApi(rol = 'SUPERVISOR') {
  vi.stubEnv('VITE_USE_MOCKS', 'false');
  vi.resetModules();
  const solicitudes = await import('../services/solicitudes.js');
  const catalogos   = await import('../services/catalogos.js');
  const usuarios    = await import('../services/usuarios.js');
  const dashboard   = await import('../services/dashboard.js');
  const auth        = await import('../hooks/useAuth');
  vi.spyOn(auth, 'useAuth').mockReturnValue({ user: { id: 2, nombre: 'Ana Supervisora', rol } });
  vi.spyOn(solicitudes, 'getSolicitudesPorSolicitante').mockResolvedValue([]);
  return { solicitudes, catalogos, usuarios, dashboard };
}

function renderEn(ruta, path, Componente) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={path} element={<Componente />} />
        <Route path="*" element={<div>otra ruta</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('ClasificarSolicitud: paso a EN_EVALUACION', () => {
  async function preparar({ trasClasificar, cambiarEstadoImpl }) {
    const s = await modoApi();
    vi.spyOn(s.catalogos, 'getCategorias').mockResolvedValue([{ id: 1, nombre: 'Mantenimiento', activo: true }]);
    vi.spyOn(s.catalogos, 'getPrioridades').mockResolvedValue([{ id: 1, nombre: 'Alta', nivel: 1, activo: true }]);
    vi.spyOn(s.catalogos, 'getAreas').mockResolvedValue([{ id: 1, nombre: 'TI', activo: true }]);
    vi.spyOn(s.solicitudes, 'getSolicitudAny')
      .mockResolvedValueOnce(conEstado('REGISTRADA', 'Registrada'))
      .mockResolvedValueOnce(trasClasificar);
    const clasificar = vi.spyOn(s.solicitudes, 'clasificarSolicitud').mockResolvedValue(trasClasificar);
    const cambiar = vi.spyOn(s.solicitudes, 'cambiarEstado').mockImplementation(cambiarEstadoImpl);
    const { default: ClasificarSolicitud } = await import('../solicitudes/ClasificarSolicitud.jsx');
    renderEn('/supervisor/solicitudes/7/clasificar', '/supervisor/solicitudes/:id/clasificar', ClasificarSolicitud);
    fireEvent.click(await screen.findByRole('button', { name: /Guardar/ }));
    return { clasificar, cambiar };
  }

  it('si tras clasificar sigue en REGISTRADA, la pasa a EN_EVALUACION', async () => {
    const { clasificar, cambiar } = await preparar({
      trasClasificar: conEstado('REGISTRADA', 'Registrada'),
      cambiarEstadoImpl: async () => conEstado('EN_EVALUACION', 'En evaluación'),
    });
    expect(await screen.findByText(/Clasificación actualizada con éxito/)).toBeInTheDocument();
    expect(clasificar).toHaveBeenCalledTimes(1);
    expect(cambiar).toHaveBeenCalledWith(7, 'EN_EVALUACION', { observacion: 'Solicitud clasificada' });
    expect(screen.getByText(/Estado actual:/).parentElement).toHaveTextContent('Estado actual: En evaluación (EN_EVALUACION)');
  });

  it('no llama a PUT /estado si el backend ya la dejó en EN_EVALUACION', async () => {
    const { cambiar } = await preparar({
      trasClasificar: conEstado('EN_EVALUACION', 'En evaluación'),
      cambiarEstadoImpl: async () => { throw new Error('no debería llamarse'); },
    });
    expect(await screen.findByText(/Clasificación actualizada con éxito/)).toBeInTheDocument();
    expect(cambiar).not.toHaveBeenCalled();
  });

  it('si PUT /estado falla, avisa con el mensaje del backend y muestra el estado real', async () => {
    await preparar({
      trasClasificar: conEstado('REGISTRADA', 'Registrada'),
      cambiarEstadoImpl: async () => { throw errorBackend('Transición no permitida para el rol'); },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solicitud clasificada, pero no se pudo actualizar el estado: Transición no permitida para el rol',
    );
    expect(screen.getByText(/Estado actual:/).parentElement).toHaveTextContent('Estado actual: Registrada (REGISTRADA)');
  });
});

describe('AsignarTecnico: estado tras asignar', () => {
  async function preparar({ cambiarEstadoImpl }) {
    const s = await modoApi();
    vi.spyOn(s.solicitudes, 'getSolicitudAny')
      .mockResolvedValueOnce(conEstado('EN_EVALUACION', 'En evaluación'))
      .mockResolvedValue(conEstado('EN_EVALUACION', 'En evaluación', { responsableId: 9, responsable: 'Diego Morales' }));
    vi.spyOn(s.solicitudes, 'asignarTecnico').mockResolvedValue({ id: 1 });
    const cambiar = vi.spyOn(s.solicitudes, 'cambiarEstado').mockImplementation(cambiarEstadoImpl);
    vi.spyOn(s.usuarios, 'getTecnicos').mockResolvedValue([{ id: 9, nombre: 'Diego Morales', correo: 'diego@u.edu' }]);
    vi.spyOn(s.dashboard, 'getDashboard').mockResolvedValue({ porResponsable: [] });
    const { default: AsignarTecnico } = await import('../solicitudes/AsignarTecnico.jsx');
    renderEn('/supervisor/solicitudes/7/asignar', '/supervisor/solicitudes/:id/asignar', AsignarTecnico);

    fireEvent.click(await screen.findByRole('radio'));
    fireEvent.click(screen.getByRole('button', { name: 'Asignar técnico' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar asignación' }));
    return { cambiar };
  }

  it('si PUT /estado falla, no se traga el error y muestra el estado real (no "Asignada")', async () => {
    const { cambiar } = await preparar({
      cambiarEstadoImpl: async () => { throw errorBackend('El técnico no pertenece al área'); },
    });
    const alerta = await screen.findByText(
      'Técnico asignado, pero no se pudo actualizar el estado: El técnico no pertenece al área',
    );
    expect(alerta).toBeInTheDocument();
    expect(cambiar).toHaveBeenCalledWith(7, 'ASIGNADA', expect.any(Object));
    expect(screen.getByText(/Estado actual:/).parentElement).toHaveTextContent('Estado actual: En evaluación');
    expect(screen.getByText(/Estado actual:/).parentElement).not.toHaveTextContent('Estado actual: Asignada');
  });

  it('si PUT /estado funciona, muestra el estado devuelto por el backend', async () => {
    await preparar({ cambiarEstadoImpl: async () => conEstado('ASIGNADA', 'Asignada') });
    expect(await screen.findByText(/Técnico asignado con éxito/)).toBeInTheDocument();
    expect(screen.getByText(/Estado actual:/).parentElement).toHaveTextContent('Estado actual: Asignada');
  });
});
