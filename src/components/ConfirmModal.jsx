import Button from './Button';
import Icon from './Icon';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = true,
  icon = 'alert',
  cancelVariant = 'secondary',
  confirmVariant,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-layer"
      style={{ zIndex: 1100 }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <Icon name={icon} size={24} />
        </div>
        <h3 id="modal-title">{title}</h3>
        {message && <p>{message}</p>}
        <div className="modal-actions">
          <Button variant={cancelVariant} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant || (isDestructive ? 'danger' : 'primary')} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
