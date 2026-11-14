/**
 * Sidebar.jsx — Navegación lateral (escritorio). En móvil se oculta y se usa BottomNav.
 *
 * - Arriba: logo + "SIGSU" y un botón (solo ícono) para contraer/expandir.
 * - Secciones "General" (opciones del rol) y "Vistas rápidas" (listas filtradas por ?vista=).
 * - Contadores de vistas rápidas: una sola llamada al montar (la misma que hace la lista);
 *   si falla, no se muestran.
 * - Abajo: el usuario (nombre corto, rol) con cerrar sesión.
 * - Contraído: solo íconos; el nombre aparece como tooltip al pasar el mouse o con el foco.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ROLE_LABEL, ROLES } from '../config/constants';
import { nombreCorto, iniciales } from '../config/usuario';
import { VISTAS_RAPIDAS, rutaDeVista, contarPorVista, cargarListaBase } from '../routes/vistasRapidas';
import Icon from './Icon';
import Logo from './Logo';

function ItemNav({ to, icon, label, activo, contraido, contador }) {
  const tooltip = contador != null ? `${label} (${contador})` : label;
  return (
    <Link
      to={to}
      className={`nav-item${activo ? ' active' : ''}`}
      aria-current={activo ? 'page' : undefined}
      data-tooltip={contraido ? tooltip : undefined}
    >
      {icon && <Icon name={icon} />}
      <span className="nav-label">{label}</span>
      {contador != null && (
        <span className="nav-count">
          {contador}
          <span className="sr-only"> solicitudes</span>
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ user, items = [], logout, contraido = false, onAlternar }) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const vistaActual = searchParams.get('vista');
  const rol = user?.rol;
  const configVistas = VISTAS_RAPIDAS[rol];

  // Contadores: una sola llamada al montar (misma llamada que la lista del rol)
  const [conteos, setConteos] = useState(null);
  useEffect(() => {
    if (!configVistas) return undefined;
    let vigente = true;
    cargarListaBase(user)
      .then((lista) => { if (vigente) setConteos(contarPorVista(rol, lista)); })
      .catch(() => { if (vigente) setConteos(null); });
    return () => { vigente = false; };
    // Solo al montar o si cambia el usuario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol, user?.id]);

  const principal = items.find((i) => i.principal);
  const generales = items.filter((i) => !i.principal);
  const esActivoGeneral = (to) =>
    pathname === to && !(configVistas && to === configVistas.ruta && vistaActual);

  return (
    <aside className={`sidebar${contraido ? ' contraido' : ''}`}>
      <div className="sidebar-top">
        <Logo compact={contraido} subtitulo={false} />
        <button
          type="button"
          className="icon-button dark sidebar-toggle"
          aria-label={contraido ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          aria-expanded={!contraido}
          aria-controls="sidebar-navegacion"
          data-tooltip={contraido ? 'Expandir menú' : undefined}
          onClick={onAlternar}
        >
          <Icon name={contraido ? 'chevron' : 'arrow'} size={18} />
        </button>
      </div>

      {principal && (
        <Link
          to={principal.to}
          className={`btn btn-primary sidebar-cta${pathname === principal.to ? ' active' : ''}`}
          data-tooltip={contraido ? principal.label : undefined}
        >
          <Icon name={principal.icon || 'plus'} size={18} />
          <span className="nav-label">{principal.label}</span>
        </Link>
      )}

      <nav id="sidebar-navegacion" className="sidebar-nav" aria-label="Navegación principal">
        <div className="sidebar-seccion" role="group" aria-labelledby="sidebar-sec-general">
          <div className="role-label" id="sidebar-sec-general">General</div>
          <div className="nav-list">
            {generales.map((item) => (
              <ItemNav
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                activo={esActivoGeneral(item.to)}
                contraido={contraido}
              />
            ))}
          </div>
        </div>

        {configVistas && (
          <div className="sidebar-seccion" role="group" aria-labelledby="sidebar-sec-vistas">
            <div className="role-label" id="sidebar-sec-vistas">Vistas rápidas</div>
            <div className="nav-list">
              {configVistas.vistas.map((v) => (
                <ItemNav
                  key={v.id}
                  to={rutaDeVista(rol, v.id)}
                  icon={v.icon}
                  label={v.label}
                  activo={pathname === configVistas.ruta && vistaActual === v.id}
                  contraido={contraido}
                  contador={conteos ? conteos[v.id] : null}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-profile">
          <div className={`avatar ${rol !== ROLES.SOLICITANTE ? 'staff' : ''}`} aria-hidden="true">
            {iniciales(user)}
          </div>
          <div className="sidebar-profile-datos">
            <strong title={user?.nombre || undefined}>{nombreCorto(user)}</strong>
            <small title={ROLE_LABEL[rol] || rol}>{ROLE_LABEL[rol] || rol}</small>
          </div>
          <button
            type="button"
            className="icon-button dark sidebar-salir"
            aria-label="Cerrar sesión"
            data-tooltip={contraido ? 'Cerrar sesión' : undefined}
            onClick={logout}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
