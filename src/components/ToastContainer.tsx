import type { ToastItem } from '../contexts/ToastContext';
import { Toast } from './Toast';
import '../styles/toast.css';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
