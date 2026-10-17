import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESTADOS, CATEGORIAS, PRIORIDADES } from '../config/constants';
import { getSolicitudesMock } from '../mocks/solicitudes';
import { esVencida } from '../config/vigencia';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import FormSelect from '../components/FormSelect';
import RequestTable from '../components/RequestTable';
import Icon from '../components/Icon';
import './solicitudes.css';

export default function BandejaSolicitudes() {
  const navigate = useNavigate();
  const items = getSolicitudesMock();

  const [query, setQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');
  const [soloVencidas, setSoloVencidas] = useState(false);

  const filtered = items.filter((r) => {
    const matchesEstado = !estadoFilter || r.estado === estadoFilter;
    const matchesCategoria = !categoriaFilter || r.categoria === categoriaFilter;
    const matchesPrioridad = !prioridadFilter || r.prioridad === prioridadFilter;
    const matchesVencida = !soloVencidas || esVencida(r);
    const searchTarget = `${r.codigo} ${r.titulo} ${r.categoria} ${r.descripcion || ''}`.toLowerCase();
    const matchesQuery = !query.trim() || searchTarget.includes(query.trim().toLowerCase());
    return matchesEstado && matchesCategoria && matchesPrioridad && matchesVencida && matchesQuery;
  });

  return (
    <div>
      <PageHead
        title="Solicitudes"
        text="Consulta, filtra y gestiona todas las solicitudes de servicio."
      />

      <section className="panel table-panel">
        <div className="filters filters-supervisor">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              placeholder="Buscar por código o descripción"
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
            label="Categoría"
            value={categoriaFilter}
            onChange={setCategoriaFilter}
            options={CATEGORIAS}
            placeholder="Todas las categorías"
          />
          <FormSelect
            label="Prioridad"
            value={prioridadFilter}
            onChange={setPrioridadFilter}
            options={PRIORIDADES}
            placeholder="Todas"
          />
          <label className={`filter-vencidas ${soloVencidas ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={soloVencidas}
              onChange={(e) => setSoloVencidas(e.target.checked)}
            />
            <span>Solo vencidas</span>
          </label>
        </div>

        <div className="results-label">
          {filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'} · Ordenadas por
          más recientes
        </div>

        <RequestTable
          mostrarVencidas
          requests={filtered}
          onOpen={(code) => navigate(`/solicitudes/${code}`)}
        />

        <div className="pagination">
          <span>
            Mostrando 1–{filtered.length} de {items.length}
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
