/**
 * ApiTokenRevealDialog - Show-once modal for newly generated API tokens
 * Displays the raw token with copy-to-clipboard functionality.
 * Cannot be dismissed via backdrop click or Escape — user must explicitly confirm.
 */

import { useState } from 'react';

interface ApiTokenRevealDialogProps {
  token: string;
  onDismiss: () => void;
}

export function ApiTokenRevealDialog({ token, onDismiss }: ApiTokenRevealDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text for manual copy
      const input = document.getElementById('api-token-value') as HTMLInputElement;
      input?.select();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-dialog-title"
        className="border rounded-xl p-6 max-w-lg w-full"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2
          id="token-dialog-title"
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--page-text-primary)' }}
        >
          API Token Generated
        </h2>

        <div
          className="border rounded-lg p-3 mb-4"
          style={{
            backgroundColor: 'var(--page-bg)',
            borderColor: 'var(--color-danger)',
          }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-danger)' }}>
            Copy this token now. It will not be shown again.
          </p>
          <p className="text-xs" style={{ color: 'var(--page-text-secondary)' }}>
            Store it securely — anyone with this token can modify your timelines.
          </p>
        </div>

        <div className="mb-4">
          <input
            id="api-token-value"
            type="text"
            readOnly
            value={token}
            className="w-full px-3 py-2 border rounded-lg text-xs font-mono select-all"
            style={{
              backgroundColor: 'var(--page-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--page-text-primary)',
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--page-accent)',
              color: 'white',
            }}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg font-medium border transition-colors bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--page-text-primary)] hover:bg-[var(--page-bg)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
