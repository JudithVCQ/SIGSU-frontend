/**
 * AuthShell.jsx — Estructura de las pantallas de acceso: dos columnas.
 * Izquierda: presentación del sistema (en móvil se apila y se oculta la tarjeta de ejemplo).
 * Derecha: formulario en una tarjeta blanca.
 */
import Logo from '../components/Logo';
import './auth.css';

const PASOS = [
  { titulo: 'Registra tu solicitud', texto: 'Cuenta qué ocurre y dónde, con evidencia si la tienes.' },
  { titulo: 'Sigue su avance', texto: 'Mira en qué estado va y quién la atiende.' },
  { titulo: 'Califica la atención', texto: 'Cuando se resuelva, dinos cómo te fue.' },
];

// Ejemplo ilustrativo: 6 etapas del ciclo de una solicitud, 4 completadas
const SEGMENTOS = 6;
const COMPLETADOS = 4;

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        {/* Decoración (aria-hidden): línea punteada que une tres círculos, todo en % del panel */}
        <div className="auth-decoracion" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            <path className="auth-linea" d="M25 86 C 10 74, 80 68, 62 52 S 20 30, 40 14" />
          </svg>
          <span className="auth-circulo" style={{ left: '25%', top: '86%' }} />
          <span className="auth-circulo" style={{ left: '62%', top: '52%' }} />
          <span className="auth-circulo auth-circulo-final" style={{ left: '40%', top: '14%' }} />
        </div>

        <div className="auth-contenido">
          <Logo />

          <div className="auth-pitch">
            <h2 className="auth-titulo">Reporta, sigue y resuelve lo que pasa en el campus.</h2>
            <p className="auth-subtitulo">
              Sistema Integrado de Gestión de Solicitudes Universitarias: un solo lugar para pedir ayuda y saber en qué va tu pedido.
            </p>

            <ol className="auth-pasos">
              {PASOS.map((p, i) => (
                <li key={p.titulo}>
                  <span className="auth-paso-num" aria-hidden="true">{i + 1}</span>
                  <div>
                    <strong>{p.titulo}</strong>
                    <span>{p.texto}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <figure className="auth-ejemplo" aria-label="Ejemplo ilustrativo de una solicitud en curso">
            <div className="auth-ejemplo-cabecera">
              <span className="auth-ejemplo-codigo">SOL-2026-000011</span>
              <span className="auth-ejemplo-estado">En atención</span>
            </div>
            <div className="auth-ejemplo-titulo">Proyector sin señal en Aula 205</div>
            <div className="auth-ejemplo-barra" aria-hidden="true">
              {Array.from({ length: SEGMENTOS }, (_, i) => (
                <i key={i} className={i < COMPLETADOS ? 'completo' : ''} />
              ))}
            </div>
            <div className="auth-ejemplo-datos">
              <span>Técnico: Diego Morales</span>
              <span>Plazo: 2 días</span>
            </div>
            <figcaption className="auth-ejemplo-nota">Ejemplo ilustrativo</figcaption>
          </figure>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
