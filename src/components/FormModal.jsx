import { useState, useEffect } from 'react';
import Icon from './Icon';
import ConfirmModal from './ConfirmModal';

export default function FormModal({
  isOpen = true,
  title,
  onClose,
  hasChanges = false,
  isSubmitting = false,
  onSubmit,
  children,
  actions,
}) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Cierre controlado: verifica cambios y estado de guardado
  const requestClose = () => {
    if (isSubmitting) return; // Mientras se guarda no se puede cerrar
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Escuchar la tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
          return;
        }
        requestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDiscardConfirm, hasChanges, isSubmitting]);

  if (!isOpen) return null;

  const content = typeof children === 'function' ? children({ requestClose }) : children;
  const renderedActions = typeof actions === 'function' ? actions({ requestClose }) : actions;

  return (
    <>
      {/* El clic en el fondo (.modal-form-layer) NO cierra el modal */}
      <div
        className="modal-form-layer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
      >
        <div className="modal-form" onClick={(e) => e.stopPropagation()}>
          <div className="modal-form-head">
            <h3 id="form-modal-title">{title}</h3>
            <button
              type="button"
              className="modal-form-close"
              onClick={requestClose}
              disabled={isSubmitting}
              aria-label="Cerrar modal"
              title="Cerrar"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {onSubmit ? (
            <form
              onSubmit={onSubmit}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}
            >
              <div className="modal-form-body">{content}</div>
              {renderedActions && <div className="modal-form-footer">{renderedActions}</div>}
            </form>
          ) : (
            <>
              <div className="modal-form-body">{content}</div>
              {renderedActions && <div className="modal-form-footer">{renderedActions}</div>}
            </>
          )}
        </div>
      </div>

      {/* Confirmación antes de descartar cambios no guardados */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="¿Descartar los cambios?"
        message="Hay cambios sin guardar. Si cierras ahora, se perderán las modificaciones realizadas."
        confirmText="Descartar"
        cancelText="Seguir editando"
        isDestructive={true}
        cancelVariant="primary"
        confirmVariant="danger"
        icon="alert"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
