import { CATEGORIAS } from '../config/constants';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import './auth.css';

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="auth-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <Logo />
        <div className="auth-pitch">
          <div className="eyebrow">PORTAL DEL SOLICITANTE</div>
          <h2>Un solo lugar para los servicios del campus.</h2>
          <ul>
            {CATEGORIAS.map((cat) => (
              <li key={cat}>
                <Icon name="check" size={16} />
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>
        <small className="auth-foot">
          Sistema Integrado de Gestión de Solicitudes Universitarias
        </small>
      </aside>
      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
