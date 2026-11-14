// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { VISTAS_RAPIDAS, buscarVista, rutaDeVista, contarPorVista, estadoApiDe } from '../routes/vistasRapidas';
import { nombreCorto } from '../config/usuario';
import { CLAVE_SIDEBAR } from '../hooks/useSidebarContraido';

const usuarios = {
  SUPERVISOR:    { id: 2, nombre: 'Ana María López García', nombres: 'Ana María', apellidos: 'López García', rol: 'SUPERVISOR' },
  TECNICO:       { id: 9, nombre: 'Diego Morales', rol: 'TECNICO' },
  SOLICITANTE:   { id: 5, nombre: 'Camila Rojas', rol: 'SOLICITANTE' },
  ADMINISTRADOR: { id: 1, nombre: 'Admin Prueba', rol: 'ADMINISTRADOR' },
};

const clasif = { categoria: 'Soporte informático', prioridad: 'Alta' };
const lista = [
  { estadoApi: 'REGISTRADA' },
  { estadoApi: 'REGISTRADA' },
  { estadoApi: 'EN_EVALUACION', ...clasif, responsableId: null, responsable: 'Sin asignar' },
  { estadoApi: 'EN_EVALUACION', ...clasif, responsableId: 4, responsable: 'Laura' },
  { estadoApi: 'ASIGNADA', ...clasif, responsableId: 4 },
  { estadoApi: 'EN_ATENCION', ...clasif, responsableId: 4 },
  { estadoApi: 'RESUELTA', ...clasif, responsableId: 4 },
  { estado: 'Cerrada', ...clasif, responsableId: 4 }, // mocks: solo etiqueta
];

describe('vistasRapidas', () => {
  it('cuenta por vista con los mismos filtros que usan las listas', () => {
    expect(contarPorVista('SUPERVISOR', lista)).toEqual({ 'sin-clasificar': 2, 'por-asignar': 1, 'por-cerrar': 1 });
    expect(contarPorVista('TECNICO', lista)).toEqual({ 'por-iniciar': 1, 'en-atencion': 1, resueltas: 1 });
    expect(contarPorVista('SOLICITANTE', lista)).toEqual({ abiertas: 7, cerradas: 1 });
    expect(contarPorVista('ADMINISTRADOR', lista)).toEqual({});
  });

  it('las vistas del supervisor se definen por datos, no por estado', () => {
    const datos = [
      // sin categoría o sin prioridad, sea cual sea el estado
      { id: 1, estadoApi: 'EN_EVALUACION', categoria: '', prioridad: 'Alta' },
      { id: 2, estadoApi: 'REGISTRADA', categoria: 'Soporte', prioridad: '' },
      { id: 3, estadoApi: 'REGISTRADA', categoriaId: null, prioridadId: null },
      // clasificada, sin responsable: aunque siga REGISTRADA
      { id: 4, estadoApi: 'REGISTRADA', categoriaId: 1, prioridadId: 2, responsableId: null, responsable: 'Sin asignar' },
      { id: 5, estadoApi: 'EN_EVALUACION', categoria: 'Soporte', prioridad: 'Baja', responsable: 'Sin asignar' },
      // clasificada y con responsable: en ninguna de las dos
      { id: 6, estadoApi: 'ASIGNADA', categoriaId: 1, prioridadId: 2, responsableId: 7 },
    ];
    const ids = (vista) => datos.filter(buscarVista('SUPERVISOR', vista).filtro).map((d) => d.id);
    expect(ids('sin-clasificar')).toEqual([1, 2, 3]);
    expect(ids('por-asignar')).toEqual([4, 5]);
    expect(contarPorVista('SUPERVISOR', datos)).toEqual({ 'sin-clasificar': 3, 'por-asignar': 2, 'por-cerrar': 0 });
  });

  it('"Por cerrar" sigue siendo el estado RESUELTA', () => {
    const f = buscarVista('SUPERVISOR', 'por-cerrar').filtro;
    expect(f({ estadoApi: 'RESUELTA' })).toBe(true);
    expect(f({ estadoApi: 'EN_ATENCION' })).toBe(false);
  });

  it('el administrador no tiene vistas rápidas', () => {
    expect(VISTAS_RAPIDAS.ADMINISTRADOR).toBeUndefined();
  });

  it('buscarVista y rutaDeVista', () => {
    expect(buscarVista('SUPERVISOR', 'por-cerrar').label).toBe('Por cerrar');
    expect(buscarVista('SUPERVISOR', 'no-existe')).toBeNull();
    expect(buscarVista('TECNICO', null)).toBeNull();
    expect(rutaDeVista('TECNICO', 'en-atencion')).toBe('/tecnico?vista=en-atencion');
  });

  it('estadoApiDe acepta datos de API y de mocks', () => {
    expect(estadoApiDe({ estadoApi: 'ASIGNADA', estado: 'Asignada' })).toBe('ASIGNADA');
    expect(estadoApiDe({ estado: 'En atención' })).toBe('EN_ATENCION');
  });
});

describe('nombreCorto', () => {
  it('primer nombre + primer apellido', () => {
    expect(nombreCorto(usuarios.SUPERVISOR)).toBe('Ana López');
    expect(nombreCorto({ nombre: 'Diego Morales' })).toBe('Diego Morales');
    expect(nombreCorto(null)).toBe('Usuario');
  });
});

/* ───────── Sidebar (modo API, para controlar la llamada) ───────── */

async function cargarSidebar({ getSolicitudes } = {}) {
  vi.stubEnv('VITE_USE_MOCKS', 'false');
  vi.resetModules();
  const solicitudes = await import('../services/solicitudes.js');
  const spy = vi.spyOn(solicitudes, 'getSolicitudes').mockImplementation(getSolicitudes ?? (async () => lista));
  const { default: Sidebar } = await import('../components/Sidebar.jsx');
  const { NAV_BY_ROLE } = await import('../routes/navConfig.js');
  return { Sidebar, NAV_BY_ROLE, spy };
}

function renderSidebar(Sidebar, NAV_BY_ROLE, rol, { ruta = '/', contraido = false, logout = () => {} } = {}) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Sidebar user={usuarios[rol]} items={NAV_BY_ROLE[rol]} logout={logout} contraido={contraido} onAlternar={() => {}} />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('supervisor: secciones General y Vistas rápidas con contadores de una sola llamada', async () => {
    const { Sidebar, NAV_BY_ROLE, spy } = await cargarSidebar();
    renderSidebar(Sidebar, NAV_BY_ROLE, 'SUPERVISOR');

    expect(screen.getByRole('group', { name: 'General' })).toBeInTheDocument();
    const vistas = screen.getByRole('group', { name: 'Vistas rápidas' });
    const sinClasificar = within(vistas).getByRole('link', { name: /Sin clasificar/ });
    expect(sinClasificar).toHaveAttribute('href', '/supervisor/solicitudes?vista=sin-clasificar');
    await waitFor(() => expect(sinClasificar).toHaveTextContent('Sin clasificar2 solicitudes'));
    expect(within(vistas).getByRole('link', { name: /Por asignar/ })).toHaveTextContent('1');
    expect(within(vistas).getByRole('link', { name: /Por cerrar/ })).toHaveAttribute('href', '/supervisor/solicitudes?vista=por-cerrar');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(); // la misma llamada que hace la bandeja
  });

  it('técnico: usa la misma llamada que Mis asignaciones (responsableId)', async () => {
    const { Sidebar, NAV_BY_ROLE, spy } = await cargarSidebar();
    renderSidebar(Sidebar, NAV_BY_ROLE, 'TECNICO');
    const vistas = screen.getByRole('group', { name: 'Vistas rápidas' });
    expect(within(vistas).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/tecnico?vista=por-iniciar', '/tecnico?vista=en-atencion', '/tecnico?vista=resueltas',
    ]);
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ responsableId: 9 }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('si la llamada falla, oculta los contadores', async () => {
    const { Sidebar, NAV_BY_ROLE, spy } = await cargarSidebar({ getSolicitudes: async () => { throw new Error('caído'); } });
    const { container } = renderSidebar(Sidebar, NAV_BY_ROLE, 'SUPERVISOR');
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(container.querySelector('.nav-count')).toBeNull();
    expect(screen.getByRole('link', { name: 'Sin clasificar' })).toBeInTheDocument();
  });

  it('solicitante: botón principal "Nueva solicitud" arriba, sin repetirlo en General', async () => {
    const { Sidebar, NAV_BY_ROLE } = await cargarSidebar();
    const { container } = renderSidebar(Sidebar, NAV_BY_ROLE, 'SOLICITANTE');
    const cta = container.querySelector('.sidebar-cta');
    expect(cta).toHaveTextContent('Nueva solicitud');
    expect(cta).toHaveAttribute('href', '/solicitante/nueva');
    expect(within(screen.getByRole('group', { name: 'General' })).queryByText('Nueva solicitud')).toBeNull();
    const vistas = screen.getByRole('group', { name: 'Vistas rápidas' });
    expect(within(vistas).getByRole('link', { name: /Abiertas/ })).toHaveAttribute('href', '/solicitante/solicitudes?vista=abiertas');
    expect(within(vistas).getByRole('link', { name: /Cerradas/ })).toHaveAttribute('href', '/solicitante/solicitudes?vista=cerradas');
  });

  it('administrador: sin vistas rápidas y sin llamadas', async () => {
    const { Sidebar, NAV_BY_ROLE, spy } = await cargarSidebar();
    renderSidebar(Sidebar, NAV_BY_ROLE, 'ADMINISTRADOR');
    expect(screen.queryByRole('group', { name: 'Vistas rápidas' })).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('marca como activa la vista rápida y no la opción general de la misma ruta', async () => {
    const { Sidebar, NAV_BY_ROLE } = await cargarSidebar();
    renderSidebar(Sidebar, NAV_BY_ROLE, 'SUPERVISOR', { ruta: '/supervisor/solicitudes?vista=por-cerrar' });
    expect(screen.getByRole('link', { name: /Por cerrar/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Solicitudes' })).not.toHaveAttribute('aria-current');
  });

  it('pie: sin notificaciones, nombre corto con el nombre completo como título, rol y cerrar sesión', async () => {
    const { Sidebar, NAV_BY_ROLE } = await cargarSidebar();
    const logout = vi.fn();
    renderSidebar(Sidebar, NAV_BY_ROLE, 'SUPERVISOR', { logout });
    expect(screen.queryByRole('button', { name: 'Notificaciones' })).toBeNull();
    const nombre = screen.getByText('Ana López');
    expect(nombre).toHaveAttribute('title', 'Ana María López García');
    expect(screen.getByText('Supervisor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(logout).toHaveBeenCalled();
  });

  it('contraído: tooltips con el nombre (y el contador) en cada opción', async () => {
    const { Sidebar, NAV_BY_ROLE } = await cargarSidebar();
    renderSidebar(Sidebar, NAV_BY_ROLE, 'SUPERVISOR', { contraido: true });
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('data-tooltip', 'Dashboard');
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Sin clasificar/ })).toHaveAttribute('data-tooltip', 'Sin clasificar (2)'),
    );
    expect(screen.getByRole('button', { name: 'Expandir menú lateral' })).toHaveAttribute('aria-expanded', 'false');
  });
});

/* ───────── Contraer/expandir desde AppLayout (modo mocks) ───────── */

describe('AppLayout: sidebar contraíble', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  async function renderLayout() {
    const auth = await import('../hooks/useAuth');
    vi.spyOn(auth, 'useAuth').mockReturnValue({ user: usuarios.SUPERVISOR, logout: () => {} });
    const { default: AppLayout } = await import('../components/AppLayout.jsx');
    return render(
      <MemoryRouter initialEntries={['/supervisor']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/supervisor" element={<div>contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it('alterna con un botón de solo ícono, con aria-label y aria-expanded, y lo recuerda', async () => {
    const { container, unmount } = await renderLayout();
    const boton = screen.getByRole('button', { name: 'Contraer menú lateral' });
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(boton.textContent).toBe('');

    fireEvent.click(boton);
    expect(container.querySelector('.app-shell')).toHaveClass('sidebar-contraido');
    expect(screen.getByRole('button', { name: 'Expandir menú lateral' })).toHaveAttribute('aria-expanded', 'false');
    expect(localStorage.getItem(CLAVE_SIDEBAR)).toBe('1');

    unmount();
    const segundo = await renderLayout();
    expect(segundo.container.querySelector('.app-shell')).toHaveClass('sidebar-contraido');
  });

  it('funciona aunque localStorage no esté disponible', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
    const { container } = await renderLayout();
    expect(container.querySelector('.app-shell')).not.toHaveClass('sidebar-contraido');
    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú lateral' }));
    expect(container.querySelector('.app-shell')).toHaveClass('sidebar-contraido');
  });
});
