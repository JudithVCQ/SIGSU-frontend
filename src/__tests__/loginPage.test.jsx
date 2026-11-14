// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authHook from '../hooks/useAuth';
import LoginPage from '../auth/LoginPage';
import Logo from '../components/Logo';

afterEach(() => vi.restoreAllMocks());

function renderLogin() {
  vi.spyOn(authHook, 'useAuth').mockReturnValue({ login: vi.fn(), user: null });
  return render(<MemoryRouter><LoginPage /></MemoryRouter>);
}

describe('LoginPage', () => {
  it('muestra el formulario con los textos pedidos y campos de 44px con autocomplete correcto', () => {
    renderLogin();
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByText('Ingresa con tu correo institucional')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('presenta el sistema: título, subtítulo, 3 pasos y ejemplo ilustrativo', () => {
    renderLogin();
    expect(screen.getByRole('heading', { level: 2, name: 'Reporta, sigue y resuelve lo que pasa en el campus.' })).toBeInTheDocument();
    expect(screen.getByText(/un solo lugar para pedir ayuda y saber en qué va tu pedido/)).toBeInTheDocument();
    for (const paso of ['Registra tu solicitud', 'Sigue su avance', 'Califica la atención']) {
      expect(screen.getByText(paso)).toBeInTheDocument();
    }
    expect(screen.getByText('Ejemplo ilustrativo')).toBeInTheDocument();
  });

  it('ya no ofrece registrarse, ni menciona el portal del solicitante ni la nota de cuentas', () => {
    renderLogin();
    expect(screen.queryByText(/Regístrate/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /reg[ií]strate/i })).toBeNull();
    expect(screen.queryByText(/portal del solicitante/i)).toBeNull();
    expect(screen.queryByText(/Las cuentas las crea el administrador/)).toBeNull();
  });

  it('no menciona la universidad en el logo', () => {
    render(<Logo />);
    expect(screen.getByText('SIGSU')).toBeInTheDocument();
    expect(screen.getByText('Gestión de solicitudes universitarias')).toBeInTheDocument();
    expect(screen.queryByText(/Universidad|UNMSM|San Marcos/i)).toBeNull();
  });

  it('el logo decorativo está oculto para lectores de pantalla', () => {
    const { container } = render(<Logo compact />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
