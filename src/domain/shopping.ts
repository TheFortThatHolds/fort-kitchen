// Shopping list derivation:
//   planned meals -> their recipes' required ingredients
//   minus what the pantry already covers
//   deduped, in first-seen order.
// Ported from the reference kitchen's shoppingList(). Understandable output over
// false precision: unmatched meal labels are reported, not silently dropped.

import { ingredientStatus, pantryHas } from "./pantry.ts";
import type { PantryItem, Recipe } from "./types.ts";

export interface ShoppingResult {
  need: string[]; // bare ingredient names to buy, first-seen order
  unmatched: string[]; // planned meal labels with no recipe on file
}

// `mealLabels` are the free-text meal entries from a plan; `resolve` maps a
// label to a recipe (exact then fuzzy) or null.
export function deriveShoppingList(
  mealLabels: string[],
  resolve: (label: string) => Recipe | null,
  pantry: PantryItem[],
): ShoppingResult {
  const need: string[] = [];
  const seen = new Set<string>();
  const unmatched: string[] = [];

  for (const label of mealLabels) {
    const trimmed = label.trim();
    if (!trimmed) continue;
    const recipe = resolve(trimmed);
    if (!recipe) {
      if (!unmatched.includes(trimmed)) unmatched.push(trimmed);
      continue;
    }
    for (const line of recipe.ingredients || []) {
      const bare = ingredientStatus(line);
      if (bare === null || pantryHas(bare, pantry)) continue;
      const k = bare.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        need.push(bare);
      }
    }
  }

  return { need, unmatched };
}

// Exact name match, then loose token containment — mirrors findRecipe().
export function makeResolver(recipes: Recipe[]): (label: string) => Recipe | null {
  return (label: string) => {
    const q = label.trim().toLowerCase();
    if (!q) return null;
    const exact = recipes.find((r) => String(r.name || "").toLowerCase() === q);
    if (exact) return exact;
    const words = q.split(/\s+/).filter(Boolean);
    return (
      recipes.find((r) => {
        const name = String(r.name || "").toLowerCase();
        return words.length > 0 && words.every((w) => name.includes(w));
      }) || null
    );
  };
}
