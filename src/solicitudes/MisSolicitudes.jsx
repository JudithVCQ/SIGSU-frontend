import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSolicitudesMock } from '../mocks/solicitudes';
import { getSolicitudes } from '../services/solicitudes.js';
import { getCategorias, getPrioridades } from '../services/catalogos.js';
import { ESTADOS, ROLES } from '../config/constants';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import FormSelect from '../components/FormSelect';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import Pagination, { usePaginacion } from '../components/Pagination';
import { SkeletonFilas } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import VistaRapidaChip from '../components/VistaRapidaChip';
import { buscarVista } from '../routes/vistasRapidas';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function MisSolicitudes() {
  const navigate = useNavigate();
  // Vista rápida (?vista=) elegida desde el sidebar
  const [searchParams, setSearchParams] = useSearchParams();
  const vista = buscarVista(ROLES.SOLICITANTE, searchParams.get('vista'));
  const quitarVista = () => setSearchParams((p) => {
    const n = new URLSearchParams(p);
    n.delete('vista');
    return n;
  });

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

  const cargar = useCallback(() => {
    if (USE_MOCKS) {
      setItems(getSolicitudesMock());
      return;
    }
    setLoading(true);
    setError('');
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
      .catch(() => setError('No pudimos cargar tus solicitudes. Revisa tu conexión e inténtalo de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtered = items.filter((r) => (vista ? vista.filtro(r) : true)).filter((r) => {
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

  // Paginación (10 por página); vuelve a la primera al cambiar la vista rápida
  const { pagina: page, setPagina: setPage, items: paged } = usePaginacion(filtered, vista?.id ?? '');

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

        {vista && <VistaRapidaChip etiqueta={vista.label} onQuitar={quitarVista} />}
        <div className="tabla-encabezado">
          <div className="results-label">
            {filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'} · Más recientes primero
          </div>
          <Pagination pagina={page} total={filtered.length} onChange={setPage} posicion="arriba" />
        </div>

        {loading ? (
          <SkeletonFilas filas={5} columnas={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={cargar} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Aún no has registrado solicitudes"
            text="Cuando registres una, podrás seguir su avance desde aquí."
            action={<Button icon="plus" onClick={() => navigate('/solicitante/nueva')}>Nueva solicitud</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No hay solicitudes con estos filtros"
            text="Prueba con otra búsqueda o limpia los filtros."
            action={<Button variant="secondary" onClick={clearFilters}>Limpiar filtros</Button>}
          />
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
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/solicitudes/${r.codigo}`)}>
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

        <Pagination pagina={page} total={filtered.length} onChange={setPage} posicion="abajo" />
      </section>
    </div>
  );
}
