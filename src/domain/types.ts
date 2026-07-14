// Canonical kitchen records. Every durable fact — a recipe, a pantry item, an
// appliance, a meal plan — is a KitchenRecord. This mirrors the reference
// implementation's typed-record store (one shape, many kinds) so a fork can put
// them in memory, JSON, SQLite, or Cloudflare KV without changing the domain.

export type RecordSource = "user" | "agent" | "import" | "scan" | "system";
export type RecordConfidence = "confirmed" | "proposed" | "inferred";

export interface KitchenRecord<T = Record<string, unknown>> {
  id: string;
  kind: string;
  data: T;
  createdAt: string;
  updatedAt: string;
  source?: RecordSource;
  confidence?: RecordConfidence;
}

// ----- Recipe -----------------------------------------------------------------

export interface Recipe {
  kind: "recipe";
  name: string;
  category?: string;
  // Ingredient lines stay human-readable. An optional "item: rest" prefix is
  // honored by the pantry matcher (see pantry.ts bareLine).
  ingredients: string[];
  steps?: string[];
  servings?: number;
  // Diet-agnostic gate. `exception` names the household rule this recipe breaks
  // (empty/absent means it violates none). The reference app hard-coded this as
  // `wfpbno`; here it is derived from the household's own food rules.
  exception?: string;
  equipment?: string[];
  substitutions?: Substitution[];
  notes?: string[];
  sourceUrl?: string;
}

export interface Substitution {
  from: string;
  to: string;
  note?: string;
}

// ----- Pantry -----------------------------------------------------------------

export type PantryLocation = "spice" | "dry" | "wet" | "fridge" | "freezer" | "other";

export interface PantryItem {
  kind: "pantry";
  name: string;
  location?: PantryLocation;
  have: boolean;
  qty?: number;
  unit?: string;
  open?: boolean;
  notes?: string[];
}

// ----- Appliance --------------------------------------------------------------

export interface Appliance {
  kind: "appliance";
  name: string;
  capabilities?: string[];
  notes?: string[];
}

// ----- Meal plan --------------------------------------------------------------

export interface PlannedMeal {
  label: string;
  recipeId?: string;
  leftover?: boolean;
  status?: "planned" | "made" | "skipped" | "changed";
}

export interface MealPlan {
  kind: "mealplan";
  weekOf: string; // ISO date of the week's Monday
  days: Array<{ date: string; meals: PlannedMeal[]; note?: string }>;
}

// ----- Kitchen event (append-only ledger) -------------------------------------

export type KitchenEventType =
  | "meal_planned"
  | "meal_cooked"
  | "meal_changed"
  | "pantry_added"
  | "pantry_used"
  | "pantry_audited"
  | "shopping_completed"
  | "recipe_created"
  | "recipe_changed"
  | "zone_action";

export interface KitchenEvent {
  type: KitchenEventType;
  occurredAt: string;
  actor?: string;
  payload: Record<string, unknown>;
}
