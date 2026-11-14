// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination, { rangoPagina, usePaginacion, TAMANO_PAGINA } from '../components/Pagination';

describe('rangoPagina', () => {
  it('calcula "inicio–fin de total"', () => {
    expect(rangoPagina(0, 37)).toEqual({ inicio: 1, fin: 10 });
    expect(rangoPagina(3, 37)).toEqual({ inicio: 31, fin: 37 });
    expect(rangoPagina(0, 0)).toEqual({ inicio: 0, fin: 0 });
  });
});

describe('Pagination', () => {
  it('usa 10 filas por página', () => {
    expect(TAMANO_PAGINA).toBe(10);
  });

  it('se oculta si solo hay una página', () => {
    const { container } = render(<Pagination pagina={0} total={10} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
    const vacio = render(<Pagination pagina={0} total={0} onChange={() => {}} />);
    expect(vacio.container).toBeEmptyDOMElement();
  });

  it('muestra el contador "1–10 de 37" y navega con ‹ ›', () => {
    const onChange = vi.fn();
    render(<Pagination pagina={0} total={37} onChange={onChange} />);
    expect(screen.getByText('1–10 de 37')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('en la última página desactiva "siguiente" y muestra el rango final', () => {
    const onChange = vi.fn();
    render(<Pagination pagina={3} total={37} onChange={onChange} />);
    expect(screen.getByText('31–37 de 37')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('puede repetirse arriba y abajo', () => {
    render(
      <>
        <Pagination pagina={0} total={25} onChange={() => {}} posicion="arriba" />
        <Pagination pagina={0} total={25} onChange={() => {}} posicion="abajo" />
      </>,
    );
    expect(screen.getAllByText('1–10 de 25')).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: 'Paginación (arriba)' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginación (abajo)' })).toBeInTheDocument();
  });
});

describe('usePaginacion', () => {
  const lista = Array.from({ length: 23 }, (_, i) => i + 1);

  function Demo({ datos = lista, filtro = '' }) {
    const { pagina, setPagina, items, total } = usePaginacion(datos, filtro);
    return (
      <div>
        <output data-testid="items">{items.join(',')}</output>
        <output data-testid="pagina">{pagina}</output>
        <Pagination pagina={pagina} total={total} onChange={setPagina} />
      </div>
    );
  }

  it('entrega 10 elementos por página y avanza', () => {
    render(<Demo />);
    expect(screen.getByTestId('items').textContent).toBe('1,2,3,4,5,6,7,8,9,10');
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByTestId('items').textContent).toBe('11,12,13,14,15,16,17,18,19,20');
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByTestId('items').textContent).toBe('21,22,23');
    expect(screen.getByText('21–23 de 23')).toBeInTheDocument();
  });

  it('vuelve a la primera página al cambiar los filtros', () => {
    const { rerender } = render(<Demo filtro="a" />);
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByTestId('pagina').textContent).toBe('1');
    rerender(<Demo filtro="b" />);
    expect(screen.getByTestId('pagina').textContent).toBe('0');
  });

  it('si la lista se acorta, no queda en una página inexistente', () => {
    const { rerender } = render(<Demo />);
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    rerender(<Demo datos={lista.slice(0, 12)} />);
    expect(screen.getByTestId('items').textContent).toBe('11,12');
  });

  it('con una sola página no muestra controles', () => {
    render(<Demo datos={lista.slice(0, 7)} />);
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).toBeNull();
  });
});
