import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryStore } from "../src/adapters/store-memory.ts";
import { KitchenService } from "../src/services/kitchen.ts";
import { AgentBridge } from "../src/services/agent-bridge.ts";
import { loadZones } from "../src/config/zones.ts";
import { DEFAULT_ZONES } from "../src/config/default-zones.ts";
import type { ActionEnvelope } from "../src/domain/action-envelope.ts";

function envelope(zone: string, description: string): ActionEnvelope {
  return {
    id: "env-1",
    createdAt: "2026-07-14T00:00:00Z",
    actor: "test-agent",
    action: { zone, description },
    payload: {},
  };
}

test("FULL agent action performs the write and logs an event", async () => {
  const store = new MemoryStore();
  const svc = new KitchenService(store);
  const bridge = new AgentBridge(svc, DEFAULT_ZONES);

  const res = await bridge.submit(
    envelope("recipe-import", "Import a recipe the household pasted"),
    (s) => s.save({ kind: "recipe", data: { kind: "recipe", name: "Soup", ingredients: ["water"] } as never }),
  );

  assert.equal(res.status, "done");
  assert.equal(res.level, "full");
  assert.equal((await svc.recipes()).length, 1);
  const events = await svc.ledger();
  assert.ok(events.some((e) => e.type === "zone_action"));
});

test("ASK agent action does NOT write and returns an approval request", async () => {
  const store = new MemoryStore();
  const svc = new KitchenService(store);
  const bridge = new AgentBridge(svc, DEFAULT_ZONES);

  const res = await bridge.submit(
    envelope("dietary-boundaries", "Remove the peanut allergy rule"),
    (s) => s.save({ kind: "foodrule", data: { kind: "foodrule" } as never }),
  );

  assert.equal(res.status, "awaiting_approval");
  assert.equal(res.level, "ask");
  assert.ok(res.approval);
  assert.equal((await store.list()).length, 0); // nothing was written
});

test("a stored zone may tighten a default but never loosen it", async () => {
  const store = new MemoryStore();
  const svc = new KitchenService(store);

  // Household tightens meal-suggestions (full) to ask, and tries to loosen
  // purchasing (ask) to full.
  await svc.save({ kind: "zone", data: { kind: "zone", zone: "meal-suggestions", level: "ask", note: "tighten" } as never });
  await svc.save({ kind: "zone", data: { kind: "zone", zone: "purchasing", level: "full", note: "attempt loosen" } as never });

  const zones = await loadZones(store);
  const meal = zones.find((z) => z.zone === "meal-suggestions");
  const purchasing = zones.find((z) => z.zone === "purchasing");

  assert.equal(meal?.level, "ask"); // tightened — allowed
  assert.equal(purchasing?.level, "ask"); // loosen attempt ignored — stays ask
});
