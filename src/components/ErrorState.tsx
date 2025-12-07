import type { ReactNode } from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
  description?: ReactNode;
}

export function ErrorState({
  message = 'Something went wrong',
  description,
  onRetry,
  actionLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <div
      className="error-state w-full max-w-xl text-center border rounded-xl px-6 py-8 flex flex-col items-center gap-3 mx-auto"
      style={{
        backgroundColor: 'var(--page-bg-elevated)',
        borderColor: 'var(--page-border)',
        color: 'var(--page-text-primary)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
      }}
      role="alert"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          color: '#ef4444',
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }}
        aria-hidden="true"
      >
        ⚠️
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold" style={{ color: 'var(--page-text-primary)' }}>
          {message}
        </p>
        {description ? (
          <div className="text-sm leading-relaxed" style={{ color: 'var(--page-text-secondary)' }}>
            {description}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>
            Please check your connection and try again.
          </p>
        )}
      </div>
      <a
        href="https://github.com/CynaCons/powertimeline/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-purple-400 hover:text-purple-300 underline"
      >
        Report this issue on GitHub
      </a>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded-lg font-medium transition-colors border"
          style={{
            backgroundColor: 'var(--page-accent)',
            color: '#fff',
            borderColor: 'var(--page-accent)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--page-accent-hover)';
            e.currentTarget.style.borderColor = 'var(--page-accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--page-accent)';
            e.currentTarget.style.borderColor = 'var(--page-accent)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
