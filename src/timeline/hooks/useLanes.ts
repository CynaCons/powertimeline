import { useMemo } from 'react';

export const LANE_SPACING_DENSE = 1.8; // slightly reduced for more aggressive vertical packing
export const LANE_SPACING_VERY_DENSE = 1.5; // tighter spacing for very dense scenarios
export const LANE_SPACING_EXPANDED_BONUS = 0.3;

// Computes lane shifts (vertical offset factors) to reduce overlap density with a dynamic lane count.
export function useLanes(positions: { id: string; x: number; expanded?: boolean }[], dense: boolean, veryDense: boolean) {
  return useMemo(() => {
    const map = new Map<string, number>();
    const laneCap = veryDense ? 12 : dense ? 8 : 6; // much higher lane caps for aggressive vertical usage
    if (!positions.length) return map;

    const baseSpacing = veryDense ? LANE_SPACING_VERY_DENSE : LANE_SPACING_DENSE;

    const sorted = [...positions].sort((a, b) => a.x - b.x);

    const CARD_WIDTH = 8; // reduced collision detection width to be more realistic
    const lastRight: number[] = Array(laneCap).fill(-Infinity);

    for (const p of sorted) {
      let lane = -1;
      for (let i = 0; i < laneCap; i++) {
        if (p.x - CARD_WIDTH > lastRight[i]) { lane = i; break; }
      }
      if (lane === -1) {
        let best = 0; for (let i = 1; i < laneCap; i++) if (lastRight[i] < lastRight[best]) best = i; lane = best;
      }
      lastRight[lane] = p.x + CARD_WIDTH;
      const bonus = p.expanded ? LANE_SPACING_EXPANDED_BONUS : 0;
      map.set(p.id, (lane * baseSpacing) + bonus);
    }

    // If only one lane effectively used, spread cyclically
    const uniqueLanes = new Set([...map.values()].map(v => Math.round(v / baseSpacing)));
    if (uniqueLanes.size === 1 && positions.length >= 6) {
      positions.forEach((p, i) => {
        const lane = i % laneCap;
        const bonus = p.expanded ? LANE_SPACING_EXPANDED_BONUS : 0;
        map.set(p.id, (lane * baseSpacing) + bonus);
      });
    }

    return map;
  }, [positions, dense, veryDense]);
}
