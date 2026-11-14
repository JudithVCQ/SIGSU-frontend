/**
 * Header.jsx — Barra superior: muestra la ruta de navegación de la página actual.
 * El usuario, cerrar sesión y notificaciones están en el sidebar.
 */
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { migasDePan } from '../routes/migas';

export default function Header({ rol }) {
  const { pathname, search } = useLocation();
  const migas = migasDePan(pathname, search, rol);

  return (
    <header className="topbar">
      <nav aria-label="Ruta de navegación" className="migas">
        <ol>
          {migas.map((m, i) => {
            const ultima = i === migas.length - 1;
            const clase = `migas-item${m.codigo ? ' migas-codigo' : ''}`;
            return (
              <Fragment key={`${i}-${m.label}`}>
                {i > 0 && <li className="migas-sep" aria-hidden="true">›</li>}
                <li className={clase}>
                  {ultima || !m.to ? (
                    <span aria-current={ultima ? 'page' : undefined}>{m.label}</span>
                  ) : (
                    <Link to={m.to}>{m.label}</Link>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}
