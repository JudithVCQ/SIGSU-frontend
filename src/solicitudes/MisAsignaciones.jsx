import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ESTADOS, ROLES } from '../config/constants';
import { getSolicitudesMock } from '../mocks/solicitudes';
import { getSolicitudes } from '../services/solicitudes.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';
import FormSelect from '../components/FormSelect';
import Badge from '../components/Badge';
import PlazoSolicitud from '../components/PlazoSolicitud';
import Icon from '../components/Icon';
import { SkeletonFilas, SkeletonKpis } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import VistaRapidaChip from '../components/VistaRapidaChip';
import { buscarVista } from '../routes/vistasRapidas';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function MisAsignaciones() {
  const navigate = useNavigate();
  // Vista rápida (?vista=) elegida desde el sidebar
  const [searchParams, setSearchParams] = useSearchParams();
  const vista = buscarVista(ROLES.TECNICO, searchParams.get('vista'));
  const quitarVista = () => setSearchParams((p) => {
    const n = new URLSearchParams(p);
    n.delete('vista');
    return n;
  });
  const { user } = useAuth();

  const [misAsignaciones, setMisAsignaciones] = useState([]);
  const [loading, setLoading] = useState(!USE_MOCKS);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');

  const cargar = useCallback(() => {
    if (USE_MOCKS) {
      const all = getSolicitudesMock();
      // En mocks filtramos por nombre (compatibilidad)
      setMisAsignaciones(all.filter(r => r.responsable && r.responsable === user?.nombre));
      return;
    }
    if (!user?.id) return;
    // En modo real: parámetro responsableId es el ID numérico del técnico
    setLoading(true);
    setError('');
    getSolicitudes({ responsableId: user.id })
      .then(setMisAsignaciones)
      .catch(() => setError('No pudimos cargar tus asignaciones. Revisa tu conexión e inténtalo de nuevo.'))
      .finally(() => setLoading(false));
  }, [user?.id, user?.nombre]);

  useEffect(() => { cargar(); }, [cargar]);

  const asignadasCount = misAsignaciones.filter(r => r.estadoApi === 'ASIGNADA' || r.estado === 'Asignada').length;
  const enAtencionCount = misAsignaciones.filter(r => r.estadoApi === 'EN_ATENCION' || r.estado === 'En atención').length;
  const resueltasCount = misAsignaciones.filter(r => r.estadoApi === 'RESUELTA' || r.estado === 'Resuelta').length;

  const filtered = misAsignaciones.filter((r) => (vista ? vista.filtro(r) : true)).filter((r) => {
    const matchEstado = !estadoFilter || r.estado === estadoFilter;
    const matchPrioridad = !prioridadFilter || r.prioridad === prioridadFilter;
    const target = `${r.codigo} ${r.titulo} ${r.categoria} ${r.ubicacion || ''}`.toLowerCase();
    const matchQuery = !query.trim() || target.includes(query.trim().toLowerCase());
    return matchEstado && matchPrioridad && matchQuery;
  });

  const getActionLabel = (r) => {
    const e = r.estadoApi ?? r.estado;
    if (e === 'ASIGNADA' || e === 'Asignada') return 'Iniciar atención';
    if (e === 'EN_ATENCION' || e === 'En atención') return 'Atender';
    return 'Ver detalle';
  };

  const isPrimaryAction = (r) => {
    const e = r.estadoApi ?? r.estado;
    return e === 'ASIGNADA' || e === 'EN_ATENCION' || e === 'Asignada' || e === 'En atención';
  };

  return (
    <div>
      <PageHead
        eyebrow="ESPACIO TÉCNICO"
        title={`Asignaciones de ${user?.nombre ? user.nombre.split(' ')[0] : 'Diego'}`}
        text="Gestiona tus órdenes de trabajo asignadas, registra avances y soluciones técnicas."
      />

      {loading ? (
        <SkeletonKpis cantidad={3} />
      ) : (
        <div className="kpi-grid">
          <KpiCard icon="clock" number={String(asignadasCount)} label="Asignadas" change="Pendientes de iniciar" />
          <KpiCard icon="layers" number={String(enAtencionCount)} label="En atención" change="Trabajos en curso" tone="dark" />
          <KpiCard icon="check" number={String(resueltasCount)} label="Resueltas" change="Completadas recientemente" tone="gold" />
        </div>
      )}

      <section className="panel table-panel" style={{ marginTop: '24px' }}>
        <div className="filters filters-3">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label="Buscar en mis asignaciones"
              placeholder="Buscar por código, título o ubicación"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <FormSelect label="Estado" value={estadoFilter} onChange={setEstadoFilter} options={ESTADOS} placeholder="Todos los estados" />
          <FormSelect label="Prioridad" value={prioridadFilter} onChange={setPrioridadFilter} options={['Alta', 'Media', 'Baja']} placeholder="Todas las prioridades" />
        </div>

        {vista && <VistaRapidaChip etiqueta={vista.label} onQuitar={quitarVista} />}
        <div className="results-label">
          {filtered.length} {filtered.length === 1 ? 'asignación' : 'asignaciones'} · Ordenadas por prioridad y fecha
        </div>

        {loading ? (
          <SkeletonFilas filas={5} columnas={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={cargar} />
        ) : misAsignaciones.length === 0 ? (
          <EmptyState
            icon="check"
            title="No tienes solicitudes asignadas"
            text="Cuando el supervisor derive una solicitud a tu nombre, aparecerá aquí."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No hay asignaciones con estos filtros"
            text="Prueba con otra búsqueda o limpia los filtros."
            action={
              <Button variant="secondary" onClick={() => { setQuery(''); setEstadoFilter(''); setPrioridadFilter(''); }}>
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <>
            <div className="desktop-table">
              <table className="req-table">
                <thead>
                  <tr>
                    <th>Solicitud</th><th>Categoría</th><th>Estado</th>
                    <th>Prioridad</th><th>Fecha</th><th>Fecha límite</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.codigo || r.id}>
                      <td>
                        <button type="button" className="request-link" onClick={() => navigate(`/tecnico/atencion/${r.codigo}`)}>
                          <strong>{r.codigo}</strong><span>{r.titulo}</span>
                        </button>
                      </td>
                      <td>{r.categoria || '—'}</td>
                      <td><Badge texto={r.estado} /></td>
                      <td><Badge texto={r.prioridad || '—'} /></td>
                      <td>{r.fecha}</td>
                      <td><PlazoSolicitud solicitud={r} variant="inline" fallback="—" /></td>
                      <td className="act">
                        <Button
                          variant={isPrimaryAction(r) ? 'primary' : 'secondary'}
                          onClick={() => navigate(`/tecnico/atencion/${r.codigo}`)}
                        >
                          {getActionLabel(r)}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards">
              {filtered.map((r) => (
                <article className="request-card" key={r.codigo || r.id}>
                  <div className="request-card-head">
                    <div><strong>{r.codigo}</strong><span>{r.fecha}</span></div>
                    <Badge texto={r.estado} />
                  </div>
                  <h3>{r.titulo}</h3>
                  <div className="request-meta">
                    <div><small>Categoría</small><span>{r.categoria || '—'}</span></div>
                    <div><small>Prioridad</small><Badge texto={r.prioridad || '—'} /></div>
                    <PlazoSolicitud solicitud={r} />
                  </div>
                  <Button
                    variant={isPrimaryAction(r) ? 'primary' : 'secondary'}
                    full
                    onClick={() => navigate(`/tecnico/atencion/${r.codigo}`)}
                  >
                    {getActionLabel(r)}
                  </Button>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="pagination">
          <span>Mostrando {filtered.length} de {misAsignaciones.length} asignaciones</span>
        </div>
      </section>
    </div>
  );
}
