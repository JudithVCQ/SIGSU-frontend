import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSolicitudesMock } from '../mocks/solicitudes';
import { getSolicitudes } from '../services/solicitudes.js';
import { getCategorias, getPrioridades } from '../services/catalogos.js';
import { ESTADOS } from '../config/constants';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import FormSelect from '../components/FormSelect';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function MisSolicitudes() {
  const navigate = useNavigate();

  const [items,      setItems]      = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [prioridades,setPrioridades]= useState([]);
  const [loading,    setLoading]    = useState(!USE_MOCKS);
  const [error,      setError]      = useState('');

  // Filtros
  const [query,          setQuery]          = useState('');
  const [estadoFilter,   setEstadoFilter]   = useState('');
  const [categoriaId,    setCategoriaId]    = useState('');
  const [prioridadId,    setPrioridadId]    = useState('');

  useEffect(() => {
    if (USE_MOCKS) {
      setItems(getSolicitudesMock());
      return;
    }
    setLoading(true);
    Promise.all([
      getSolicitudes(),
      getCategorias(),
      getPrioridades(),
    ])
      .then(([sols, cats, prios]) => {
        setItems(sols);
        setCategorias(cats);
        setPrioridades(prios);
      })
      .catch(err => setError(err.message ?? 'No se pudieron cargar las solicitudes.'))
      .finally(() => setLoading(false));
  }, []);

  // Paginación cliente
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const filtered = items.filter((r) => {
    const matchEstado     = !estadoFilter || r.estado === estadoFilter;
    const matchCategoria  = !categoriaId
      || String(r.categoriaId) === categoriaId
      || r.categoria === categorias.find(c => String(c.id) === categoriaId)?.nombre;
    const matchPrioridad  = !prioridadId
      || String(r.prioridadId) === prioridadId
      || r.prioridad === prioridades.find(p => String(p.id) === prioridadId)?.nombre;
    const target = `${r.codigo} ${r.titulo} ${r.categoria} ${r.ubicacion || ''}`.toLowerCase();
    const matchQuery      = !query.trim() || target.includes(query.trim().toLowerCase());
    return matchEstado && matchCategoria && matchPrioridad && matchQuery;
  });

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paged       = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setQuery(''); setEstadoFilter(''); setCategoriaId(''); setPrioridadId(''); setPage(0);
  };

  // Opciones para los selects
  const catOptions  = USE_MOCKS ? [] : categorias.map(c => ({ label: c.nombre, value: String(c.id) }));

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
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            />
          </label>

          {/* Filtro de estado: usa los valores UI de ESTADOS */}
          <FormSelect
            label="Estado"
            value={estadoFilter}
            onChange={(v) => { setEstadoFilter(v); setPage(0); }}
            options={ESTADOS}
            placeholder="Todos los estados"
          />

          {/* Filtro de categoría: en mocks muestra texto, en real usa id */}
          {USE_MOCKS ? (
            <FormSelect
              label="Categoría"
              value={categoriaId}
              onChange={(v) => { setCategoriaId(v); setPage(0); }}
              options={['Mantenimiento', 'Soporte informático', 'Infraestructura', 'Trámites']}
              placeholder="Todas las categorías"
            />
          ) : (
            <label className="field">
              <span className="field-label">Categoría</span>
              <span className="select-wrap">
                <select
                  value={categoriaId}
                  onChange={(e) => { setCategoriaId(e.target.value); setPage(0); }}
                >
                  <option value="">Todas las categorías</option>
                  {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Icon name="down" size={16} />
              </span>
            </label>
          )}
        </div>

        {error && (
          <div className="message error" role="alert" style={{ marginBottom: '16px' }}>
            <Icon name="alert" />
            <div><strong>{error}</strong></div>
          </div>
        )}

        <div className="results-label">
          {filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'} · Más recientes primero
        </div>

        {loading ? (
          <p className="muted-note">Cargando solicitudes…</p>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <Icon name="search" size={28} />
            <strong>No hay solicitudes con estos filtros</strong>
            <p>Prueba con otra búsqueda o limpia los filtros.</p>
            <Button variant="secondary" onClick={clearFilters}>Limpiar filtros</Button>
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
                    <th><span className="sr-only">Acción</span></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.codigo || r.id}>
                      <td>
                        <div className="request-link static">
                          <strong>{r.codigo}</strong>
                          <span>{r.titulo}</span>
                        </div>
                      </td>
                      <td>{r.categoria || '—'}</td>
                      <td><Badge texto={r.estado} /></td>
                      <td><Badge texto={r.prioridad || '—'} /></td>
                      <td>{r.fecha}</td>
                      <td className="act">
                        <Button variant="secondary" onClick={() => navigate(`/solicitudes/${r.codigo}`)}>
                          Ver<span className="sr-only"> {r.codigo}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards">
              {paged.map((r) => (
                <article className="request-card" key={r.codigo || r.id}>
                  <div className="request-card-head">
                    <div>
                      <strong>{r.codigo}</strong>
                      <span>{r.fecha}</span>
                    </div>
                    <Badge texto={r.estado} />
                  </div>
                  <h3>{r.titulo}</h3>
                  <div className="request-meta">
                    <div><small>Categoría</small><span>{r.categoria || '—'}</span></div>
                    <div><small>Prioridad</small><Badge texto={r.prioridad || '—'} /></div>
                  </div>
                  <Button variant="secondary" full onClick={() => navigate(`/solicitudes/${r.codigo}`)}>
                    Ver
                  </Button>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="pagination">
          <span>Mostrando {paged.length} de {filtered.length}</span>
          <div>
            <Button variant="secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Anterior
            </Button>
            <Button variant="secondary" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              Siguiente
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
