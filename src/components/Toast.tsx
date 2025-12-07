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
        <div className="toast__body">
          <span className="toast__message">{message}</span>
          {variant === 'error' && (
            <a
              href="https://github.com/CynaCons/powertimeline/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="toast__issue-link"
            >
              Report this issue on GitHub
            </a>
          )}
        </div>
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
