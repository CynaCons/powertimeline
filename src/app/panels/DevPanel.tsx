import React from 'react';
import { OverlayShell } from '../OverlayShell';

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
  seedIncremental: (n: number) => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({ seedRandom, seedClustered, seedLongRange, clearAll, dragging, onClose, devEnabled, seedRFK, seedJFK, seedNapoleon, seedIncremental }) => {
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

      </div>
      {!devEnabled && <p className="text-[11px] text-gray-400 mt-2">Enable Dev in header to use seeding tools.</p>}
    </OverlayShell>
  );
};
