// Pantry matching — the deterministic heart of Tonight and the shopping list.
// Ported from the reference kitchen so behavior is identical; a fork can run it
// with no AI at all.

import { DESCRIPTORS, EQUIPMENT, MEASURES, STAPLES, bareLine, normTok, tokens } from "./text.ts";
import type { PantryItem } from "./types.ts";

// Given a raw ingredient line, return the "bare" name that must be pantry-checked,
// or null if the line is optional, equipment, or a staple that never counts.
export function ingredientStatus(line: string): string | null {
  const bare = bareLine(line);
  if (/optional|if needed|if tolerated|garnish/i.test(bare)) return null;

  const toks = tokens(bare);
  if (toks.some((t) => EQUIPMENT[t])) return null;

  const content = toks.filter((t) => !MEASURES[t]);
  if (!content.length || STAPLES[content[0]]) return null;

  return bare;
}

// Does the pantry contain something that satisfies this bare ingredient?
// Two-way containment: a pantry item named inside the line ("smoked paprika"
// covers "1 tsp smoked paprika"), or a plainer ask the item covers
// ("paprika" is satisfied by "smoked paprika").
export function pantryHas(bare: string, pantry: PantryItem[]): boolean {
  const ltoks = tokens(bare).map(normTok);
  const lcontent = ltoks.filter((t) => !DESCRIPTORS[t] && !MEASURES[t]);

  return pantry.some((p) => {
    if (p.have === false) return false;
    const ptoks = tokens(p.name).map(normTok).filter((t) => !DESCRIPTORS[t] && !MEASURES[t]);
    if (!ptoks.length) return false;

    if (ptoks.every((t) => ltoks.indexOf(t) >= 0)) return true;
    return lcontent.length > 0 && lcontent.every((t) => ptoks.indexOf(t) >= 0);
  });
}

// Used by pantry audits to reconcile a scanned/spoken name against a stored one.
export function nameMatch(a: string, b: string): boolean {
  const at = tokens(a).map(normTok).filter((t) => !DESCRIPTORS[t] && !MEASURES[t]);
  const bt = tokens(b).map(normTok).filter((t) => !DESCRIPTORS[t] && !MEASURES[t]);
  if (!at.length || !bt.length) return false;
  return at.every((t) => bt.indexOf(t) >= 0) || bt.every((t) => at.indexOf(t) >= 0);
}
