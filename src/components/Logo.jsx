export default function Logo({ compact = false, subtitulo = true }) {
  return (
    <div className="logo">
      <div className="logo-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {!compact && (
        <div>
          <b>SIGSU</b>
          {subtitulo && <small>Gestión universitaria</small>}
        </div>
      )}
    </div>
  );
}
