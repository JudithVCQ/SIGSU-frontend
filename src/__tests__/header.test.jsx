// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { migasDePan } from '../routes/migas';
import Header from '../components/Header';

const etiquetas = (migas) => migas.map((m) => m.label);

describe('migasDePan', () => {
  it('supervisor en el detalle de una solicitud', () => {
    expect(etiquetas(migasDePan('/solicitudes/SOL-2026-000007', '', 'SUPERVISOR')))
      .toEqual(['Supervisión', 'Solicitudes', 'SOL-2026-000007']);
  });

  it('acciones del supervisor sobre una solicitud', () => {
    const migas = migasDePan('/supervisor/solicitudes/SOL-2026-000007/clasificar', '', 'SUPERVISOR');
    expect(etiquetas(migas)).toEqual(['Supervisión', 'Solicitudes', 'SOL-2026-000007', 'Clasificar']);
    expect(migas[2]).toMatchObject({ to: '/solicitudes/SOL-2026-000007', codigo: true });
    expect(etiquetas(migasDePan('/supervisor/solicitudes/X/asignar', '', 'SUPERVISOR')).at(-1)).toBe('Asignar técnico');
    expect(etiquetas(migasDePan('/supervisor/solicitudes/X/cerrar', '', 'SUPERVISOR')).at(-1)).toBe('Revisar y cerrar');
  });

  it('el detalle compartido depende del rol', () => {
    expect(etiquetas(migasDePan('/solicitudes/SOL-1', '', 'SOLICITANTE'))).toEqual(['Mi espacio', 'Mis solicitudes', 'SOL-1']);
    expect(etiquetas(migasDePan('/solicitudes/SOL-1', '', 'TECNICO'))).toEqual(['Espacio técnico', 'Mis asignaciones', 'SOL-1']);
    expect(etiquetas(migasDePan('/solicitudes/SOL-1', '', 'ADMINISTRADOR'))).toEqual(['Administración', 'SOL-1']);
  });

  it('páginas de cada rol y vista rápida aplicada', () => {
    expect(etiquetas(migasDePan('/supervisor', '', 'SUPERVISOR'))).toEqual(['Supervisión', 'Dashboard']);
    expect(etiquetas(migasDePan('/supervisor/solicitudes', '?vista=por-cerrar', 'SUPERVISOR')))
      .toEqual(['Supervisión', 'Solicitudes', 'Por cerrar']);
    expect(etiquetas(migasDePan('/tecnico/atencion/SOL-9', '', 'TECNICO'))).toEqual(['Espacio técnico', 'Mis asignaciones', 'SOL-9']);
    expect(etiquetas(migasDePan('/admin/catalogos', '', 'ADMINISTRADOR'))).toEqual(['Administración', 'Catálogos']);
    expect(etiquetas(migasDePan('/solicitante/nueva', '', 'SOLICITANTE'))).toEqual(['Mi espacio', 'Nueva solicitud']);
  });

  it('la última miga no tiene enlace y las anteriores sí', () => {
    const migas = migasDePan('/supervisor/solicitudes', '?vista=por-cerrar', 'SUPERVISOR');
    expect(migas.at(-1).to).toBeUndefined();
    expect(migas[0].to).toBe('/supervisor');
    expect(migas[1].to).toBe('/supervisor/solicitudes');
  });

  it('nunca usa "SIGSU" como título', () => {
    for (const [ruta, rol] of [['/desconocida', 'SUPERVISOR'], ['/otra', undefined], ['/solicitudes/X', 'SOLICITANTE']]) {
      expect(etiquetas(migasDePan(ruta, '', rol))).not.toContain('SIGSU');
    }
  });
});

describe('Header', () => {
  function renderHeader(ruta, rol) {
    return render(
      <MemoryRouter initialEntries={[ruta]}>
        <Header rol={rol} />
      </MemoryRouter>,
    );
  }

  it('muestra la ruta de navegación con enlaces y la página actual', () => {
    renderHeader('/solicitudes/SOL-2026-000007', 'SUPERVISOR');
    const nav = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(nav).getByRole('link', { name: 'Supervisión' })).toHaveAttribute('href', '/supervisor');
    expect(within(nav).getByRole('link', { name: 'Solicitudes' })).toHaveAttribute('href', '/supervisor/solicitudes');
    expect(within(nav).getByText('SOL-2026-000007')).toHaveAttribute('aria-current', 'page');
    expect(nav).toHaveTextContent('Supervisión›Solicitudes›SOL-2026-000007');
  });

  it('ya no muestra usuario, cerrar sesión ni notificaciones', () => {
    renderHeader('/supervisor', 'SUPERVISOR');
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Notificaciones' })).toBeNull();
    expect(screen.queryByText('SIGSU')).toBeNull();
  });
});
