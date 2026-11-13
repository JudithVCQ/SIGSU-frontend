import { describe, it, expect } from 'vitest';
import {
  ESTADO_API_TO_UI,
  ESTADO_UI_TO_API,
  mapSolicitud,
  mapUsuario,
  parseNivel,
} from '../services/mappers.js';

describe('mappers.js', () => {
  describe('Mapeo de los 6 estados del backend', () => {
    const estadosBackend = [
      { api: 'REGISTRADA',    ui: 'Registrada' },
      { api: 'EN_EVALUACION', ui: 'En evaluación' },
      { api: 'ASIGNADA',      ui: 'Asignada' },
      { api: 'EN_ATENCION',   ui: 'En atención' },
      { api: 'RESUELTA',      ui: 'Resuelta' },
      { api: 'CERRADA',       ui: 'Cerrada' },
    ];

    it('traduce exactamente los 6 estados de API a UI', () => {
      estadosBackend.forEach(({ api, ui }) => {
        expect(ESTADO_API_TO_UI[api]).toBe(ui);
      });
      expect(Object.keys(ESTADO_API_TO_UI)).toHaveLength(6);
    });

    it('traduce inversamente los 6 estados de UI a API', () => {
      estadosBackend.forEach(({ api, ui }) => {
        expect(ESTADO_UI_TO_API[ui]).toBe(api);
      });
      expect(Object.keys(ESTADO_UI_TO_API)).toHaveLength(6);
    });

    it('mapSolicitud asigna estado (UI) y estadoApi (Backend) para cada uno de los 6 estados', () => {
      estadosBackend.forEach(({ api, ui }) => {
        const raw = { id: 1, codigo: 'SOL-001', estado: api, titulo: 'Prueba' };
        const mapped = mapSolicitud(raw);
        expect(mapped.estado).toBe(ui);
        expect(mapped.estadoApi).toBe(api);
      });
    });

    it('mapSolicitud conserva estado original si el backend envía un valor desconocido', () => {
      const raw = { id: 2, codigo: 'SOL-002', estado: 'DESCONOCIDO' };
      const mapped = mapSolicitud(raw);
      expect(mapped.estado).toBe('DESCONOCIDO');
      expect(mapped.estadoApi).toBe('DESCONOCIDO');
    });

    it('mapSolicitud retorna null si la entrada es nula o indefinida', () => {
      expect(mapSolicitud(null)).toBeNull();
      expect(mapSolicitud(undefined)).toBeNull();
    });

    it('mapSolicitud conserva fechaLimite cuando el backend la devuelve', () => {
      const raw = { id: 3, codigo: 'SOL-003', estado: 'ASIGNADA', fechaLimite: '2026-11-16T04:59:59.000Z' };
      expect(mapSolicitud(raw).fechaLimite).toBe('2026-11-16T04:59:59.000Z');
    });

    it('mapSolicitud deja fechaLimite en null si el backend no la devuelve', () => {
      const raw = { id: 4, codigo: 'SOL-004', estado: 'ASIGNADA' };
      expect(mapSolicitud(raw).fechaLimite).toBeNull();
    });
  });

  describe('mapUsuario (nombres + apellidos y campos requeridos)', () => {
    it('concatena nombres y apellidos en el campo nombre', () => {
      const u = {
        id: 10,
        nombres: 'María Elena',
        apellidos: 'Vargas Paz',
        correo: 'maria.vargas@universidad.edu',
        rol: 'ADMINISTRADOR',
        areaId: 2,
        activo: true,
      };
      const res = mapUsuario(u);
      expect(res.nombre).toBe('María Elena Vargas Paz');
      expect(res.nombres).toBe('María Elena');
      expect(res.apellidos).toBe('Vargas Paz');
      expect(res.correo).toBe('maria.vargas@universidad.edu');
      expect(res.rol).toBe('ADMINISTRADOR');
      expect(res.areaId).toBe(2);
      expect(res.activo).toBe(true);
      expect(res.id).toBe(10);
    });

    it('maneja usuario con solo nombres', () => {
      const res = mapUsuario({ id: 11, nombres: 'Carlos' });
      expect(res.nombre).toBe('Carlos');
      expect(res.nombres).toBe('Carlos');
      expect(res.apellidos).toBe('');
    });

    it('maneja usuario con solo apellidos', () => {
      const res = mapUsuario({ id: 12, apellidos: 'Gómez' });
      expect(res.nombre).toBe('Gómez');
      expect(res.nombres).toBe('');
      expect(res.apellidos).toBe('Gómez');
    });

    it('asigna "Usuario" si no existen ni nombres ni apellidos', () => {
      const res = mapUsuario({ id: 13, correo: 'test@universidad.edu' });
      expect(res.nombre).toBe('Usuario');
      expect(res.nombres).toBe('');
      expect(res.apellidos).toBe('');
    });

    it('asigna activo: true por defecto si no viene definido en la respuesta', () => {
      const res = mapUsuario({ id: 14, nombres: 'Ana' });
      expect(res.activo).toBe(true);
    });

    it('retorna null si la entrada es nula o indefinida', () => {
      expect(mapUsuario(null)).toBeNull();
      expect(mapUsuario(undefined)).toBeNull();
    });
  });

  describe('parseNivel', () => {
    it('retorna el número directamente cuando se recibe un entero', () => {
      expect(parseNivel(1)).toBe(1);
      expect(parseNivel(5)).toBe(5);
      expect(parseNivel(10)).toBe(10);
    });

    it('convierte texto numérico a entero', () => {
      expect(parseNivel('1')).toBe(1);
      expect(parseNivel('3')).toBe(3);
      expect(parseNivel(' 4 ')).toBe(4);
    });

    it('decodifica valores numéricos codificados en base64', () => {
      const b64 = btoa('2');
      expect(parseNivel(b64)).toBe(2);
    });

    it('retorna null para null, undefined o cadena vacía', () => {
      expect(parseNivel(null)).toBeNull();
      expect(parseNivel(undefined)).toBeNull();
      expect(parseNivel('')).toBeNull();
    });

    it('retorna el valor original ante entradas no numéricas inesperadas', () => {
      expect(parseNivel('no-un-numero')).toBe('no-un-numero');
      const obj = { custom: true };
      expect(parseNivel(obj)).toBe(obj);
    });
  });
});

