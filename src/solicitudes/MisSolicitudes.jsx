import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESTADOS, PRIORIDADES } from '../config/constants';
import { getSolicitudesMock } from '../mocks/solicitudes';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import FormSelect from '../components/FormSelect';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import './solicitudes.css';

export default function MisSolicitudes() {
  const navigate = useNavigate();
  const items = getSolicitudesMock();

  const [query, setQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');

  const filtered = items.filter((r) => {
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

  return (
    <div>
      <PageHead
        title="Mis solicitudes"
        text="Consulta el estado de todo lo que has registrado."
        action={
          <Button icon="plus" onClick={() => navigate('/solicitante/nueva')}>
            Nueva solicitud
          </Button>
        }
      />

      <section className="panel table-panel">
        <div className="filters filters-3">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label="Buscar solicitudes"
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
          {filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'} · Más recientes
          primero
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <Icon name="search" size={28} />
            <strong>No hay solicitudes con estos filtros</strong>
            <p>Prueba con otra búsqueda o limpia los filtros.</p>
            <Button variant="secondary" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="desktop-table">
              <table className="req-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Fecha</th>
                    <th>
                      <span className="sr-only">Acción</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.codigo}>
                      <td>
                        <div className="request-link static">
                          <strong>{r.codigo}</strong>
                          <span>{r.titulo}</span>
                        </div>
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
                          variant="secondary"
                          onClick={() => navigate(`/solicitudes/${r.codigo}`)}
                        >
                          Ver
                          <span className="sr-only"> {r.codigo}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards">
              {filtered.map((r) => (
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
                    variant="secondary"
                    full
                    onClick={() => navigate(`/solicitudes/${r.codigo}`)}
                  >
                    Ver
                  </Button>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="pagination">
          <span>
            Mostrando {filtered.length} de {items.length}
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
