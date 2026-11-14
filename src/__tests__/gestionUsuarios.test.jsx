// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// GestionUsuarios solo funciona con la API real: se carga con VITE_USE_MOCKS=false
async function renderGestionUsuarios() {
  vi.stubEnv('VITE_USE_MOCKS', 'false');
  vi.resetModules();
  const usuarios  = await import('../services/usuarios.js');
  const catalogos = await import('../services/catalogos.js');
  const auth      = await import('../hooks/useAuth');
  vi.spyOn(usuarios, 'getUsuarios').mockResolvedValue([]);
  vi.spyOn(usuarios, 'getRoles').mockResolvedValue(['SOLICITANTE', 'TECNICO', 'SUPERVISOR', 'ADMINISTRADOR']);
  vi.spyOn(catalogos, 'getAreas').mockResolvedValue([]);
  vi.spyOn(auth, 'useAuth').mockReturnValue({ user: { id: 1, nombre: 'Admin Prueba', rol: 'ADMINISTRADOR' } });
  const { default: GestionUsuarios } = await import('../administracion/GestionUsuarios.jsx');
  return render(<GestionUsuarios />);
}

describe('GestionUsuarios – Registrar nuevo usuario', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('evita que el navegador autollene correo y contraseña con la sesión actual', async () => {
    await renderGestionUsuarios();
    fireEvent.click(await screen.findByRole('button', { name: /Nuevo usuario/ }));

    expect(await screen.findByText('Registrar nuevo usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('usuario@universidad.edu')).toHaveAttribute('autocomplete', 'off');
    expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute('autocomplete', 'new-password');
  });
});
