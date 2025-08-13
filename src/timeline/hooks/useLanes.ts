import { useMemo } from 'react';

export const LANE_SPACING_DENSE = 1.2; // vertical units between lanes (SVG space)
export const LANE_SPACING_VERY_DENSE = 1.0; // slightly tighter when very dense to fit 4
export const LANE_SPACING_EXPANDED_BONUS = 0.4; // extra spacing when card expanded to improve collision avoidance

// Computes lane shifts (vertical offset factors) to reduce overlap density with a capped lane count.
// Phase D: support explicit 4 lanes (2 above / 2 below) always when dense; when not dense still return empty map.
export function useLanes(positions: { id: string; x: number; expanded?: boolean }[], dense: boolean, veryDense: boolean) {
  return useMemo(() => {
    const map = new Map<string, number>();
    if (!dense) return map; // no lane shifting when not dense
    const laneCap = 4; // Phase D: explicit 4 lanes (0,1 above; 2,3 below after interpretation externally)
    const baseSpacing = veryDense ? LANE_SPACING_VERY_DENSE : LANE_SPACING_DENSE;
    const sorted = [...positions].sort((a, b) => a.x - b.x);
    const minGap = veryDense ? 0.9 : 1.2; // percent units in 0-100 controlling active window
    type Active = { id: string; x: number; lane: number };
    const active: Active[] = [];
    for (const p of sorted) {
      for (let i = active.length - 1; i >= 0; i--) if (p.x - active[i].x > minGap) active.splice(i, 1);
      const used = new Set(active.map(a => a.lane));
      let lane = 0;
      while (lane < laneCap && used.has(lane)) lane++;
      if (lane >= laneCap) {
        let oldestIdx = 0;
        for (let i = 1; i < active.length; i++) if (active[i].x < active[oldestIdx].x) oldestIdx = i;
        lane = active[oldestIdx].lane;
        active[oldestIdx] = { id: p.id, x: p.x, lane };
      } else {
        active.push({ id: p.id, x: p.x, lane });
      }
      const bonus = p.expanded ? LANE_SPACING_EXPANDED_BONUS : 0;
      map.set(p.id, (lane * baseSpacing) + bonus);
    }
    return map;
  }, [positions, dense, veryDense]);
}
