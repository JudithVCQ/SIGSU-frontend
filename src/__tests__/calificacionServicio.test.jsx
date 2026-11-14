// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as calificacionesService from '../services/calificaciones.js';
import { resetCalificacionesMock } from '../mocks/calificaciones.js';
import CalificacionServicio from '../components/CalificacionServicio';

const sinCalificar = { codigo: 'SIG-00118', estadoApi: 'RESUELTA', estado: 'Resuelta' };
const calificada   = { codigo: 'SIG-00115', estadoApi: 'RESUELTA', estado: 'Resuelta' }; // semilla: 5

describe('CalificacionServicio', () => {
  beforeEach(() => resetCalificacionesMock());
  afterEach(() => vi.restoreAllMocks());

  it('no renderiza nada si la solicitud no está resuelta ni cerrada', () => {
    const { container } = render(
      <CalificacionServicio solicitud={{ codigo: 'SIG-00129', estadoApi: 'ASIGNADA' }} puedeCalificar />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('el solicitante califica: botón deshabilitado sin puntaje y solo lectura tras enviar', async () => {
    render(<CalificacionServicio solicitud={sinCalificar} puedeCalificar />);

    const enviar = await screen.findByRole('button', { name: 'Enviar calificación' });
    expect(enviar).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: '4 de 5' }));
    expect(enviar).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Comentario (opcional)'), { target: { value: 'Muy amables' } });
    expect(screen.getByText('11/500')).toBeInTheDocument();

    fireEvent.click(enviar);

    expect(await screen.findByText('¡Gracias por calificar el servicio!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4 de 5' })).toBeInTheDocument();
    expect(screen.getByText('“Muy amables”')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar calificación' })).not.toBeInTheDocument();
  });

  it('muestra en solo lectura una calificación existente (supervisor)', async () => {
    render(<CalificacionServicio solicitud={calificada} puedeCalificar={false} />);
    expect(await screen.findByRole('img', { name: '5 de 5' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('indica que aún no hay calificación cuando el usuario no puede calificar', async () => {
    render(<CalificacionServicio solicitud={sinCalificar} puedeCalificar={false} />);
    expect(await screen.findByText('El solicitante aún no ha calificado este servicio.')).toBeInTheDocument();
  });

  it('muestra error con "Reintentar" y recarga al pulsarlo', async () => {
    const spy = vi.spyOn(calificacionesService, 'getCalificacion')
      .mockRejectedValueOnce(new Error('Falla de red'))
      .mockResolvedValueOnce({ puntaje: 3, comentario: '', creadoEn: null });

    render(<CalificacionServicio solicitud={calificada} />);
    expect(await screen.findByText('No pudimos cargar la calificación. Inténtalo de nuevo.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.getByRole('img', { name: '3 de 5' })).toBeInTheDocument());
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
