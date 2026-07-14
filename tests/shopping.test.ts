import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveShoppingList, makeResolver } from "../src/domain/shopping.ts";
import type { PantryItem, Recipe } from "../src/domain/types.ts";

const recipes: Recipe[] = [
  { kind: "recipe", name: "Chili", ingredients: ["1 can black beans", "1 onion", "1 tbsp chili powder"] },
  { kind: "recipe", name: "Fried Rice", ingredients: ["2 cups cooked rice", "1 carrot"] },
];

test("derives only ingredients the pantry lacks, deduped", () => {
  const pantry: PantryItem[] = [{ kind: "pantry", name: "onion", have: true }];
  const res = deriveShoppingList(["Chili", "Fried Rice"], makeResolver(recipes), pantry);
  assert.deepEqual(res.need, ["1 can black beans", "1 tbsp chili powder", "2 cups cooked rice", "1 carrot"]);
  assert.deepEqual(res.unmatched, []);
});

test("unmatched meal labels are reported, not dropped", () => {
  const res = deriveShoppingList(["Chili", "Mystery Stew"], makeResolver(recipes), []);
  assert.deepEqual(res.unmatched, ["Mystery Stew"]);
});

test("fully-stocked week needs nothing", () => {
  const pantry: PantryItem[] = [
    { kind: "pantry", name: "black beans", have: true },
    { kind: "pantry", name: "onion", have: true },
    { kind: "pantry", name: "chili powder", have: true },
  ];
  const res = deriveShoppingList(["Chili"], makeResolver(recipes), pantry);
  assert.deepEqual(res.need, []);
});
