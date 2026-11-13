// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlazoSolicitud from '../components/PlazoSolicitud';

const ahora = new Date(2026, 10, 13, 10, 0); // 13 nov 2026, 10:00 (local)
const finDelDia = (d) => new Date(2026, 10, d, 23, 59, 59).toISOString();

describe('PlazoSolicitud', () => {
  it('muestra la fecha límite y el tiempo restante', () => {
    render(<PlazoSolicitud solicitud={{ fechaLimite: finDelDia(15), estadoApi: 'ASIGNADA' }} ahora={ahora} />);
    expect(screen.getByText('Fecha límite')).toBeInTheDocument();
    expect(screen.getByText('15 nov, 2026')).toBeInTheDocument();
    expect(screen.getByText('Vence en 2 días')).toBeInTheDocument();
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument();
  });

  it('muestra el badge "Vencida" cuando el plazo ya pasó', () => {
    render(<PlazoSolicitud solicitud={{ fechaLimite: finDelDia(10), estadoApi: 'EN_ATENCION' }} ahora={ahora} />);
    expect(screen.getByText('Vencida hace 3 días')).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
  });

  it('en una solicitud resuelta muestra solo la fecha, sin cuenta regresiva', () => {
    render(<PlazoSolicitud solicitud={{ fechaLimite: finDelDia(10), estado: 'Resuelta' }} ahora={ahora} />);
    expect(screen.getByText('10 nov, 2026')).toBeInTheDocument();
    expect(screen.queryByText(/Vence|Vencida/)).not.toBeInTheDocument();
  });

  it('no renderiza nada si la solicitud no tiene fecha límite', () => {
    const { container } = render(<PlazoSolicitud solicitud={{ estadoApi: 'ASIGNADA' }} ahora={ahora} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el fallback en la variante inline sin fecha límite', () => {
    render(<PlazoSolicitud solicitud={{ estadoApi: 'ASIGNADA' }} variant="inline" fallback="—" ahora={ahora} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('variante inline muestra fecha y texto', () => {
    render(<PlazoSolicitud solicitud={{ fechaLimite: finDelDia(13), estadoApi: 'ASIGNADA' }} variant="inline" ahora={ahora} />);
    expect(screen.getByText('13 nov, 2026')).toBeInTheDocument();
    expect(screen.getByText('Vence hoy')).toBeInTheDocument();
  });
});
