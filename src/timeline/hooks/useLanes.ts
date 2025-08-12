import { useMemo } from 'react';

export const LANE_SPACING_DENSE = 1.2; // vertical units between lanes (SVG space)
export const LANE_SPACING_VERY_DENSE = 1.0; // slightly tighter when very dense to fit 4

// Computes lane shifts (vertical offset factors) to reduce overlap density with a capped lane count.
export function useLanes(positions: { id: string; x: number }[], dense: boolean, veryDense: boolean) {
  return useMemo(() => {
    const map = new Map<string, number>();
    if (!dense) return map; // no lane shifting when not dense
    const laneCap = veryDense ? 4 : 2; // target lane count
    const spacing = veryDense ? LANE_SPACING_VERY_DENSE : LANE_SPACING_DENSE;
    const sorted = [...positions].sort((a, b) => a.x - b.x);
    const minGap = veryDense ? 0.9 : 1.2; // percent units in 0-100 controlling active window
    type Active = { id: string; x: number; lane: number };
    const active: Active[] = [];
    for (const p of sorted) {
      // expire lanes outside minGap window
      for (let i = active.length - 1; i >= 0; i--) if (p.x - active[i].x > minGap) active.splice(i, 1);
      const used = new Set(active.map(a => a.lane));
      // find first free lane under cap
      let lane = 0;
      while (lane < laneCap && used.has(lane)) lane++;
      if (lane >= laneCap) {
        // all lanes occupied: reuse the lane with the earliest x (oldest) to keep deterministic
        let oldestIdx = 0;
        for (let i = 1; i < active.length; i++) if (active[i].x < active[oldestIdx].x) oldestIdx = i;
        lane = active[oldestIdx].lane;
        // replace oldest entry with current point
        active[oldestIdx] = { id: p.id, x: p.x, lane };
      } else {
        active.push({ id: p.id, x: p.x, lane });
      }
      map.set(p.id, lane * spacing);
    }
    return map;
  }, [positions, dense, veryDense]);
}
