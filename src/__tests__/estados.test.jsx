// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';

describe('EmptyState', () => {
  it('muestra título, texto y acción opcional', () => {
    const alClic = vi.fn();
    render(
      <EmptyState
        title="Aún no hay solicitudes"
        text="Cuando registres una, aparecerá aquí."
        action={<button type="button" onClick={alClic}>Nueva solicitud</button>}
      />,
    );
    expect(screen.getByText('Aún no hay solicitudes')).toBeInTheDocument();
    expect(screen.getByText('Cuando registres una, aparecerá aquí.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva solicitud' }));
    expect(alClic).toHaveBeenCalled();
  });

  it('sin acción no renderiza botones', () => {
    render(<EmptyState title="Nada por aquí" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ErrorState', () => {
  it('muestra el mensaje en un aviso y reintenta', () => {
    const reintentar = vi.fn();
    render(<ErrorState message="No pudimos cargar las solicitudes." onRetry={reintentar} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar las solicitudes.');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reintentar).toHaveBeenCalledTimes(1);
  });

  it('usa un mensaje amable por defecto y sin datos técnicos', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole('alert').textContent).not.toMatch(/\b(40\d|50\d|HTTP|fetch|undefined|null)\b/i);
  });

  it('sin onRetry no muestra el botón', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });
});

describe('Skeleton', () => {
  it.each(['filas', 'kpi', 'detalle'])('la variante %s se anuncia como carga', (variante) => {
    render(<Skeleton variante={variante} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toHaveAttribute('aria-busy', 'true');
  });
});
