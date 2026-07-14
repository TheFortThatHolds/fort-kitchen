import { test } from "node:test";
import assert from "node:assert/strict";
import { decideTonight, scorePool } from "../src/domain/tonight.ts";
import type { FoodRule } from "../src/domain/food-rules.ts";
import type { PantryItem, Recipe } from "../src/domain/types.ts";

const recipes: Recipe[] = [
  { kind: "recipe", name: "Chili", ingredients: ["1 can black beans", "1 onion", "1 tbsp chili powder"] },
  { kind: "recipe", name: "Fried Rice", ingredients: ["2 cups cooked rice", "1 carrot", "2 tbsp soy sauce"] },
  { kind: "recipe", name: "Peanut Noodles", ingredients: ["8 oz noodles", "3 tbsp peanut butter"] },
];

const nutRule: FoodRule[] = [
  { id: "no-peanut", subject: "peanut", treatment: "exclude" },
];

const fixedRng = () => 0; // always pick the first candidate

test("a food rule turns a matching recipe into an excluded exception", () => {
  const pool = scorePool(recipes, nutRule, [], false);
  assert.equal(pool.find((s) => s.recipe.name === "Peanut Noodles"), undefined);
  const withEx = scorePool(recipes, nutRule, [], true);
  const noodles = withEx.find((s) => s.recipe.name === "Peanut Noodles");
  assert.ok(noodles);
  assert.equal(noodles?.exception, "no-peanut");
});

test("Tonight prefers the recipe with the fewest missing ingredients", () => {
  const pantry: PantryItem[] = [
    { kind: "pantry", name: "black beans", have: true },
    { kind: "pantry", name: "onion", have: true },
    { kind: "pantry", name: "chili powder", have: true },
  ];
  const pick = decideTonight(recipes, nutRule, pantry, { rng: fixedRng });
  assert.ok(pick);
  assert.equal(pick?.pick.recipe.name, "Chili");
  assert.equal(pick?.reason, "ready");
  assert.deepEqual(pick?.pick.missing, []);
});

test("empty pantry yields an empty-pantry pick, not a crash", () => {
  const pick = decideTonight(recipes, [], [], { rng: fixedRng });
  assert.ok(pick);
  assert.equal(pick?.reason, "empty-pantry");
});

test("no recipes yields null", () => {
  assert.equal(decideTonight([], [], [], { rng: fixedRng }), null);
});
