import React, { useRef, useState } from 'react';
import { exportToYAML, importFromYAML, downloadYAML, generateExportFilename } from '../../utils/yamlSerializer';
import type { Event } from '../../types';

interface DevPanelProps {
  seedRandom: (n: number) => void;
  seedClustered: () => void;
  seedLongRange: () => void;
  clearAll: () => void;
  onClose: () => void;
  seedRFK: () => void;
  seedJFK: () => void;
  seedNapoleon: () => void;
  seedDeGaulle: () => void;
  seedFrenchRevolution: () => void;
  seedIncremental: (n: number) => void;
  seedMinuteTest: () => void;
  events: Event[];
  onImportEvents: (events: Event[]) => void;
}

export function DevPanel({
  seedRandom, seedClustered, seedLongRange, clearAll, onClose,
  seedRFK, seedJFK, seedNapoleon, seedDeGaulle, seedFrenchRevolution, seedIncremental, seedMinuteTest, events, onImportEvents
}: DevPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleExport = () => {
    try {
      if (events.length === 0) {
        alert('No events to export. Please load or create some events first.');
        return;
      }

      const timelineName = `Timeline-${events.length}-events`;
      const yamlContent = exportToYAML(events, {
        timelineName,
        description: `Exported timeline with ${events.length} events`,
        includeMetadata: true
      });

      const filename = generateExportFilename(timelineName);
      downloadYAML(yamlContent, filename);

      setImportSuccess(`Exported ${events.length} events to ${filename}`);
      setTimeout(() => setImportSuccess(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      setImportError(`Export failed: ${errorMessage}`);
      setTimeout(() => setImportError(null), 5000);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = importFromYAML(content);

        if (result.success && result.events) {
          onImportEvents(result.events);
          setImportSuccess(`Successfully imported ${result.events.length} events from ${file.name}`);
          setTimeout(() => setImportSuccess(null), 5000);
        } else {
          setImportError(result.error || 'Import failed with unknown error');
          setTimeout(() => setImportError(null), 8000);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
        setImportError(`Import failed: ${errorMessage}`);
        setTimeout(() => setImportError(null), 8000);
      }
    };

    reader.onerror = () => {
      setImportError(`Failed to read file: ${file.name}`);
      setTimeout(() => setImportError(null), 5000);
    };

    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  return (
    <aside role="dialog" aria-label="Developer Panel" className="fixed left-14 top-0 bottom-0 w-80 border-r z-20" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Developer Panel</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Events: {events.length}</p>

        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Sample Data</h3>
          <div className="space-y-1 mb-4">
            <button onClick={seedRFK} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>RFK 1968</button>
            <button onClick={seedJFK} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>JFK 1961-63</button>
            <button onClick={seedNapoleon} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Napoleon 1769-1821</button>
            <button onClick={seedDeGaulle} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>De Gaulle</button>
            <button onClick={seedFrenchRevolution} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>French Revolution</button>
            <button onClick={seedMinuteTest} className="block w-full text-left px-2 py-1 hover:bg-orange-100 text-orange-700 text-sm">⏰ Minute Test</button>
            <button onClick={() => seedRandom(10)} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Random (10)</button>
            <button onClick={seedClustered} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Clustered</button>
            <button onClick={seedLongRange} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Long-range</button>
            <button onClick={() => seedIncremental(5)} className="block w-full text-left px-2 py-1 text-sm transition-colors" style={{ color: 'var(--color-text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>+5</button>
            <button onClick={clearAll} className="block w-full text-left px-2 py-1 hover:bg-red-100 text-red-700 text-sm">Clear All</button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Timeline Export/Import</h3>
          <div className="space-y-2">
            <button
              type="button"
              className="rounded border border-blue-300 text-blue-700 hover:bg-blue-50 px-3 py-1"
              style={{ backgroundColor: 'var(--color-surface)' }}
              disabled={events.length === 0}
              title={events.length === 0 ? "No events to export" : `Export ${events.length} events to YAML file`}
              onClick={handleExport}
            >
              📤 Export YAML ({events.length})
            </button>
            <button
              type="button"
              className="rounded border border-green-300 text-green-700 hover:bg-green-50 px-3 py-1"
              style={{ backgroundColor: 'var(--color-surface)' }}
              title="Import timeline from YAML file"
              onClick={handleImportClick}
            >
              📁 Import YAML
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".yaml,.yml"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Status messages */}
          {importSuccess && (
            <div className="text-green-700 text-xs bg-green-50 border border-green-200 rounded px-2 py-1 mb-2 mt-2">
              ✅ {importSuccess}
            </div>
          )}
          {importError && (
            <div className="text-red-700 text-xs bg-red-50 border border-red-200 rounded px-2 py-1 mb-2 mt-2">
              ❌ {importError}
            </div>
          )}

          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            YAML format allows sharing timelines between users and applications
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-3 py-1 text-white rounded text-sm"
          style={{ backgroundColor: 'var(--color-neutral-500)' }}
        >
          Close
        </button>
      </div>
    </aside>
  );
};

