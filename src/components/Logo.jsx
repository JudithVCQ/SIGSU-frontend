/**
 * Logo.jsx — Logo "Ruta": cuadrado redondeado guinda con tres puntos blancos unidos por una
 * línea diagonal ascendente; el último punto es dorado y lleva un check oscuro.
 * Se usa en el sidebar y en el login.
 */
export function LogoMarca({ size = 36 }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 36 36"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="logo-fondo" width="36" height="36" rx="10" />
      <path className="logo-linea" d="M9 26 L18 18 L27 10" />
      <circle className="logo-punto" cx="9" cy="26" r="3" />
      <circle className="logo-punto" cx="18" cy="18" r="3" />
      <circle className="logo-punto-final" cx="27" cy="10" r="5.2" />
      <path className="logo-check" d="M24.6 10.2 l1.8 1.8 l3.2 -3.6" />
    </svg>
  );
}

export default function Logo({ compact = false, subtitulo = true }) {
  return (
    <div className="logo">
      <LogoMarca />
      {!compact && (
        <div>
          <b>SIGSU</b>
          {subtitulo && <small>Gestión de solicitudes universitarias</small>}
        </div>
      )}
    </div>
  );
}
