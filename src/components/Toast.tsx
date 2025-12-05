import type { ToastVariant } from '../contexts/ToastContext';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

export function Toast({ message, variant = 'info', onClose }: ToastProps) {
  return (
    <div className={`toast toast-${variant}`} role="status" aria-live="polite">
      <div className="toast__content">
        <span className="toast__icon" aria-hidden="true" />
        <span className="toast__message">{message}</span>
      </div>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        &times;
      </button>
    </div>
  );
}
