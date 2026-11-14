// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActividadSolicitud, { construirActividad } from '../components/ActividadSolicitud';

const solicitud = { solicitante: 'Camila Rojas', creadoEn: new Date('2026-11-01T10:00:00Z'), fecha: '1 nov 2026' };
const historial = [
  { id: 1, estadoOrigen: 'Registrada', estadoDestino: 'En evaluación', cambiadoPor: 'Sup', tiempo: 't2', cambiadoEn: new Date('2026-11-02T10:00:00Z') },
];
const comentarios = [
  { id: 9, nombre: 'Luis', texto: 'Primero', tiempo: 't1', creadoEn: new Date('2026-11-01T12:00:00Z') },
  { id: 10, nombre: 'Ana', texto: 'Último', tiempo: 't3', creadoEn: new Date('2026-11-03T12:00:00Z') },
];

describe('Actividad', () => {
  it('mezcla historial y comentarios por fecha, con "Solicitud registrada por" primero', () => {
    const ev = construirActividad({ solicitud, historial, comentarios });
    expect(ev.map((e) => e.tipo)).toEqual(['registro', 'comentario', 'estado', 'comentario']);
    expect(ev[0].texto).toBe('Solicitud registrada por Camila Rojas');
    expect(ev[1].texto).toBe('Primero');
    expect(ev[3].texto).toBe('Último');
  });

  it('renderiza el primer evento antes que los demás', () => {
    const ev = construirActividad({ solicitud, historial, comentarios });
    render(<ActividadSolicitud eventos={ev} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Solicitud registrada por Camila Rojas');
    expect(items).toHaveLength(4);
  });
});
