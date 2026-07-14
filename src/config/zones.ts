// Zone loading. A household may store its own zones (kind "zone") to narrow the
// defaults; anything unstored falls back to DEFAULT_ZONES. Per the agent
// invariant this loader never *loosens* a default — a stored zone may only
// tighten a level (full -> partial -> ask), never the reverse.

import type { KitchenStore } from "../ports/store.ts";
import type { ZoneLevel, ZoneRule } from "../domain/zone-law.ts";
import { DEFAULT_ZONES } from "./default-zones.ts";

const RANK: Record<ZoneLevel, number> = { full: 0, partial: 1, ask: 2 };

// Higher rank (more restrictive) wins.
function tighter(a: ZoneLevel, b: ZoneLevel): ZoneLevel {
  return RANK[a] >= RANK[b] ? a : b;
}

export async function loadZones(store: KitchenStore): Promise<ZoneRule[]> {
  const stored = (await store.list<ZoneRule>("zone")).map((r) => r.data);
  if (!stored.length) return DEFAULT_ZONES;

  const byZone = new Map<string, ZoneRule>();
  for (const z of DEFAULT_ZONES) byZone.set(z.zone, z);

  for (const z of stored) {
    const base = byZone.get(z.zone);
    if (!base) {
      // A brand-new zone the household added — accept as-is (adding is allowed).
      byZone.set(z.zone, z);
    } else {
      // Existing zone — the stored level may only tighten the default.
      byZone.set(z.zone, { ...z, level: tighter(base.level, z.level) });
    }
  }
  return [...byZone.values()];
}
