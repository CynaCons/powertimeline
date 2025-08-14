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
}

export const DevPanel: React.FC<DevPanelProps> = ({ seedRandom, seedClustered, seedLongRange, clearAll, dragging, onClose, devEnabled, seedRFK, seedJFK, seedNapoleon }) => {
  return (
    <OverlayShell id="dev" title="Developer Options" dragging={dragging} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={() => seedRandom(5)}>Seed 5</button>
        <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={() => seedRandom(10)}>Seed 10</button>
        <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={seedClustered}>Clustered</button>
        <button type="button" className="rounded bg-amber-600 text-white hover:bg-amber-500 px-3 py-1" onClick={seedLongRange}>Long-range</button>
        <button type="button" className="rounded bg-indigo-700 text-white hover:bg-indigo-600 px-3 py-1" onClick={seedRFK} title="Load RFK 1968 timeline (replaces current events)">RFK 1968</button>
        <button type="button" className="rounded bg-indigo-700 text-white hover:bg-indigo-600 px-3 py-1" onClick={seedJFK} title="Load JFK presidency timeline (replaces current events)">JFK 1961-63</button>
        <button type="button" className="rounded bg-purple-700 text-white hover:bg-purple-600 px-3 py-1" onClick={seedNapoleon} title="Load Napoleon Bonaparte timeline (replaces current events)">Napoleon 1769-1821</button>
        <button type="button" className="rounded bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 px-3 py-1" onClick={clearAll}>Clear</button>
      </div>
      {!devEnabled && <p className="text-[11px] text-gray-400 mt-2">Enable Dev in header to use seeding tools.</p>}
    </OverlayShell>
  );
};
