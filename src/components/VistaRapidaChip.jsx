import Icon from './Icon';

/** Indica qué vista rápida está aplicada a una lista y permite quitarla. */
export default function VistaRapidaChip({ etiqueta, onQuitar }) {
  return (
    <div className="vista-chip">
      <span>
        Vista rápida: <strong>{etiqueta}</strong>
      </span>
      <button type="button" className="vista-chip-quitar" onClick={onQuitar} aria-label={`Quitar la vista rápida ${etiqueta}`}>
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
