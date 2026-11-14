// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// GestionUsuarios solo funciona con la API real: se carga con VITE_USE_MOCKS=false
async function renderGestionUsuarios(listaUsuarios = []) {
  vi.stubEnv('VITE_USE_MOCKS', 'false');
  vi.resetModules();
  const usuarios  = await import('../services/usuarios.js');
  const catalogos = await import('../services/catalogos.js');
  const auth      = await import('../hooks/useAuth');
  vi.spyOn(usuarios, 'getUsuarios').mockResolvedValue(listaUsuarios);
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

describe('GestionUsuarios – Editar usuario', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  const admin = { id: 1, nombre: 'Admin Prueba', nombres: 'Admin', apellidos: 'Prueba', correo: 'admin@u.edu', rol: 'ADMINISTRADOR', activo: true };
  const otro  = { id: 2, nombre: 'Luis Gómez', nombres: 'Luis', apellidos: 'Gómez', correo: 'luis@u.edu', rol: 'SOLICITANTE', activo: true };

  it('si el admin se edita a sí mismo, el rol queda deshabilitado con una nota informativa (sin error)', async () => {
    await renderGestionUsuarios([admin, otro]);
    const botones = await screen.findAllByRole('button', { name: /^Editar$/ });
    fireEvent.click(botones[0]);

    const select = await screen.findByLabelText('Rol del sistema');
    expect(select).toBeDisabled();
    expect(select).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('No puedes cambiar tu propio rol de administrador.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('al editar a otra persona el rol sí se puede cambiar', async () => {
    await renderGestionUsuarios([admin, otro]);
    const botones = await screen.findAllByRole('button', { name: /^Editar$/ });
    fireEvent.click(botones[1]);
    expect(await screen.findByLabelText('Rol del sistema')).toBeEnabled();
  });
});
