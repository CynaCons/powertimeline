import React, { useRef, useState } from 'react';
import { OverlayShell } from '../OverlayShell';
import { exportToYAML, importFromYAML, downloadYAML, generateExportFilename } from '../../utils/yamlSerializer';
import type { Event } from '../../types';

interface DevPanelProps {
  seedRandom: (n: number) => void;
  seedClustered: () => void;
  seedLongRange: () => void;
  clearAll: () => void;
  dragging: boolean;
  onClose: () => void;
  devEnabled: boolean;
  seedRFK: () => void;
  seedJFK: () => void;
  seedNapoleon: () => void;
  seedDeGaulle: () => void;
  seedIncremental: (n: number) => void;
  // Export/Import functionality
  events: Event[];
  onImportEvents: (events: Event[]) => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({
  seedRandom, seedClustered, seedLongRange, clearAll, dragging, onClose, devEnabled,
  seedRFK, seedJFK, seedNapoleon, seedDeGaulle, seedIncremental, events, onImportEvents
}) => {
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
    <OverlayShell id="dev" title="Developer Options - Stage 1 (Full Cards)" dragging={dragging} onClose={onClose} className="dev-panel">
      <div className="flex flex-col gap-3 text-[11px]">
        
        {/* Basic Seeds */}
        <div>
          <div className="text-gray-700 font-medium text-xs mb-2">Basic Test Data</div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedRandom(5)}>5 Events</button>
            <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedRandom(10)}>10 Events</button>
            <button type="button" className="rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 px-3 py-1" onClick={seedClustered} title="Events clustered in time groups">Clustered</button>
            <button type="button" className="rounded border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 px-3 py-1" onClick={seedLongRange} title="Events spread across long time range">Long-range</button>
            <button type="button" data-testid="clear-all" className="rounded border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 px-3 py-1" onClick={clearAll}>Clear All</button>
          </div>
        </div>

        {/* Historical Data */}
        <div>
          <div className="text-gray-700 font-medium text-xs mb-2">Historical Timelines (Replace All)</div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedRFK} title="Load RFK 1968 timeline (replaces current events)">RFK 1968</button>
            <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedJFK} title="Load JFK presidency timeline (replaces current events)">JFK 1961-63</button>
            <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedNapoleon} title="Load Napoleon Bonaparte timeline (replaces current events)">Napoleon 1769-1821</button>
            <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedDeGaulle} title="Load Charles de Gaulle comprehensive timeline with media links (replaces current events)">De Gaulle 1890-1970</button>
          </div>
        </div>
        
        {/* Incremental Testing */}
        <div>
          <div className="text-gray-700 font-medium text-xs mb-2">Incremental Testing (Add Events)</div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1" onClick={() => seedIncremental(1)} title="Add 1 new event for clustering analysis">+1</button>
            <button type="button" className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1" onClick={() => seedIncremental(2)} title="Add 2 new events">+2</button>
            <button type="button" className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1" onClick={() => seedIncremental(3)} title="Add 3 new events">+3</button>
            <button type="button" className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1" onClick={() => seedIncremental(5)} title="Add 5 new events">+5</button>
            <button type="button" className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1" onClick={() => seedIncremental(8)} title="Add 8 new events">+8</button>
            <button type="button" className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1" onClick={() => seedIncremental(12)} title="Add 12 new events">+12</button>
          </div>
          <div className="text-gray-500 text-xs mt-1">
            Click multiple times to add different events each time
          </div>
        </div>

        {/* Export/Import Section */}
        <div>
          <div className="text-gray-700 font-medium text-xs mb-2">Timeline Export/Import</div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              type="button"
              className="rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExport}
              disabled={events.length === 0}
              title={events.length === 0 ? "No events to export" : `Export ${events.length} events to YAML file`}
            >
              📤 Export YAML ({events.length})
            </button>
            <button
              type="button"
              className="rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 px-3 py-1"
              onClick={handleImportClick}
              title="Import timeline from YAML file (replaces current events)"
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
            <div className="text-green-700 text-xs bg-green-50 border border-green-200 rounded px-2 py-1 mb-2">
              ✅ {importSuccess}
            </div>
          )}
          {importError && (
            <div className="text-red-700 text-xs bg-red-50 border border-red-200 rounded px-2 py-1 mb-2">
              ❌ {importError}
            </div>
          )}

          <div className="text-gray-500 text-xs">
            YAML format allows sharing timelines between users and applications
          </div>
        </div>

      </div>
      {!devEnabled && <p className="text-[11px] text-gray-400 mt-2">Enable Dev in header to use seeding tools.</p>}
    </OverlayShell>
  );
};

export default DevPanel;
