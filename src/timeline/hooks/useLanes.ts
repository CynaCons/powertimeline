import { useMemo } from 'react';

// Computes lane shifts to reduce overlap density.
export function useLanes(positions: { id: string; x: number }[], dense: boolean, veryDense: boolean) {
  return useMemo(() => {
    const map = new Map<string, number>();
    if (!dense) return map;
    const sorted = [...positions].sort((a,b) => a.x - b.x);
    const minGap = veryDense ? 0.9 : 1.2; // percent units in 0-100
    const active: { id: string; x: number; lane: number }[] = [];
    for (const p of sorted) {
      // expire
      for (let i=active.length-1;i>=0;i--) if (p.x - active[i].x > minGap) active.splice(i,1);
      const used = new Set(active.map(a => a.lane));
      let lane = 0; while (used.has(lane)) lane++;
      active.push({ ...p, lane });
      map.set(p.id, lane * 0.6); // lane offset percent
    }
    return map;
  }, [positions, dense, veryDense]);
}
