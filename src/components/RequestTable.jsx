import Badge from './Badge';
import Button from './Button';
import Icon from './Icon';

export default function RequestTable({ requests = [], compact = false, onOpen }) {
  const data = compact ? requests.slice(0, 3) : requests;

  const getInitials = (name) => {
    if (!name || name === 'Sin asignar') return '';
    return name
      .split(' ')
      .map((x) => x[0])
      .slice(0, 2)
      .join('');
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
                <tr key={code}>
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
                    <Badge texto={status} />
                  </td>
                  <td>
                    <Badge texto={priority} />
                  </td>
                  {!compact && (
                    <td>
                      <span className="owner">
                        {owner !== 'Sin asignar' && <i>{getInitials(owner)}</i>}
                        {owner}
                      </span>
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      className="row-action"
                      onClick={() => onOpen && onOpen(code)}
                      aria-label={`Abrir ${code}`}
                    >
                      <Icon name="chevron" size={18} />
                    </button>
                  </td>
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
                <Badge texto={status} />
              </div>
              <h3>{title}</h3>
              <div className="request-meta">
                <div>
                  <small>Categoría</small>
                  <span>{category}</span>
                </div>
                <div>
                  <small>Prioridad</small>
                  <Badge texto={priority} />
                </div>
              </div>
              <Button variant="secondary" full onClick={() => onOpen && onOpen(code)}>
                Ver solicitud
              </Button>
            </article>
          );
        })}
      </div>
    </>
  );
}
