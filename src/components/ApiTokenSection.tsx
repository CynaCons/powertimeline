/**
 * ApiTokenSection - Settings page section for API token management
 * Allows users to generate, view status, and revoke API tokens
 * for the Timeline Automation API.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getApiTokenStatus,
  generateApiToken,
  revokeApiToken,
  type ApiTokenStatus,
} from '../services/apiToken';
import { ApiTokenRevealDialog } from './ApiTokenRevealDialog';

export function ApiTokenSection() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [tokenStatus, setTokenStatus] = useState<ApiTokenStatus>({ exists: false });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!user) return;
    loadTokenStatus();
  }, [user]);

  async function loadTokenStatus() {
    if (!user) return;
    try {
      setLoading(true);
      const status = await getApiTokenStatus(user.uid);
      setTokenStatus(status);
    } catch (error) {
      console.error('Failed to load API token status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      const token = await generateApiToken(label || 'API Token');
      setRevealedToken(token);
      setLabel('');
      await loadTokenStatus();
      showSuccess('API token generated successfully');
    } catch (error) {
      console.error('Failed to generate API token:', error);
      showError('Failed to generate API token');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke() {
    try {
      setRevoking(true);
      await revokeApiToken();
      setTokenStatus({ exists: false });
      setShowRevokeConfirm(false);
      showSuccess('API token revoked');
    } catch (error) {
      console.error('Failed to revoke API token:', error);
      showError('Failed to revoke API token');
    } finally {
      setRevoking(false);
    }
  }

  function handleDismissReveal() {
    setRevealedToken(null);
  }

  const formatDate = (isoDate: string | undefined): string => {
    if (!isoDate) return 'Unknown';
    try {
      return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <section
        className="border rounded-xl p-6"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>
          API Access
        </h2>
        <p className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>
          Loading...
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        className="border rounded-xl p-6"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--page-text-primary)' }}>
          API Access
        </h2>

        {tokenStatus.exists ? (
          /* Token exists — show status and revoke controls */
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>
              Your API token allows external tools to manage events on your timelines.
            </p>

            <div className="space-y-2">
              {tokenStatus.label && (
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--page-text-secondary)' }}>
                    Label:{' '}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--page-text-primary)' }}>
                    {tokenStatus.label}
                  </span>
                </div>
              )}
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--page-text-secondary)' }}>
                  Created:{' '}
                </span>
                <span className="text-sm" style={{ color: 'var(--page-text-primary)' }}>
                  {formatDate(tokenStatus.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--page-text-secondary)' }}>
                  Last used:{' '}
                </span>
                <span className="text-sm" style={{ color: 'var(--page-text-primary)' }}>
                  {tokenStatus.lastUsedAt ? formatDate(tokenStatus.lastUsedAt) : 'Never'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {showRevokeConfirm ? (
                <>
                  <span className="text-sm self-center" style={{ color: 'var(--color-danger)' }}>
                    Are you sure?
                  </span>
                  <button
                    onClick={handleRevoke}
                    disabled={revoking}
                    className="px-4 py-2 rounded-lg font-medium transition-colors bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {revoking ? 'Revoking...' : 'Yes, Revoke'}
                  </button>
                  <button
                    onClick={() => setShowRevokeConfirm(false)}
                    disabled={revoking}
                    className="px-4 py-2 rounded-lg font-medium border transition-colors bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--page-text-primary)] hover:bg-[var(--page-bg)]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRevokeConfirm(true)}
                    className="px-4 py-2 rounded-lg font-medium border transition-colors bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--color-danger)] hover:bg-[var(--page-bg)] hover:border-[var(--color-danger)]"
                  >
                    Revoke Token
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 rounded-lg font-medium border transition-colors bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--page-text-primary)] hover:bg-[var(--page-bg)] hover:border-[var(--page-accent)] hover:text-[var(--page-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Regenerating...' : 'Regenerate Token'}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* No token — show generation controls */
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>
              Generate an API token to allow external tools to add events to your timelines programmatically.
            </p>

            <div>
              <label
                htmlFor="api-token-label"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                Label (optional)
              </label>
              <input
                id="api-token-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Iran War Bot"
                maxLength={100}
                className="w-full max-w-xs px-3 py-2 border rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--page-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--page-text-primary)',
                }}
                disabled={generating}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 rounded-lg font-medium border transition-colors bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--page-text-primary)] hover:bg-[var(--page-bg)] hover:border-[var(--page-accent)] hover:text-[var(--page-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Token'}
            </button>
          </div>
        )}
      </section>

      {/* Token reveal modal */}
      {revealedToken && (
        <ApiTokenRevealDialog token={revealedToken} onDismiss={handleDismissReveal} />
      )}
    </>
  );
}
