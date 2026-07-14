// Tonight — decision-free meal selection. Given the household's recipes, food
// rules, and pantry, pick one meal the kitchen permits and can most nearly make
// right now. Ported from the reference kitchen's scorePool + decide(), with the
// randomness injectable so the choice is deterministic under test.

import { allowedRecipes, type FoodRule } from "./food-rules.ts";
import { ingredientStatus, pantryHas } from "./pantry.ts";
import type { PantryItem, Recipe } from "./types.ts";

export interface ScoredRecipe {
  recipe: Recipe;
  exception?: string;
  required: number; // count of pantry-checkable ingredients
  missing: string[]; // the ones the pantry lacks
}

export type Rng = () => number;

export function scorePool(
  recipes: Recipe[],
  rules: FoodRule[],
  pantry: PantryItem[],
  includeExceptions: boolean,
): ScoredRecipe[] {
  return allowedRecipes(recipes, rules, includeExceptions).map(({ recipe, verdict }) => {
    const missing: string[] = [];
    let required = 0;
    for (const line of recipe.ingredients || []) {
      const bare = ingredientStatus(line);
      if (bare === null) continue;
      required++;
      if (!pantryHas(bare, pantry)) missing.push(bare);
    }
    return { recipe, exception: verdict.exception, required, missing };
  });
}

export interface TonightPick {
  pick: ScoredRecipe;
  reason: "ready" | "fewest-missing" | "no-list" | "empty-pantry";
  alternates: ScoredRecipe[];
}

// Deterministic when `rng` is supplied. Mirrors decide(): prefer recipes with a
// real ingredient list and the fewest missing items; break ties at random.
export function decideTonight(
  recipes: Recipe[],
  rules: FoodRule[],
  pantry: PantryItem[],
  opts: { includeExceptions?: boolean; rng?: Rng } = {},
): TonightPick | null {
  const rng = opts.rng ?? Math.random;
  const pool = scorePool(recipes, rules, pantry, opts.includeExceptions ?? false);
  if (!pool.length) return null;

  const stocked = pantry.some((p) => p.have !== false);
  const pickRandom = (arr: ScoredRecipe[]) => arr[Math.floor(rng() * arr.length)];

  if (!stocked) {
    return { pick: pickRandom(pool), reason: "empty-pantry", alternates: [] };
  }

  const ranked = pool
    .filter((s) => s.required > 0)
    .sort((a, b) => a.missing.length - b.missing.length);

  if (!ranked.length) {
    return { pick: pickRandom(pool), reason: "no-list", alternates: [] };
  }

  const fewest = ranked[0].missing.length;
  const best = ranked.filter((s) => s.missing.length === fewest);
  const picked = pickRandom(best);
  const alternates = ranked.filter((s) => s !== picked).slice(0, 3);
  const reason = picked.missing.length === 0 ? "ready" : "fewest-missing";

  return { pick: picked, reason, alternates };
}
