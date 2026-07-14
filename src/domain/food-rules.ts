// Food rules — what the kitchen BELIEVES. This is the diet-agnostic
// generalization of the reference kitchen's hard-coded WFPBNO gate: instead of
// one baked-in diet, a recipe is judged against the household's own rules.
//
// A rule with treatment `exclude` or `avoid` names a subject the kitchen keeps
// out. A recipe whose ingredients mention that subject carries an *exception*
// (the named rule it breaks) and is hidden from Tonight unless the household
// opts to include exceptions. `require`/`prefer`/`warn`/`deprioritize` do not
// gate visibility here — they inform ranking and surfacing, not the yes/no gate.

import { normTok, tokens } from "./text.ts";
import type { Recipe } from "./types.ts";

export type Treatment =
  | "exclude"
  | "warn"
  | "avoid"
  | "deprioritize"
  | "prefer"
  | "require";

export interface FoodRule {
  id: string;
  subject: string;
  treatment: Treatment;
  category?: string;
  applies_to?: { members?: string[] };
  change_zone?: string;
  source?: { type?: string; recorded_at?: string; evidence?: string };
}

// Treatments that make a recipe an "exception" when its ingredients hit them.
const GATING: Record<string, boolean> = { exclude: true, avoid: true };

function ingredientTokens(recipe: Recipe): Set<string> {
  const set = new Set<string>();
  for (const line of recipe.ingredients || []) {
    for (const t of tokens(line).map(normTok)) set.add(t);
  }
  return set;
}

export interface RecipeVerdict {
  allowed: boolean; // passes the household's gating rules
  exception?: string; // the id/subject of the first gating rule it breaks
  brokenRules: string[]; // all gating rule ids it breaks
}

// Evaluate a recipe against the household's food rules. Ingredient-explicit
// only: this never guesses hidden ingredients — it reads what the recipe says,
// matching the "contact with reality" principle (no silent inference).
export function evaluateRecipe(recipe: Recipe, rules: FoodRule[]): RecipeVerdict {
  // An explicit, human-authored exception on the recipe wins — it means someone
  // already judged this recipe against the rules.
  const explicit = recipe.exception && recipe.exception.trim();

  const ing = ingredientTokens(recipe);
  const broken: string[] = [];

  for (const rule of rules) {
    if (!GATING[rule.treatment]) continue;
    const subjTokens = tokens(rule.subject).map(normTok).filter(Boolean);
    if (!subjTokens.length) continue;
    if (subjTokens.every((t) => ing.has(t))) broken.push(rule.id || rule.subject);
  }

  const exception = explicit || broken[0];
  return {
    allowed: !exception,
    exception: exception || undefined,
    brokenRules: broken,
  };
}

// The Tonight gate, generalized from `allowed(inclEx)`.
export function allowedRecipes(
  recipes: Recipe[],
  rules: FoodRule[],
  includeExceptions = false,
): Array<{ recipe: Recipe; verdict: RecipeVerdict }> {
  return recipes
    .map((recipe) => ({ recipe, verdict: evaluateRecipe(recipe, rules) }))
    .filter(({ verdict }) => verdict.allowed || includeExceptions);
}
