import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSolicitudesMock } from '../mocks/solicitudes';
import { esVencida } from '../config/vigencia';
import { getSolicitudes } from '../services/solicitudes.js';
import { getCategorias, getPrioridades } from '../services/catalogos.js';
import { ESTADOS } from '../config/constants';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import FormSelect from '../components/FormSelect';
import RequestTable from '../components/RequestTable';
import Icon from '../components/Icon';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function BandejaSolicitudes() {
  const navigate = useNavigate();

  const [items,       setItems]       = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [loading,     setLoading]     = useState(!USE_MOCKS);
  const [error,       setError]       = useState('');

  const [query,          setQuery]          = useState('');
  const [estadoFilter,   setEstadoFilter]   = useState('');
  const [categoriaId,    setCategoriaId]    = useState('');
  const [prioridadId,    setPrioridadId]    = useState('');
  // "Solo vencidas" solo disponible en modo mocks (backend no tiene ese filtro)
  const [soloVencidas,   setSoloVencidas]   = useState(false);

  const [page, setPage]   = useState(0);
  const PAGE_SIZE          = 15;

  useEffect(() => {
    if (USE_MOCKS) {
      setItems(getSolicitudesMock());
      return;
    }
    setLoading(true);
    Promise.all([getSolicitudes(), getCategorias(), getPrioridades()])
      .then(([sols, cats, prios]) => {
        setItems(sols);
        setCategorias(cats);
        setPrioridades(prios);
      })
      .catch(err => setError(err.message ?? 'No se pudieron cargar las solicitudes.'))
      .finally(() => setLoading(false));
  }, []);

  // Recargar al cambiar filtros en modo real (enviamos filtros al servidor)
  useEffect(() => {
    if (USE_MOCKS || loading) return;
    setLoading(true);
    const params = {};
    if (estadoFilter) {
      // Convertir etiqueta UI → enum backend
      const mapUI = {
        'Registrada': 'REGISTRADA', 'En evaluación': 'EN_EVALUACION',
        'Asignada': 'ASIGNADA', 'En atención': 'EN_ATENCION',
        'Resuelta': 'RESUELTA', 'Cerrada': 'CERRADA',
      };
      params.estado = mapUI[estadoFilter] ?? estadoFilter;
    }
    if (query.trim())  params.texto       = query.trim();
    if (categoriaId)   params.categoriaId = categoriaId;
    if (prioridadId)   params.prioridadId = prioridadId;

    getSolicitudes(params)
      .then(sols => { setItems(sols); setPage(0); })
      .catch(err => setError(err.message ?? 'Error al filtrar.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFilter, categoriaId, prioridadId]);

  // Filtro local para texto en modo real, y todos los filtros en modo mocks
  const filtered = USE_MOCKS
    ? items.filter(r => {
        const matchEstado    = !estadoFilter || r.estado === estadoFilter;
        const matchCategoria = !categoriaId  || r.categoria === categoriaId;
        const matchPrioridad = !prioridadId  || r.prioridad === prioridadId;
        const matchVencida   = !soloVencidas || esVencida(r);
        const target = `${r.codigo} ${r.titulo} ${r.categoria} ${r.descripcion || ''}`.toLowerCase();
        const matchQuery = !query.trim() || target.includes(query.trim().toLowerCase());
        return matchEstado && matchCategoria && matchPrioridad && matchVencida && matchQuery;
      })
    : query.trim()
      ? items.filter(r => `${r.codigo} ${r.titulo} ${r.descripcion}`.toLowerCase().includes(query.trim().toLowerCase()))
      : items;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Acción contextual exclusiva para Supervisor según el estado de la solicitud
  const renderSupervisorAction = (r) => {
    const code = r.codigo || r.id;
    const e = r.estadoApi ?? (
      r.estado === 'Registrada'    ? 'REGISTRADA' :
      r.estado === 'En evaluación' ? 'EN_EVALUACION' :
      r.estado === 'Asignada'      ? 'ASIGNADA' :
      r.estado === 'En atención'   ? 'EN_ATENCION' :
      r.estado === 'Resuelta'      ? 'RESUELTA' :
      r.estado === 'Cerrada'       ? 'CERRADA' : r.estado
    );
    const sinResponsable = !r.responsableId || !r.responsable || r.responsable === 'Sin asignar';
    const estaClasificada = Boolean(
      (r.categoriaId && r.areaId) ||
      (r.categoria && r.categoria !== 'Sin categoría' && r.categoria !== '—')
    );

    // 1. Revisar y cerrar: si el técnico ya documentó la solución
    if (e === 'RESUELTA' || r.estado === 'Resuelta') {
      return (
        <Button
          variant="primary"
          style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
          onClick={() => navigate(`/supervisor/solicitudes/${code}/cerrar`)}
        >
          Revisar y cerrar
        </Button>
      );
    }

    // 2. Si está en REGISTRADA o EN_EVALUACION y NO tiene responsable
    if ((e === 'REGISTRADA' || e === 'EN_EVALUACION') && sinResponsable) {
      if (estaClasificada) {
        return (
          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              style={{ padding: '6px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
              onClick={() => navigate(`/supervisor/solicitudes/${code}/asignar`)}
            >
              Asignar
            </Button>
            <Button
              variant="secondary"
              style={{ padding: '6px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
              onClick={() => navigate(`/supervisor/solicitudes/${code}/clasificar`)}
            >
              Editar clasificación
            </Button>
          </div>
        );
      }
      return (
        <Button
          variant="primary"
          style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
          onClick={() => navigate(`/supervisor/solicitudes/${code}/clasificar`)}
        >
          Clasificar
        </Button>
      );
    }

    // 3. Cualquier otro estado (En atención, Cerrada, Asignada): ver detalle
    return (
      <Button
        variant="secondary"
        style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
        onClick={() => navigate(`/solicitudes/${code}`)}
      >
        Ver
      </Button>
    );
  };

  return (
    <div>
      <PageHead title="Solicitudes" text="Consulta, filtra y gestiona todas las solicitudes de servicio." />

      <section className="panel table-panel">
        <div className="filters filters-supervisor">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              placeholder="Buscar por código o descripción"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            />
          </label>

          <FormSelect
            label="Estado"
            value={estadoFilter}
            onChange={(v) => { setEstadoFilter(v); setPage(0); }}
            options={ESTADOS}
            placeholder="Todos los estados"
          />

          {/* Categoría: en mocks usa texto, en real usa id */}
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
                <select value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setPage(0); }}>
                  <option value="">Todas las categorías</option>
                  {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
                <Icon name="down" size={16} />
              </span>
            </label>
          )}

          {/* Prioridad */}
          {USE_MOCKS ? (
            <FormSelect
              label="Prioridad"
              value={prioridadId}
              onChange={(v) => { setPrioridadId(v); setPage(0); }}
              options={['Alta', 'Media', 'Baja']}
              placeholder="Todas"
            />
          ) : (
            <label className="field">
              <span className="field-label">Prioridad</span>
              <span className="select-wrap">
                <select value={prioridadId} onChange={(e) => { setPrioridadId(e.target.value); setPage(0); }}>
                  <option value="">Todas</option>
                  {prioridades.map(p => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
                </select>
                <Icon name="down" size={16} />
              </span>
            </label>
          )}

          {/* "Solo vencidas": solo visible en modo mocks (backend no soporta este filtro) */}
          {USE_MOCKS && (
            <label className={`filter-vencidas ${soloVencidas ? 'active' : ''}`}>
              <input type="checkbox" checked={soloVencidas} onChange={e => setSoloVencidas(e.target.checked)} />
              <span>Solo vencidas</span>
            </label>
          )}
        </div>

        {error && (
          <div className="message error" role="alert" style={{ marginBottom: '16px' }}>
            <Icon name="alert" /><div><strong>{error}</strong></div>
          </div>
        )}

        <div className="results-label">
          {filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'} · Ordenadas por más recientes
        </div>

        {loading ? (
          <p className="muted-note">Cargando solicitudes…</p>
        ) : (
          <RequestTable
            requests={paged}
            onOpen={(code) => navigate(`/solicitudes/${code}`)}
            renderAction={renderSupervisorAction}
          />
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
