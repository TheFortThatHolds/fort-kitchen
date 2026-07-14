// One request handler, shared by the Cloudflare Worker and the local Node runner
// so the two deployments can never behave differently. Framework-free: it speaks
// the Web Fetch API (Request -> Response), which both runtimes provide.
//
// Two front doors, by design:
//   /api/*        — the household's own surface. The household is never gated
//                   (the human owns the kitchen truth), so these write directly.
//   /api/agent/*  — anything acting FOR the household. Routed through the Zone
//                   Law via the AgentBridge; ASK actions return an approval
//                   request instead of writing.

import type { ActionEnvelope } from "../domain/action-envelope.ts";
import { AgentBridge } from "../services/agent-bridge.ts";
import { KitchenService } from "../services/kitchen.ts";
import type { ZoneRule } from "../domain/zone-law.ts";
import { renderApp } from "./ui.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function handle(
  request: Request,
  service: KitchenService,
  zones: ZoneRule[],
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const bridge = new AgentBridge(service, zones);

  try {
    // ----- UI ------------------------------------------------------------------
    if (path === "/" && method === "GET") {
      return new Response(renderApp(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/api/state" && method === "GET") {
      const [recipes, pantry, appliances, rules] = await Promise.all([
        service.recipes(),
        service.pantry(),
        service.appliances(),
        service.foodRules(),
      ]);
      return json({ recipes, pantry, appliances, rules, zones });
    }

    // ----- Household writes (direct) ------------------------------------------
    if (path === "/api/records" && method === "POST") {
      const body = (await request.json()) as {
        id?: string;
        kind: string;
        data: Record<string, unknown>;
      };
      if (!body?.kind || !body?.data) return json({ error: "kind and data required" }, 400);
      const rec = await service.save(
        { id: body.id, kind: body.kind, data: { ...body.data, kind: body.kind } as never },
        { type: "recipe_changed", actor: "user", payload: { kind: body.kind, id: body.id } },
      );
      return json({ record: rec });
    }

    const delMatch = path.match(/^\/api\/records\/(.+)$/);
    if (delMatch && method === "DELETE") {
      await service.delete(decodeURIComponent(delMatch[1]));
      return json({ ok: true });
    }

    // ----- Tonight -------------------------------------------------------------
    if (path === "/api/tonight" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { includeExceptions?: boolean };
      const pick = await service.tonight({ includeExceptions: !!body.includeExceptions });
      return json({ pick });
    }

    // ----- Shopping ------------------------------------------------------------
    if (path === "/api/shopping" && method === "POST") {
      const body = (await request.json()) as { meals?: string[] };
      const result = await service.shoppingFor(body.meals ?? []);
      return json(result);
    }

    // ----- Meal plan -----------------------------------------------------------
    if (path === "/api/plan" && method === "GET") {
      const weekOf = url.searchParams.get("weekOf") ?? "";
      return json({ plan: await service.mealPlan(weekOf) });
    }

    // ----- Ledger --------------------------------------------------------------
    if (path === "/api/ledger" && method === "GET") {
      return json({ events: await service.ledger() });
    }

    // ----- Agent bridge (zone-law gated) --------------------------------------
    if (path === "/api/agent/act" && method === "POST") {
      const body = (await request.json()) as {
        envelope: ActionEnvelope;
        // Only record-write effects are exposed to agents over HTTP; the effect
        // is described declaratively so the server, not the agent, performs it.
        effect?: { op: "put"; kind: string; data: Record<string, unknown>; id?: string };
      };
      if (!body?.envelope?.action?.zone) return json({ error: "envelope.action.zone required" }, 400);

      const result = await bridge.submit(body.envelope, async (svc) => {
        if (body.effect?.op === "put") {
          const rec = await svc.save({
            id: body.effect.id,
            kind: body.effect.kind,
            data: { ...body.effect.data, kind: body.effect.kind } as never,
          });
          return { record: rec };
        }
        return { noop: true };
      });
      return json(result);
    }

    return json({ error: "not found", path }, 404);
  } catch (err) {
    return json({ error: (err as Error).message ?? "error" }, 500);
  }
}
