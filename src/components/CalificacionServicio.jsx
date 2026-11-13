/**
 * CalificacionServicio.jsx — Calificación del servicio (1–5 + comentario opcional).
 *
 * - Solo aplica a solicitudes RESUELTA o CERRADA; en otro estado no renderiza nada.
 * - Si la funcionalidad no está disponible, no renderiza nada. En modo API sin endpoint
 *   de backend funciona como vista previa local (ver services/calificaciones.js).
 * - `puedeCalificar`: el solicitante dueño de la solicitud ve el formulario si aún no calificó.
 *   El resto (supervisor, administrador) ve la calificación en solo lectura.
 * - Una sola calificación por solicitud, sin edición.
 */
import { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import Icon from './Icon';
import { CALIFICACION } from '../config/constants';
import {
  calificacionDisponible,
  esVistaPreviaLocal,
  esCalificable,
  getCalificacion,
  calificarSolicitud,
  validarCalificacion,
} from '../services/calificaciones.js';
import { formatFechaVisual } from '../services/mappers.js';

const PUNTAJES = Array.from(
  { length: CALIFICACION.puntajeMax - CALIFICACION.puntajeMin + 1 },
  (_, i) => CALIFICACION.puntajeMin + i,
);

export function Estrellas({ puntaje }) {
  return (
    <span className="calificacion-estrellas-lectura" role="img" aria-label={`${puntaje} de ${CALIFICACION.puntajeMax}`}>
      {PUNTAJES.map((n) => (
        <span key={n} aria-hidden="true" className={n <= puntaje ? 'activa' : ''}>★</span>
      ))}
    </span>
  );
}

export default function CalificacionServicio({ solicitud, puedeCalificar = false }) {
  const visible = Boolean(solicitud) && calificacionDisponible() && esCalificable(solicitud);

  const [calificacion, setCalificacion] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [puntaje,      setPuntaje]      = useState(0);
  const [comentario,   setComentario]   = useState('');
  const [enviando,     setEnviando]     = useState(false);
  const [errEnvio,     setErrEnvio]     = useState('');
  const [recienEnviada, setRecienEnviada] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCalificacion(await getCalificacion(solicitud));
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la calificación.');
    } finally {
      setLoading(false);
    }
  }, [solicitud]);

  useEffect(() => {
    if (visible) cargar();
  }, [visible, cargar]);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const datos = { puntaje, comentario: comentario.trim() };
    const msg = validarCalificacion(datos);
    if (msg) { setErrEnvio(msg); return; }

    setEnviando(true);
    setErrEnvio('');
    try {
      const nueva = await calificarSolicitud(solicitud, datos);
      setCalificacion(nueva);
      setRecienEnviada(true);
    } catch (err) {
      setErrEnvio(err?.message || 'No se pudo registrar la calificación.');
    } finally {
      setEnviando(false);
    }
  };

  let contenido;
  if (loading) {
    contenido = <p className="muted-note" role="status">Cargando calificación…</p>;
  } else if (error) {
    contenido = (
      <div>
        <div className="message error" role="alert">
          <Icon name="alert" /><div><strong>{error}</strong></div>
        </div>
        <Button variant="secondary" onClick={cargar}>Reintentar</Button>
      </div>
    );
  } else if (calificacion) {
    contenido = (
      <div className="calificacion-lectura">
        {recienEnviada && (
          <div className="message success" role="status">
            <Icon name="check" /><div><strong>¡Gracias por calificar el servicio!</strong></div>
          </div>
        )}
        <Estrellas puntaje={calificacion.puntaje} />
        {calificacion.comentario && <p className="calificacion-comentario">“{calificacion.comentario}”</p>}
        {calificacion.creadoEn && (
          <small className="muted-note">Calificada el {formatFechaVisual(calificacion.creadoEn)}</small>
        )}
      </div>
    );
  } else if (!puedeCalificar) {
    contenido = <p className="muted-note">El solicitante aún no ha calificado este servicio.</p>;
  } else {
    contenido = (
      <form className="calificacion-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="calificacion-estrellas">
          <legend>¿Cómo calificarías la atención recibida?</legend>
          <div className="calificacion-opciones">
            {PUNTAJES.map((n) => (
              <label key={n} className={n <= puntaje ? 'activa' : ''}>
                <input
                  type="radio"
                  name="calificacion-puntaje"
                  className="sr-only"
                  value={n}
                  checked={puntaje === n}
                  onChange={() => { setPuntaje(n); setErrEnvio(''); }}
                  aria-label={`${n} de ${CALIFICACION.puntajeMax}`}
                />
                <span aria-hidden="true">★</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="field-label" htmlFor="calificacion-comentario">Comentario (opcional)</label>
          <textarea
            id="calificacion-comentario"
            value={comentario}
            maxLength={CALIFICACION.maxComentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Cuéntanos cómo fue la atención"
          />
          <small className="muted-note calificacion-contador">
            {comentario.length}/{CALIFICACION.maxComentario}
          </small>
        </div>

        {errEnvio && (
          <div className="message error" role="alert">
            <Icon name="alert" /><div><strong>{errEnvio}</strong></div>
          </div>
        )}

        <Button type="submit" full disabled={enviando || !puntaje}>
          {enviando ? 'Enviando…' : 'Enviar calificación'}
        </Button>
      </form>
    );
  }

  return (
    <section className="panel status-panel calificacion-panel" aria-labelledby="calificacion-titulo">
      <h2 id="calificacion-titulo" className="card-label">Calificación del servicio</h2>
      {contenido}
      {!loading && !error && esVistaPreviaLocal() && (
        <small className="muted-note calificacion-aviso">
          Vista previa: la calificación se guarda solo en este navegador.
        </small>
      )}
    </section>
  );
}
