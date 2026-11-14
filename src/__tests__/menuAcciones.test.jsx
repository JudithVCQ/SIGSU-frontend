// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuAcciones from '../components/MenuAcciones';
import RequestTable from '../components/RequestTable';

describe('MenuAcciones "⋯"', () => {
  it('abre con clic, ejecuta la acción y cierra', () => {
    const onClick = vi.fn();
    render(<MenuAcciones acciones={[{ label: 'Ver detalle', onClick }]} />);
    const btn = screen.getByRole('button', { name: 'Más acciones' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ver detalle' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Escape cierra y devuelve el foco al botón', () => {
    render(<MenuAcciones acciones={[{ label: 'A', onClick: () => {} }]} />);
    const btn = screen.getByRole('button', { name: 'Más acciones' });
    fireEvent.click(btn);
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'A' }), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });
});

describe('RequestTable: fila clicable', () => {
  const req = [{ codigo: 'SIG-1', titulo: 'Proyector', categoria: 'X', estado: 'Registrada', prioridad: '' }];

  it('abre el detalle con clic y con Enter; prioridad vacía = "Sin clasificar"', () => {
    const onOpen = vi.fn();
    render(<RequestTable requests={req} onOpen={onOpen} getAcciones={() => ({ principal: null, menu: [] })} />);
    expect(screen.getAllByText('Sin clasificar').length).toBeGreaterThan(0);
    const fila = screen.getByRole('row', { name: /Abrir SIG-1/ });
    fireEvent.keyDown(fila, { key: 'Enter' });
    fireEvent.click(fila);
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledWith('SIG-1');
  });

  it('la acción principal no abre la fila', () => {
    const onOpen = vi.fn();
    const clasificar = vi.fn();
    render(<RequestTable requests={req} onOpen={onOpen}
      getAcciones={() => ({ principal: { label: 'Clasificar', onClick: clasificar }, menu: [{ label: 'Ver detalle', onClick: () => {} }] })} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Clasificar' })[0]);
    expect(clasificar).toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
