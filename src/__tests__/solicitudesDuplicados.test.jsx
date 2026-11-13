// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ROLES } from '../config/constants';
import * as authHook from '../hooks/useAuth';
import * as solicitudesService from '../services/solicitudes.js';
import SolicitudesSolicitantePanel from '../components/SolicitudesSolicitantePanel';

describe('Detección de duplicados - Servicio y Componente', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Pruebas del servicio getSolicitudesPorSolicitante
  // =========================================================================
  describe('Servicio getSolicitudesPorSolicitante', () => {
    it('retorna arreglo vacío si solicitanteId es nulo o indefinido', async () => {
      const resNull = await solicitudesService.getSolicitudesPorSolicitante(null);
      const resUndef = await solicitudesService.getSolicitudesPorSolicitante(undefined);
      expect(resNull).toEqual([]);
      expect(resUndef).toEqual([]);
    });

    it('excluye la solicitud actual por ID numérico en modo mocks', async () => {
      // Camila Rojas (101) tiene SIG-00133 (id 133), SIG-00131 (id 131) y SIG-00109 (id 109)
      const res = await solicitudesService.getSolicitudesPorSolicitante(101, 131);
      expect(res.length).toBeGreaterThanOrEqual(1);
      const ids = res.map((s) => s.id);
      expect(ids).not.toContain(131);
      expect(ids).toContain(133);
    });

    it('excluye la solicitud actual por código alfanumérico (SIG-...)', async () => {
      const res = await solicitudesService.getSolicitudesPorSolicitante(101, 'SIG-00131');
      const codigos = res.map((s) => s.codigo);
      expect(codigos).not.toContain('SIG-00131');
      expect(codigos).toContain('SIG-00133');
    });

    it('retorna vacío si el usuario solo tiene una solicitud y se excluye', async () => {
      // Ana Mendoza (104) solo tiene SIG-00124 (id 124)
      const res = await solicitudesService.getSolicitudesPorSolicitante(104, 124);
      expect(res).toEqual([]);
    });

    it('conserva todas las solicitudes del solicitante si excluirSolicitudId es null', async () => {
      const res = await solicitudesService.getSolicitudesPorSolicitante(101, null);
      const codigos = res.map((s) => s.codigo);
      expect(codigos).toContain('SIG-00131');
      expect(codigos).toContain('SIG-00133');
    });
  });

  // =========================================================================
  // 2. Pruebas del componente SolicitudesSolicitantePanel (Visibilidad por rol)
  // =========================================================================
  describe('Componente SolicitudesSolicitantePanel - Permisos y Roles', () => {
    it('se OCULTA completamente (retorna null) para el rol SOLICITANTE', () => {
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        user: { id: 10, nombre: 'Juan Solicitante', rol: ROLES.SOLICITANTE },
      });

      const { container } = render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={101}
            solicitanteNombre="Camila Rojas"
            excluirSolicitudId={131}
          />
        </MemoryRouter>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText(/Otras solicitudes de este solicitante/i)).not.toBeInTheDocument();
    });

    it('se OCULTA completamente (retorna null) para el rol TECNICO', () => {
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        user: { id: 20, nombre: 'Diego Técnico', rol: ROLES.TECNICO },
      });

      const { container } = render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={101}
            solicitanteNombre="Camila Rojas"
            excluirSolicitudId={131}
          />
        </MemoryRouter>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText(/Otras solicitudes de este solicitante/i)).not.toBeInTheDocument();
    });

    it('es VISIBLE para el rol SUPERVISOR', async () => {
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        user: { id: 30, nombre: 'Sara Supervisora', rol: ROLES.SUPERVISOR },
      });

      render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={101}
            solicitanteNombre="Camila Rojas"
            excluirSolicitudId={131}
          />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Otras solicitudes de este solicitante/i)).toBeInTheDocument();
    });

    it('es VISIBLE para el rol ADMINISTRADOR', async () => {
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        user: { id: 1, nombre: 'Admin Master', rol: ROLES.ADMIN },
      });

      render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={101}
            solicitanteNombre="Camila Rojas"
            excluirSolicitudId={131}
          />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Otras solicitudes de este solicitante/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. Pruebas de estados de interfaz: carga, vacío, lista y alerta de duplicados
  // =========================================================================
  describe('Componente SolicitudesSolicitantePanel - Estados de UI', () => {
    beforeEach(() => {
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        user: { id: 30, nombre: 'Supervisor', rol: ROLES.SUPERVISOR },
      });
    });

    it('muestra mensaje cuando no hay otras solicitudes ("Primera solicitud de este usuario")', async () => {
      vi.spyOn(solicitudesService, 'getSolicitudesPorSolicitante').mockResolvedValue([]);

      render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={104}
            solicitanteNombre="Ana Mendoza"
            excluirSolicitudId={124}
          />
        </MemoryRouter>
      );

      expect(await screen.findByText('Primera solicitud de este usuario')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('resalta alerta de abiertas cuando hay solicitudes con estado distinto de CERRADA', async () => {
      vi.spyOn(solicitudesService, 'getSolicitudesPorSolicitante').mockResolvedValue([
        {
          id: 133,
          codigo: 'SIG-00133',
          titulo: 'Proyector no enciende en aula 205',
          estado: 'Registrada',
          estadoApi: 'REGISTRADA',
          fecha: '12 nov 2026',
        },
        {
          id: 109,
          codigo: 'SIG-00109',
          titulo: 'Acceso a wifi',
          estado: 'Cerrada',
          estadoApi: 'CERRADA',
          fecha: '01 nov 2026',
        },
      ]);

      render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={101}
            solicitanteNombre="Camila Rojas"
            excluirSolicitudId={131}
          />
        </MemoryRouter>
      );

      // Debe aparecer la alerta destacando que hay solicitudes abiertas
      const alerta = await screen.findByRole('alert');
      expect(alerta).toBeInTheDocument();
      expect(alerta).toHaveTextContent(/tiene otra solicitud abierta en curso/i);

      // Y debe listar los elementos con su código y título
      expect(screen.getByText('SIG-00133')).toBeInTheDocument();
      expect(screen.getByText('Proyector no enciende en aula 205')).toBeInTheDocument();
      expect(screen.getByText('SIG-00109')).toBeInTheDocument();
    });

    it('NO muestra alerta si todas las demás solicitudes están CERRADAS', async () => {
      vi.spyOn(solicitudesService, 'getSolicitudesPorSolicitante').mockResolvedValue([
        {
          id: 102,
          codigo: 'SIG-00102',
          titulo: 'Puerta de laboratorio',
          estado: 'Cerrada',
          estadoApi: 'CERRADA',
          fecha: '20 oct 2026',
        },
        {
          id: 98,
          codigo: 'SIG-00098',
          titulo: 'Ajuste cerradura',
          estado: 'Cerrada',
          estadoApi: 'CERRADA',
          fecha: '15 oct 2026',
        },
      ]);

      render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={107}
            solicitanteNombre="Carlos Gómez"
            excluirSolicitudId={102}
          />
        </MemoryRouter>
      );

      // Aparecen los registros
      expect(await screen.findByText('SIG-00098')).toBeInTheDocument();
      // Pero NO debe existir alerta de abiertas
      expect(screen.queryByText(/solicitudes abiertas en curso/i)).not.toBeInTheDocument();
    });

    it('muestra estado de error y permite reintentar', async () => {
      const mockFetch = vi
        .spyOn(solicitudesService, 'getSolicitudesPorSolicitante')
        .mockRejectedValueOnce(new Error('Fallo de conexión'))
        .mockResolvedValueOnce([
          {
            id: 133,
            codigo: 'SIG-00133',
            titulo: 'Proyector aula 205',
            estado: 'Registrada',
            estadoApi: 'REGISTRADA',
          },
        ]);

      render(
        <MemoryRouter>
          <SolicitudesSolicitantePanel
            solicitanteId={101}
            solicitanteNombre="Camila Rojas"
            excluirSolicitudId={131}
          />
        </MemoryRouter>
      );

      // Mensaje de error
      expect(await screen.findByText('Fallo de conexión')).toBeInTheDocument();

      // Botón de reintentar
      const btnReintentar = screen.getByRole('button', { name: /reintentar/i });
      expect(btnReintentar).toBeInTheDocument();

      fireEvent.click(btnReintentar);

      // Tras reintentar, se muestra la solicitud
      await waitFor(() => {
        expect(screen.getByText('SIG-00133')).toBeInTheDocument();
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

