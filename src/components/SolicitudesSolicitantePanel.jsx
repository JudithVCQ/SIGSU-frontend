/**
 * SolicitudesSolicitantePanel.jsx — Panel de detección de duplicados.
 * Muestra las demás solicitudes del mismo solicitante para SUPERVISOR y ADMINISTRADOR.
 * Oculto para SOLICITANTE y TÉCNICO.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../config/constants';
import { getSolicitudesPorSolicitante } from '../services/solicitudes.js';
import Badge from './Badge';
import Icon from './Icon';
import { SkeletonFilas } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

export default function SolicitudesSolicitantePanel({
  solicitanteId,
  solicitanteNombre,
  excluirSolicitudId,
}) {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Solo visible para SUPERVISOR y ADMINISTRADOR
  const esAutorizado =
    user?.rol === ROLES.SUPERVISOR || user?.rol === ROLES.ADMIN;

  const cargarSolicitudes = useCallback(async () => {
    if (!solicitanteId) {
      setSolicitudes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getSolicitudesPorSolicitante(solicitanteId, excluirSolicitudId);
      setSolicitudes(data ?? []);
    } catch {
      setError('No pudimos cargar las otras solicitudes de este solicitante.');
    } finally {
      setLoading(false);
    }
  }, [solicitanteId, excluirSolicitudId]);

  useEffect(() => {
    if (esAutorizado) {
      cargarSolicitudes();
    }
  }, [esAutorizado, cargarSolicitudes]);

  if (!esAutorizado) {
    return null;
  }

  // Comprobar si hay solicitudes abiertas (estado distinto de CERRADA)
  const abiertas = solicitudes.filter((s) => {
    const estadoNorm = (s.estadoApi || s.estado || '').toUpperCase();
    return estadoNorm !== 'CERRADA' && s.estado !== 'Cerrada';
  });
  const hayAbiertas = abiertas.length > 0;

  return (
    <section className="panel duplicados-panel" aria-labelledby="duplicados-panel-title">
      <div className="duplicados-header">
        <div className="duplicados-title-group">
          <Icon name="file" size={20} />
          <h2 id="duplicados-panel-title" className="duplicados-title">
            Otras solicitudes de este solicitante
          </h2>
        </div>
        {solicitanteNombre && (
          <span className="duplicados-subtitulo">{solicitanteNombre}</span>
        )}
      </div>

      {loading && <SkeletonFilas filas={2} columnas={2} />}

      {!loading && error && <ErrorState message={error} onRetry={cargarSolicitudes} compact />}

      {!loading && !error && solicitudes.length === 0 && (
        <EmptyState title="Primera solicitud de este usuario" compact />
      )}

      {!loading && !error && solicitudes.length > 0 && (
        <div className="duplicados-content">
          {hayAbiertas && (
            <div className="duplicados-alerta-abiertas" role="alert">
              <Icon name="alert" size={18} />
              <div>
                <strong>Atención:</strong> El solicitante tiene{' '}
                {abiertas.length === 1
                  ? 'otra solicitud abierta'
                  : `${abiertas.length} otras solicitudes abiertas`}{' '}
                en curso. Verifica posibles duplicados antes de continuar.
              </div>
            </div>
          )}

          <ul className="duplicados-list">
            {solicitudes.map((s) => (
              <li key={s.id || s.codigo} className="duplicados-item">
                <div className="duplicados-item-main">
                  <div className="duplicados-item-top">
                    <span className="duplicados-codigo">{s.codigo}</span>
                    <Badge texto={s.estado} />
                    {s.fecha && <span className="duplicados-fecha">{s.fecha}</span>}
                  </div>
                  <Link
                    to={`/solicitudes/${s.codigo || s.id}`}
                    className="duplicados-item-link"
                    title={`Ver detalle de ${s.codigo}`}
                  >
                    {s.titulo}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

