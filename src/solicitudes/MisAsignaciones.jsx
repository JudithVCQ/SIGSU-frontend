import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ESTADOS, PRIORIDADES } from '../config/constants';
import { getSolicitudesMock } from '../mocks/solicitudes';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';
import FormSelect from '../components/FormSelect';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import './solicitudes.css';

export default function MisAsignaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allSolicitudes = getSolicitudesMock();

  // Filtrar solo las asignadas al técnico autenticado
  const misAsignaciones = allSolicitudes.filter(
    (r) => r.responsable && r.responsable === user?.nombre
  );

  const [query, setQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');

  // Métricas para KPIs del técnico
  const asignadasCount = misAsignaciones.filter((r) => r.estado === 'Asignada').length;
  const enAtencionCount = misAsignaciones.filter((r) => r.estado === 'En atención').length;
  const resueltasCount = misAsignaciones.filter((r) => r.estado === 'Resuelta').length;

  const filtered = misAsignaciones.filter((r) => {
    const matchesEstado = !estadoFilter || r.estado === estadoFilter;
    const matchesPrioridad = !prioridadFilter || r.prioridad === prioridadFilter;
    const searchTarget = `${r.codigo} ${r.titulo} ${r.categoria} ${r.ubicacion || ''}`.toLowerCase();
    const matchesQuery = !query.trim() || searchTarget.includes(query.trim().toLowerCase());
    return matchesEstado && matchesPrioridad && matchesQuery;
  });

  const handleClearFilters = () => {
    setQuery('');
    setEstadoFilter('');
    setPrioridadFilter('');
  };

  const getActionLabel = (estado) => {
    if (estado === 'Asignada') return 'Iniciar atención';
    if (estado === 'En atención') return 'Atender';
    return 'Ver detalle';
  };

  return (
    <div>
      <PageHead
        eyebrow="ESPACIO TÉCNICO"
        title={`Asignaciones de ${user?.nombre ? user.nombre.split(' ')[0] : 'Diego'}`}
        text="Gestiona tus órdenes de trabajo asignadas, registra avances y soluciones técnicas."
      />

      {/* Métricas KPI del técnico */}
      <div className="kpi-grid">
        <KpiCard
          icon="clock"
          number={String(asignadasCount)}
          label="Asignadas"
          change="Pendientes de iniciar"
        />
        <KpiCard
          icon="layers"
          tone="dark"
          number={String(enAtencionCount)}
          label="En atención"
          change="Trabajos en curso"
        />
        <KpiCard
          icon="check"
          tone="gold"
          number={String(resueltasCount)}
          label="Resueltas por mí"
          change="Completadas recientemente"
        />
      </div>

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
          <FormSelect
            label="Estado"
            value={estadoFilter}
            onChange={setEstadoFilter}
            options={ESTADOS}
            placeholder="Todos los estados"
          />
          <FormSelect
            label="Prioridad"
            value={prioridadFilter}
            onChange={setPrioridadFilter}
            options={PRIORIDADES}
            placeholder="Todas las prioridades"
          />
        </div>

        <div className="results-label">
          {filtered.length} {filtered.length === 1 ? 'asignación' : 'asignaciones'} · Ordenadas
          por prioridad y fecha
        </div>

        {misAsignaciones.length === 0 ? (
          <div className="empty">
            <Icon name="check" size={28} />
            <strong>No tienes solicitudes asignadas</strong>
            <p>Cuando el supervisor derive una solicitud a tu nombre, aparecerá en esta lista.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <Icon name="search" size={28} />
            <strong>No hay asignaciones con estos filtros</strong>
            <p>Prueba con otros términos de búsqueda o limpia los filtros activos.</p>
            <Button variant="secondary" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            {/* Tabla de escritorio */}
            <div className="desktop-table">
              <table className="req-table">
                <thead>
                  <tr>
                    <th>Solicitud</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isPendingOrActive = r.estado === 'Asignada' || r.estado === 'En atención';
                    return (
                      <tr key={r.codigo}>
                        <td>
                          <button
                            type="button"
                            className="request-link"
                            onClick={() => navigate(`/solicitudes/${r.codigo}`)}
                          >
                            <strong>{r.codigo}</strong>
                            <span>{r.titulo}</span>
                          </button>
                        </td>
                        <td>{r.categoria}</td>
                        <td>
                          <Badge texto={r.estado} />
                        </td>
                        <td>
                          <Badge texto={r.prioridad} />
                        </td>
                        <td>{r.fecha}</td>
                        <td className="act">
                          <Button
                            variant={isPendingOrActive ? 'primary' : 'secondary'}
                            onClick={() => navigate(`/tecnico/atencion/${r.codigo}`)}
                          >
                            {getActionLabel(r.estado)}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tarjetas móviles (< 720 px) */}
            <div className="mobile-cards">
              {filtered.map((r) => {
                const isPendingOrActive = r.estado === 'Asignada' || r.estado === 'En atención';
                return (
                  <article className="request-card" key={r.codigo}>
                    <div className="request-card-head">
                      <div>
                        <strong>{r.codigo}</strong>
                        <span>{r.fecha}</span>
                      </div>
                      <Badge texto={r.estado} />
                    </div>
                    <h3>{r.titulo}</h3>
                    <div className="request-meta">
                      <div>
                        <small>Categoría</small>
                        <span>{r.categoria}</span>
                      </div>
                      <div>
                        <small>Prioridad</small>
                        <Badge texto={r.prioridad} />
                      </div>
                    </div>
                    <Button
                      variant={isPendingOrActive ? 'primary' : 'secondary'}
                      full
                      onClick={() => navigate(`/tecnico/atencion/${r.codigo}`)}
                    >
                      {getActionLabel(r.estado)}
                    </Button>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <div className="pagination">
          <span>
            Mostrando {filtered.length} de {misAsignaciones.length} asignaciones
          </span>
          <div>
            <Button variant="secondary">Anterior</Button>
            <Button variant="secondary">Siguiente</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
