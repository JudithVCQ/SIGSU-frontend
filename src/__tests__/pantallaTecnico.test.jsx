// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';

const Marca = ({ texto }) => {
  const { id } = useParams();
  return <div>{`${texto} ${id}`}</div>;
};

const tecnico = { id: 9, nombre: 'Diego Morales', rol: 'TECNICO' };
const solicitud = (estadoApi, estado, extra = {}) => ({
  id: 7,
  codigo: 'SOL-2026-000007',
  titulo: 'Proyector sin señal',
  descripcion: 'No detecta HDMI',
  ubicacion: 'Aula 205',
  categoria: 'Mantenimiento',
  prioridad: 'Alta',
  responsableId: 9,
  responsable: 'Diego Morales',
  estadoApi,
  estado,
  ...extra,
});

async function modoApi(user = tecnico) {
  vi.stubEnv('VITE_USE_MOCKS', 'false');
  vi.resetModules();
  const solicitudes = await import('../services/solicitudes.js');
  const auth = await import('../hooks/useAuth');
  vi.spyOn(auth, 'useAuth').mockReturnValue({ user });
  vi.spyOn(solicitudes, 'getSeguimientos').mockResolvedValue([]);
  vi.spyOn(solicitudes, 'getEvidencias').mockResolvedValue([]);
  vi.spyOn(solicitudes, 'getHistorial').mockResolvedValue([]);
  return solicitudes;
}

function rutas(inicial, rutasExtra) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <Routes>{rutasExtra}</Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('MisAsignaciones', () => {
  it('el código/título de la fila lleva a la pantalla de atención (no al detalle)', async () => {
    const solicitudes = await modoApi();
    vi.spyOn(solicitudes, 'getSolicitudes').mockResolvedValue([solicitud('ASIGNADA', 'Asignada')]);
    const { default: MisAsignaciones } = await import('../solicitudes/MisAsignaciones.jsx');
    rutas('/tecnico', [
      <Route key="a" path="/tecnico" element={<MisAsignaciones />} />,
      <Route key="b" path="/tecnico/atencion/:id" element={<Marca texto="atención" />} />,
      <Route key="c" path="/solicitudes/:id" element={<Marca texto="detalle" />} />,
    ]);

    const enlaces = await screen.findAllByRole('button', { name: /SOL-2026-000007/ });
    fireEvent.click(enlaces[0]);
    expect(await screen.findByText('atención SOL-2026-000007')).toBeInTheDocument();
  });
});

describe('DetalleSolicitud para técnicos', () => {
  async function abrirDetalle(datos) {
    const solicitudes = await modoApi();
    vi.spyOn(solicitudes, 'getSolicitudByCodigo').mockResolvedValue(datos);
    const { default: DetalleSolicitud } = await import('../solicitudes/DetalleSolicitud.jsx');
    rutas('/solicitudes/SOL-2026-000007', [
      <Route key="a" path="/solicitudes/:id" element={<DetalleSolicitud />} />,
      <Route key="b" path="/tecnico/atencion/:id" element={<Marca texto="atención" />} />,
    ]);
  }

  it('redirige al técnico responsable a su pantalla de atención', async () => {
    await abrirDetalle(solicitud('EN_ATENCION', 'En atención'));
    expect(await screen.findByText('atención SOL-2026-000007')).toBeInTheDocument();
  });

  it('no redirige si la solicitud está asignada a otro técnico', async () => {
    await abrirDetalle(solicitud('EN_ATENCION', 'En atención', { responsableId: 3, responsable: 'Laura Díaz' }));
    expect(await screen.findByRole('heading', { name: 'Proyector sin señal' })).toBeInTheDocument();
    expect(screen.queryByText(/^atención /)).not.toBeInTheDocument();
  });
});

describe('AtencionSolicitud: notas de avance', () => {
  async function abrirAtencion(estadoApi, estado) {
    const solicitudes = await modoApi();
    vi.spyOn(solicitudes, 'getSolicitudByCodigo').mockResolvedValue(solicitud(estadoApi, estado));
    const agregar = vi.spyOn(solicitudes, 'addSeguimiento').mockResolvedValue({
      id: 1, texto: 'Revisé el cableado', nombre: 'Diego Morales', tiempo: 'Ahora',
    });
    const { default: AtencionSolicitud } = await import('../solicitudes/AtencionSolicitud.jsx');
    rutas('/tecnico/atencion/SOL-2026-000007', [
      <Route key="a" path="/tecnico/atencion/:id" element={<AtencionSolicitud />} />,
    ]);
    await screen.findByRole('heading', { name: /Proyector sin señal/ });
    return { agregar };
  }

  it('permite registrar notas en ASIGNADA', async () => {
    const { agregar } = await abrirAtencion('ASIGNADA', 'Asignada');
    fireEvent.change(screen.getByLabelText('Registrar nota de avance'), { target: { value: 'Revisé el cableado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar nota de avance' }));
    await waitFor(() => expect(agregar).toHaveBeenCalledWith(7, 'Revisé el cableado'));
  });

  it('permite registrar notas en EN_ATENCION', async () => {
    await abrirAtencion('EN_ATENCION', 'En atención');
    expect(screen.getByLabelText('Registrar nota de avance')).toBeInTheDocument();
  });

  it('avisa cuando el estado aún no permite iniciar la atención ni agregar notas', async () => {
    await abrirAtencion('EN_EVALUACION', 'En evaluación');
    expect(screen.getByText('Esta solicitud aún no figura como asignada. Pide al supervisor que revise su estado. Puedes dejar notas mientras tanto.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Iniciar atención' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Registrar nota de avance')).toBeInTheDocument();
  });

  it('no muestra el aviso de "no asignada" en ASIGNADA', async () => {
    await abrirAtencion('ASIGNADA', 'Asignada');
    expect(screen.queryByText(/aún no figura como asignada/)).not.toBeInTheDocument();
  });

  it.each([
    ['REGISTRADA', 'Registrada'],
    ['EN_EVALUACION', 'En evaluación'],
    ['ASIGNADA', 'Asignada'],
    ['EN_ATENCION', 'En atención'],
    ['RESUELTA', 'Resuelta'],
  ])('permite agregar notas en %s', async (api, ui) => {
    await abrirAtencion(api, ui);
    expect(screen.getByLabelText('Registrar nota de avance')).toBeInTheDocument();
  });

  it('bloquea las notas en CERRADA', async () => {
    await abrirAtencion('CERRADA', 'Cerrada');
    expect(screen.queryByLabelText('Registrar nota de avance')).not.toBeInTheDocument();
  });

  it('"Iniciar atención" solo aparece en ASIGNADA', async () => {
    await abrirAtencion('RESUELTA', 'Resuelta');
    expect(screen.queryByRole('button', { name: 'Iniciar atención' })).not.toBeInTheDocument();
  });
});
