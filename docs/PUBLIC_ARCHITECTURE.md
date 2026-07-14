# Fort Kitchen — Public Architecture

## Product definition

Fort Kitchen is a **personal kitchen operating system for humans and their agents**.

Its job is to reduce the distance between:

- food rules and food actually eaten;
- recipes saved and meals realistically cookable;
- groceries purchased and pantry state;
- household plans and what happened;
- a person's kitchen knowledge and the agent helping them.

It is not a diet app, recipe-content platform, grocery retailer, or generic chatbot with a cooking prompt.

## Design principles

### 1. Household truth is canonical

The stored record wins over model memory. The agent can propose corrections but cannot silently rewrite household facts.

### 2. Doctrine is configurable

A household may define dietary requirements, allergies, ethical constraints, medical restrictions, budget constraints, cultural rules, disliked ingredients, texture constraints, or no doctrine at all.

Rules have three levels:

- `required`: never violate;
- `preferred`: optimize when practical;
- `exception`: allowed only when explicitly flagged or approved.

The reference household's WFPBNO and gluten-free rules are examples, not defaults.

### 3. The system works without AI

Planning, pantry comparison, recipe filtering, shopping-list generation, and CRUD must remain deterministic. AI may help extract, normalize, converse, or suggest; it must not be required for the kitchen to open.

### 4. Agents receive tools, not database access

The agent bridge exposes narrow actions such as `list_pantry`, `find_recipes`, and `mark_ingredient_used`. It does not hand an agent raw credentials or unrestricted storage access.

### 5. Local-first, adapter-ready

The initial public build should run with local JSON or SQLite. Hosted storage, private memory cores, and cloud services plug into the same interfaces.

### 6. Phone-first and interruption-safe

The primary surface assumes one hand, a small screen, a messy counter, weak attention, and a cooking session that may be interrupted.

## System layers

```text
┌────────────────────────────────────────────┐
│ Kitchen Surface                            │
│ PWA · mobile UI · optional voice UI        │
├────────────────────────────────────────────┤
│ Kitchen Services                           │
│ planning · pantry · recipes · shopping     │
│ audits · capture · cooking sessions        │
├────────────────────────────────────────────┤
│ Agent Bridge                               │
│ explicit tools · confirmations · events    │
├────────────────────────────────────────────┤
│ Ports                                      │
│ Store · Auth · Model · Vision · Voice      │
├────────────────────────────────────────────┤
│ Adapters                                   │
│ JSON/SQLite · Cloudflare · custom memory   │
│ OpenAI/other/no-model · WebRTC/text-only   │
└────────────────────────────────────────────┘
```

## Canonical records

All records share:

```ts
interface KitchenRecord<T> {
  id: string;
  kind: string;
  data: T;
  createdAt: string;
  updatedAt: string;
  source?: "user" | "agent" | "import" | "scan" | "system";
  confidence?: "confirmed" | "proposed" | "inferred";
}
```

### Household profile

```ts
interface HouseholdProfile {
  householdName: string;
  people?: Array<{ id: string; name: string }>;
  locale?: string;
  units: "us" | "metric" | "mixed";
  currency?: string;
  doctrine: KitchenDoctrine;
  agent?: AgentProfile;
}
```

### Kitchen doctrine

```ts
interface KitchenDoctrine {
  required: Rule[];
  preferred: Rule[];
  exceptions: Rule[];
  dislikedIngredients?: string[];
  favoriteIngredients?: string[];
  maxEffort?: "minimal" | "normal" | "project";
  budgetMode?: "strict" | "aware" | "open";
}

interface Rule {
  id: string;
  label: string;
  description?: string;
  tags?: string[];
}
```

### Recipe

```ts
interface Recipe {
  name: string;
  category?: string;
  ingredients: IngredientLine[];
  steps: string[];
  servings?: number;
  doctrineTags?: string[];
  exceptions?: string[];
  equipment?: EquipmentUse[];
  substitutions?: Substitution[];
  notes?: string[];
  agentNote?: string;
  sourceUrl?: string;
}
```

Ingredient lines should preserve the human-readable original while optionally adding normalized fields.

```ts
interface IngredientLine {
  text: string;
  item?: string;
  quantity?: number;
  unit?: string;
  optional?: boolean;
}
```

### Pantry item

```ts
interface PantryItem {
  name: string;
  normalizedName?: string;
  location: "spice" | "dry" | "wet" | "fridge" | "freezer" | "other";
  have: boolean;
  quantity?: number;
  unit?: string;
  opened?: boolean;
  lowAt?: number;
  expiresOn?: string;
  notes?: string[];
}
```

### Equipment

```ts
interface Equipment {
  name: string;
  kind?: string;
  capabilities?: string[];
  notes?: string[];
}

interface EquipmentUse {
  equipmentId?: string;
  name: string;
  setting?: string;
}
```

### Meal plan

```ts
interface MealPlan {
  weekOf: string;
  days: Array<{
    date: string;
    meals: Array<{
      recipeId?: string;
      label: string;
      leftover?: boolean;
      status?: "planned" | "made" | "skipped" | "changed";
    }>;
    note?: string;
  }>;
}
```

### Kitchen event

Events preserve what happened without forcing every action into current-state records.

```ts
interface KitchenEvent {
  type:
    | "meal_planned"
    | "meal_cooked"
    | "meal_changed"
    | "pantry_added"
    | "pantry_used"
    | "pantry_audited"
    | "shopping_completed"
    | "recipe_created"
    | "recipe_changed";
  occurredAt: string;
  payload: Record<string, unknown>;
}
```

## Core services

### Tonight service

Input:

- doctrine;
- available recipes;
- pantry state;
- equipment;
- effort/time constraints;
- recent meals;
- optional exception permission.

Output:

- one recommendation;
- why it qualifies;
- missing ingredients, if any;
- substitutions;
- deterministic fallback when no recipe fully qualifies.

The service should support `decideForMe: true` so the system actually makes a choice rather than returning another list.

### Planning service

Builds or edits a week while considering leftovers, repetition, effort distribution, perishables, household schedule, and budget mode.

### Shopping service

Computes:

```text
planned ingredient demand
− confirmed pantry availability
− accepted substitutions
+ household staples below threshold
= shopping list
```

The initial implementation should favor understandable output over mathematically false precision. Unparseable ingredient lines remain visible for human review.

### Pantry audit service

Supports:

- manual toggles;
- cupboard-by-cupboard review;
- order/screenshot imports;
- optional image recognition;
- reconciliation instead of blind overwrite;
- a last-audit timestamp and configurable audit interval.

### Capture service

Accepts:

- pasted recipe text;
- a URL fetched by an external adapter;
- image or screenshot text;
- natural-language recipe dictation;
- grocery receipt/order data.

Extraction returns a **proposal**. The user or trusted automation confirms it before durable save.

### Cooking session service

Maintains the active recipe, current step, timers, substitutions, notes, pantry deductions, and session transcript. Voice is an interface to this service, not the service itself.

## Agent tool contract

Minimum read tools:

```text
get_household_profile
get_kitchen_doctrine
list_recipes
get_recipe
find_recipes
list_pantry
list_equipment
get_meal_plan
build_shopping_list
```

Minimum write tools:

```text
add_or_update_pantry_item
record_pantry_use
save_recipe_proposal
confirm_recipe
save_meal_plan
record_meal_cooked
record_meal_changed
append_kitchen_event
```

Write behavior:

- destructive changes require confirmation;
- inferred pantry deductions should be recorded as proposed unless the household explicitly enables automatic deduction;
- the tool result must report exactly what changed;
- every write carries a source and timestamp;
- agents never receive provider secrets.

## Provider ports

```ts
interface KitchenStore {
  list<T>(kind: string): Promise<KitchenRecord<T>[]>;
  get<T>(id: string): Promise<KitchenRecord<T> | null>;
  put<T>(record: KitchenRecord<T>): Promise<KitchenRecord<T>>;
  append(event: KitchenEvent): Promise<void>;
}

interface ExtractionProvider {
  extractRecipe(input: CaptureInput): Promise<RecipeProposal>;
  scanPantry?(input: CaptureInput): Promise<PantryProposal[]>;
}

interface ConversationProvider {
  startSession(context: AgentContext): Promise<AgentSession>;
}
```

No provider-specific type should leak into kitchen services.

## Repository shape

```text
fort-kitchen/
  apps/
    web/                 # phone-first PWA
  packages/
    core/                # schemas + deterministic services
    agent-bridge/        # tool definitions and confirmation rules
    adapter-json/        # no-service starter adapter
    adapter-sqlite/      # durable local adapter
    adapter-cloudflare/  # optional D1/KV/R2 deployment
    adapter-openai/      # optional extraction/voice provider
  config/
    household.example.yml
    doctrine.example.yml
    agent.example.yml
  docs/
    PUBLIC_ARCHITECTURE.md
    DATA_OWNERSHIP.md
    SECURITY.md
  AGENT_INSTALL.md
```

## Public onboarding flow

1. Fork repository.
2. Agent reads `AGENT_INSTALL.md`.
3. Agent asks only unresolved household questions.
4. Agent writes private/local configuration files excluded by `.gitignore`.
5. Agent selects the simplest adapter that meets the owner's needs.
6. Agent imports recipes and pantry only with provenance.
7. Owner reviews the first generated doctrine and sample decision.
8. Agent runs tests and produces a deploy or local launch command.

## Reference-household extraction rule

The private Fort implementation may be used as source material for behavior, but public extraction must classify every element as one of:

- **generic capability** — publishable code or contract;
- **example configuration** — publishable only after anonymizing and labeling;
- **personal content** — stays private;
- **private infrastructure** — replaced by a port/adapter;
- **credential or identity material** — never copied.

## Initial milestones

### Milestone 1 — Forkable skeleton

- schemas;
- JSON adapter;
- recipe/pantry CRUD;
- Tonight decision;
- shopping-list derivation;
- household and doctrine onboarding;
- tests;
- no paid service required.

### Milestone 2 — Kitchen surface

- installable PWA;
- Tonight, Week, Recipes, Pantry, Gear, Add;
- import/export;
- accessible phone-first cooking view.

### Milestone 3 — Agent bridge

- tool server;
- confirmation policy;
- agent-readable household briefing;
- reference prompts that do not hard-code one persona.

### Milestone 4 — Optional intelligence

- recipe extraction;
- pantry image proposals;
- live voice cooking session;
- automatic meal-history and pantry reconciliation policies.

## Non-goals for the first release

- social feed;
- public recipe marketplace;
- calorie or medical nutrition tracking;
- grocery-store integrations;
- perfect unit conversion;
- autonomous purchasing;
- multi-tenant SaaS.

Those can be adapters or later products. The first promise is simpler: **fork it, teach it your kitchen, and let your own agent help run the room.**