import './tabla.css';
import Badge from './Badge';
import Button from './Button';
import Icon from './Icon';
import MenuAcciones from './MenuAcciones';
import { esVencida } from '../config/vigencia';

export default function RequestTable({
  requests = [],
  compact = false,
  onOpen,
  mostrarVencidas = false,
  getAcciones,
}) {
  const data = compact ? requests.slice(0, 3) : requests;

  const getInitials = (name) => {
    if (!name || name === 'Sin asignar') return '';
    return name
      .split(' ')
      .map((x) => x[0])
      .slice(0, 2)
      .join('');
  };

  const abrirFila = (e, code) => {
    if (e.target.closest('button, a, [role="menu"]')) return;
    onOpen && onOpen(code);
  };
  const teclaFila = (e, code) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter') { e.preventDefault(); onOpen && onOpen(code); }
  };
  const prioridadUi = (v) => (v ? <Badge texto={v} /> : <span className="sin-clasificar">Sin clasificar</span>);

  // Una acción principal compacta + el resto en el menú "⋯"
  const renderAcciones = (r, code) => {
    const { principal = null, menu = [] } = getAcciones ? getAcciones(r) : {};
    if (!getAcciones) {
      return (
        <button type="button" className="row-action" onClick={() => onOpen && onOpen(code)} aria-label={`Abrir ${code}`}>
          <Icon name="chevron" size={18} />
        </button>
      );
    }
    return (
      <div className="row-acciones">
        {principal && (
          <Button variant="primary" size="sm" onClick={principal.onClick}>{principal.label}</Button>
        )}
        <MenuAcciones etiqueta={`Más acciones de ${code}`} acciones={menu} />
      </div>
    );
  };

  return (
    <>
      <div className="desktop-table">
        <table>
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Prioridad</th>
              {!compact && <th>Responsable</th>}
              <th>
                <span className="sr-only">Acción</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => {
              const code = r.codigo || r.code;
              const title = r.titulo || r.title;
              const category = r.categoria || r.category;
              const status = r.estado || r.status;
              const priority = r.prioridad || r.priority;
              const owner = r.responsable || r.owner || 'Sin asignar';

              return (
                <tr
                  key={code}
                  className="fila-clicable"
                  tabIndex={0}
                  onClick={(e) => abrirFila(e, code)}
                  onKeyDown={(e) => teclaFila(e, code)}
                  aria-label={`Abrir ${code}: ${title}`}
                >
                  <td>
                    <button
                      type="button"
                      className="request-link"
                      onClick={() => onOpen && onOpen(code)}
                    >
                      <strong>{code}</strong>
                      <span>{title}</span>
                    </button>
                  </td>
                  <td>{category}</td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge texto={status} />
                      {mostrarVencidas && esVencida(r) && <Badge texto="Vencida" />}
                    </div>
                  </td>
                  <td>{prioridadUi(priority)}</td>
                  {!compact && (
                    <td>
                      <span className="owner">
                        {owner !== 'Sin asignar' && <i>{getInitials(owner)}</i>}
                        {owner}
                      </span>
                    </td>
                  )}
                  <td style={{ textAlign: 'right' }}>{renderAcciones(r, code)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards">
        {data.map((r) => {
          const code = r.codigo || r.code;
          const title = r.titulo || r.title;
          const category = r.categoria || r.category;
          const status = r.estado || r.status;
          const priority = r.prioridad || r.priority;
          const date = r.fecha || r.date;

          return (
            <article className="request-card" key={code}>
              <div className="request-card-head">
                <div>
                  <strong>{code}</strong>
                  {date && <span>{date}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Badge texto={status} />
                  {mostrarVencidas && esVencida(r) && <Badge texto="Vencida" />}
                </div>
              </div>
              <h3>{title}</h3>
              <div className="request-meta">
                <div>
                  <small>Categoría</small>
                  <span>{category}</span>
                </div>
                <div>
                  <small>Prioridad</small>
                  {prioridadUi(priority)}
                </div>
              </div>
              {getAcciones ? renderAcciones(r, code) : (
                <Button variant="secondary" full onClick={() => onOpen && onOpen(code)}>
                  Ver solicitud
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
