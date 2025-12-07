import React, { useState, useRef, useEffect } from 'react';

interface SourcesEditorProps {
  sources: string[];
  onChange: (sources: string[]) => void;
  readOnly?: boolean;
}

export const SourcesEditor: React.FC<SourcesEditorProps> = ({
  sources,
  onChange,
  readOnly = false,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSourceValue, setNewSourceValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when adding new source
  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  // URL detection: strings starting with http:// or https://
  const isURL = (text: string): boolean => {
    return text.startsWith('http://') || text.startsWith('https://');
  };

  // Handle Enter key in input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newSourceValue.trim();
      if (trimmed) {
        onChange([...sources, trimmed]);
        setNewSourceValue('');
        // Keep input open to add another
        inputRef.current?.focus();
      }
    } else if (e.key === 'Escape') {
      // Cancel adding - stop propagation to prevent overlay from closing
      e.stopPropagation();
      setNewSourceValue('');
      setIsAddingNew(false);
    }
  };

  // Handle input blur (save if not empty, otherwise close)
  const handleInputBlur = () => {
    const trimmed = newSourceValue.trim();
    if (trimmed) {
      onChange([...sources, trimmed]);
    }
    setNewSourceValue('');
    setIsAddingNew(false);
  };

  // Handle delete source
  const handleDelete = (index: number) => {
    const updated = sources.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Create a drag preview
    e.dataTransfer.setData('text/plain', sources[index]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...sources];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, removed);

    onChange(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Sources list */}
      {sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((source, index) => (
            <div
              key={index}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: draggedIndex === index ? 'var(--page-bg)' :
                               dragOverIndex === index ? 'var(--page-bg-elevated)' :
                               'transparent',
                border: `1px solid ${dragOverIndex === index ? 'var(--page-accent)' : 'var(--page-border)'}`,
                cursor: readOnly ? 'default' : 'grab',
                opacity: draggedIndex === index ? 0.5 : 1,
              }}
            >
              {/* Drag handle - only visible if not read-only */}
              {!readOnly && (
                <span
                  className="material-symbols-rounded text-sm"
                  style={{
                    color: 'var(--page-text-secondary)',
                    cursor: 'grab',
                  }}
                >
                  drag_indicator
                </span>
              )}

              {/* Icon - link or description */}
              <span
                className="material-symbols-rounded text-sm flex-shrink-0"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                {isURL(source) ? 'link' : 'description'}
              </span>

              {/* Source text or link */}
              <div className="flex-1 min-w-0">
                {isURL(source) ? (
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm truncate block hover:underline"
                    style={{ color: 'var(--page-accent)' }}
                  >
                    {source}
                  </a>
                ) : (
                  <span
                    className="text-sm truncate block"
                    style={{ color: 'var(--page-text-primary)' }}
                  >
                    {source}
                  </span>
                )}
              </div>

              {/* Delete button - only visible if not read-only */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1"
                  style={{ color: 'var(--page-text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--page-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Delete source"
                >
                  <span className="material-symbols-rounded text-sm">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Source input or button */}
      {!readOnly && (
        <>
          {isAddingNew ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newSourceValue}
                onChange={(e) => setNewSourceValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                placeholder="Enter URL or text..."
                className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--page-bg)',
                  border: '1px solid var(--page-border)',
                  color: 'var(--page-text-primary)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--page-accent)';
                }}
                onBlurCapture={(e) => {
                  // Reset border color after blur handlers complete
                  setTimeout(() => {
                    e.currentTarget.style.borderColor = 'var(--page-border)';
                  }, 200);
                }}
                maxLength={500}
              />
              {/* Save button - visible when there's text */}
              <button
                type="button"
                onMouseDown={(e) => {
                  // Prevent blur from firing before click
                  e.preventDefault();
                  const trimmed = newSourceValue.trim();
                  if (trimmed) {
                    onChange([...sources, trimmed]);
                    setNewSourceValue('');
                    inputRef.current?.focus();
                  }
                }}
                className="p-2 rounded-lg transition-all flex-shrink-0"
                style={{
                  backgroundColor: newSourceValue.trim() ? 'var(--page-accent)' : 'var(--page-bg)',
                  color: newSourceValue.trim() ? 'white' : 'var(--page-text-secondary)',
                  opacity: newSourceValue.trim() ? 1 : 0.5,
                  cursor: newSourceValue.trim() ? 'pointer' : 'default',
                }}
                disabled={!newSourceValue.trim()}
                aria-label="Save source"
              >
                <span className="material-symbols-rounded text-sm">check</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all w-full"
              style={{
                backgroundColor: 'transparent',
                border: '1px dashed var(--page-border)',
                color: 'var(--page-text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--page-accent)';
                e.currentTarget.style.color = 'var(--page-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--page-border)';
                e.currentTarget.style.color = 'var(--page-text-secondary)';
              }}
            >
              <span className="material-symbols-rounded text-sm">add</span>
              <span>Add Source</span>
            </button>
          )}
        </>
      )}

      {/* Placeholder when no sources and read-only */}
      {readOnly && sources.length === 0 && (
        <div
          className="text-sm italic px-3 py-2"
          style={{ color: 'var(--page-text-secondary)' }}
        >
          No sources
        </div>
      )}
    </div>
  );
};
