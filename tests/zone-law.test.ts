import { test } from "node:test";
import assert from "node:assert/strict";
import { decideZone, type ZoneRule } from "../src/domain/zone-law.ts";

const zones: ZoneRule[] = [
  { zone: "meal-suggestions", level: "full", note: "Suggest meals inside established rules." },
  { zone: "dietary-boundaries", level: "ask", note: "Never weaken a hard boundary without approval." },
  {
    zone: "purchasing",
    level: "full",
    note: "scoped",
    scope: { retailer: "shop-a", maximum_total: 40 },
  },
];

test("FULL zone resolves to act-and-ledger", () => {
  assert.equal(decideZone({ zone: "meal-suggestions", description: "Choose dinner" }, zones).level, "full");
});

test("ASK zone resolves to request-approval", () => {
  assert.equal(decideZone({ zone: "dietary-boundaries", description: "Remove gluten exclusion" }, zones).level, "ask");
});

test("unlisted action defaults to ASK", () => {
  assert.equal(decideZone({ zone: "unlisted-action", description: "Unknown" }, zones).level, "ask");
});

test("scoped rule is fail-closed: a partial scope declaration does not match", () => {
  // The rule is scoped to maximum_total<=40; an action that never declares the
  // amount must NOT inherit the permission.
  const d = decideZone({ zone: "purchasing", description: "buy", scope: { retailer: "shop-a" } }, zones);
  assert.equal(d.level, "ask");
});

test("scoped rule matches when the action declares the full scope", () => {
  const d = decideZone(
    { zone: "purchasing", description: "buy", scope: { retailer: "shop-a", maximum_total: 40 } },
    zones,
  );
  assert.equal(d.level, "full");
});
