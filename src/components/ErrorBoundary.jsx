/**
 * ErrorBoundary.jsx — Red de seguridad global: si un componente falla al renderizar,
 * muestra "Algo salió mal" con las opciones Recargar / Ir al inicio.
 * No usa el router a propósito: debe funcionar aunque el fallo venga de él.
 */
import { Component } from 'react';
import Button from './Button';
import Icon from './Icon';
import './estados.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { falló: false };
  }

  static getDerivedStateFromError() {
    return { falló: true };
  }

  componentDidCatch() {
    // Sin console.log: el detalle técnico no se muestra ni se registra con datos del usuario.
  }

  render() {
    if (!this.state.falló) return this.props.children;
    return (
      <div className="pagina-error pagina-error-completa" role="alert">
        <span className="estado-icono estado-icono-error" aria-hidden="true"><Icon name="alert" size={28} /></span>
        <h1>Algo salió mal</h1>
        <p>Ocurrió un problema inesperado. Puedes recargar la página o volver al inicio.</p>
        <div className="pagina-error-acciones">
          <Button onClick={() => window.location.reload()}>Recargar</Button>
          <Button variant="secondary" onClick={() => window.location.assign('/')}>Ir al inicio</Button>
        </div>
      </div>
    );
  }
}
