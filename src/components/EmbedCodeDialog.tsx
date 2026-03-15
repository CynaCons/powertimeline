/**
 * EmbedCodeDialog - Shows iframe embed snippet with copy support
 */

import { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useToast } from '../contexts/ToastContext';

interface EmbedCodeDialogProps {
  open: boolean;
  onClose: () => void;
  embedUrl: string;
  title: string;
}

type SizePreset = 'small' | 'medium' | 'large';

const SIZE_PRESETS: Record<SizePreset, { width: number; height: number; label: string }> = {
  small: { width: 600, height: 400, label: 'Small (600x400)' },
  medium: { width: 800, height: 500, label: 'Medium (800x500)' },
  large: { width: 1024, height: 600, label: 'Large (1024x600)' },
};

export function EmbedCodeDialog({ open, onClose, embedUrl, title }: EmbedCodeDialogProps) {
  const [sizePreset, setSizePreset] = useState<SizePreset>('medium');
  const { showToast } = useToast();

  const embedCode = useMemo(() => {
    const { width, height } = SIZE_PRESETS[sizePreset];
    return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen title="${title}"></iframe>`;
  }, [embedUrl, title, sizePreset]);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      showToast('Embed code copied!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: 'var(--page-bg-elevated)',
            border: '1px solid var(--page-border)',
            color: 'var(--page-text-primary)',
          }
        }
      }}
    >
      <DialogTitle>Embed Timeline</DialogTitle>
      <DialogContent>
        <ToggleButtonGroup
          value={sizePreset}
          exclusive
          onChange={(_e, val) => val && setSizePreset(val)}
          size="small"
          sx={{ mb: 2 }}
        >
          {(Object.entries(SIZE_PRESETS) as [SizePreset, typeof SIZE_PRESETS[SizePreset]][]).map(([key, preset]) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{
                color: 'var(--page-text-secondary)',
                borderColor: 'var(--page-border)',
                '&.Mui-selected': {
                  color: 'var(--page-accent)',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                },
              }}
            >
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <pre
          style={{
            backgroundColor: 'var(--page-bg)',
            border: '1px solid var(--page-border)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.8rem',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--page-text-primary)',
          }}
        >
          {embedCode}
        </pre>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: 'var(--page-text-secondary)' }}>
          Close
        </Button>
        <Button onClick={handleCopy} variant="contained" sx={{ backgroundColor: 'var(--page-accent)' }}>
          Copy Code
        </Button>
      </DialogActions>
    </Dialog>
  );
}
