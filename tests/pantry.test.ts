import { test } from "node:test";
import assert from "node:assert/strict";
import { ingredientStatus, pantryHas } from "../src/domain/pantry.ts";
import type { PantryItem } from "../src/domain/types.ts";

const pantry = (names: string[]): PantryItem[] =>
  names.map((name) => ({ kind: "pantry", name, have: true }));

test("ingredientStatus drops optional, equipment, and staples", () => {
  assert.equal(ingredientStatus("2 tbsp olive oil (optional)"), null);
  assert.equal(ingredientStatus("line the pan with foil"), null);
  assert.equal(ingredientStatus("salt to taste"), null);
  assert.equal(ingredientStatus("1 can black beans"), "1 can black beans");
});

test("pantryHas: item named inside a longer ingredient line", () => {
  assert.equal(pantryHas("1 tsp smoked paprika", pantry(["smoked paprika"])), true);
});

test("pantryHas: plainer ask covered by a more specific stock item", () => {
  assert.equal(pantryHas("paprika", pantry(["smoked paprika"])), true);
});

test("pantryHas: singular/plural normalization", () => {
  assert.equal(pantryHas("2 onions", pantry(["onion"])), true);
});

test("pantryHas: absent item is missing", () => {
  assert.equal(pantryHas("1 cup lentils", pantry(["rice", "beans"])), false);
});

test("pantryHas: have:false does not satisfy", () => {
  const p: PantryItem[] = [{ kind: "pantry", name: "rice", have: false }];
  assert.equal(pantryHas("2 cups rice", p), false);
});
