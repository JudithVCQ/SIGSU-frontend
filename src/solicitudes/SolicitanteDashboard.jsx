import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSolicitudesMock } from '../mocks/solicitudes';
import { getSolicitudes } from '../services/solicitudes.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import { SkeletonFilas, SkeletonKpis } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function SolicitanteDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(!USE_MOCKS);
  const [error,   setError]   = useState('');

  const firstName = user?.nombre ? user.nombre.split(' ')[0] : 'Usuario';

  const cargar = useCallback(() => {
    if (USE_MOCKS) { setItems(getSolicitudesMock()); return; }
    setLoading(true);
    setError('');
    getSolicitudes()
      .then(setItems)
      .catch(() => setError('No pudimos cargar tus solicitudes. Revisa tu conexión e inténtalo de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Con backend: REGISTRADA + EN_EVALUACION = "pendientes sin asignar aún"
  const pendientes = items.filter(r => {
    const e = r.estadoApi ?? r.estado;
    return e === 'REGISTRADA' || e === 'EN_EVALUACION' || e === 'Pendiente' || e === 'Registrada' || e === 'En evaluación';
  }).length;
  const enAtencion = items.filter(r => {
    const e = r.estadoApi ?? r.estado;
    return e === 'EN_ATENCION' || e === 'En atención';
  }).length;
  const resueltas  = items.filter(r => {
    const e = r.estadoApi ?? r.estado;
    return e === 'RESUELTA' || e === 'CERRADA' || e === 'Resuelta' || e === 'Cerrada';
  }).length;

  return (
    <div>
      <PageHead
        eyebrow={new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        title={`Hola, ${firstName}`}
        text="Revisa el avance de tus solicitudes o registra una nueva."
      />

      <section className="cta-banner">
        <div>
          <h2>¿Algo no funciona en el campus?</h2>
          <p>Cuéntanos qué ocurre y el equipo indicado se encargará.</p>
        </div>
        <Button variant="accent" icon="plus" onClick={() => navigate('/solicitante/nueva')}>
          Nueva solicitud
        </Button>
      </section>

      {loading ? (
        <SkeletonKpis cantidad={3} />
      ) : !error && (
        <div className="kpi-grid">
          <KpiCard icon="clock"  number={String(pendientes)} label="Pendientes"  change="Esperando clasificación o asignación" />
          <KpiCard icon="layers" number={String(enAtencion)} label="En atención" change="Un responsable trabaja en ellas" tone="dark" />
          <KpiCard icon="check"  number={String(resueltas)}  label="Resueltas"   change="Últimos 30 días" tone="gold" />
        </div>
      )}

      <section className="panel recent-panel">
        <div className="panel-head">
          <div>
            <h2>Solicitudes recientes</h2>
            <p>Tus últimas actualizaciones</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/solicitante/solicitudes')}>
            Ver todas <Icon name="chevron" size={16} />
          </Button>
        </div>

        {loading ? (
          <SkeletonFilas filas={3} columnas={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={cargar} compact />
        ) : items.length === 0 ? (
          <EmptyState
            title="No tienes solicitudes aún"
            text="Registra tu primera solicitud con el botón de arriba."
            compact
          />
        ) : (
          <div>
            {items.slice(0, 4).map((r) => (
              <button
                key={r.codigo || r.id}
                type="button"
                className="recent-item"
                onClick={() => navigate(`/solicitudes/${r.codigo}`)}
              >
                <div className="recent-main">
                  <strong>{r.codigo}</strong>
                  <span>{r.titulo}</span>
                  <small>{r.categoria || r.categoriaNombre || '—'} · {r.fecha || ''}</small>
                </div>
                <div className="recent-badges">
                  <Badge texto={r.estado} />
                  {r.prioridad && <Badge texto={r.prioridad} />}
                </div>
                <Icon name="chevron" size={18} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
