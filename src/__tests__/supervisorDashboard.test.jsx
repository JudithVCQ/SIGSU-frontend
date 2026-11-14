// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authHook from '../hooks/useAuth';
import SupervisorDashboard from '../dashboard/SupervisorDashboard';

function renderDashboard() {
  vi.spyOn(authHook, 'useAuth').mockReturnValue({ user: { id: 2, nombre: 'Ana Supervisora', rol: 'SUPERVISOR' } });
  return render(
    <MemoryRouter>
      <SupervisorDashboard />
    </MemoryRouter>,
  );
}

describe('SupervisorDashboard', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('no muestra comparativos fijos que no vienen del backend', async () => {
    renderDashboard();
    expect(await screen.findByText('Solicitudes totales')).toBeInTheDocument();
    expect(screen.queryByText(/\+12%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/vs\. período anterior/)).not.toBeInTheDocument();
  });

  it('saluda según la hora local', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 13, 20, 30));
    renderDashboard();
    expect(await screen.findByRole('heading', { name: 'Buenas noches, Ana' })).toBeInTheDocument();
  });
});
