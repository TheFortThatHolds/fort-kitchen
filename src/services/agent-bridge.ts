// The agent bridge makes AGENTS.md executable. An agent never touches the store
// directly: it submits an ActionEnvelope, the bridge classifies it into a zone,
// applies the Zone Law, and then either performs the write (FULL / PARTIAL) or
// returns an approval request (ASK / unlisted). This is where "agents may tighten
// but never loosen" is enforced in code — the bridge only ever consults the zone
// table; it cannot grant itself more than the household wrote.

import type { ActionEnvelope } from "../domain/action-envelope.ts";
import { resolveAction } from "../domain/action-envelope.ts";
import type { ZoneRule } from "../domain/zone-law.ts";
import type { KitchenEvent } from "../domain/types.ts";
import { KitchenService } from "./kitchen.ts";

export interface BridgeResult {
  status: "done" | "notified" | "awaiting_approval";
  zone: string;
  level: "full" | "partial" | "ask";
  // What actually changed, so the caller can report it verbatim (never guess).
  changed?: unknown;
  // For ASK: the pending request the household must approve.
  approval?: { zone: string; description: string; envelope: ActionEnvelope };
  note?: string;
}

export class AgentBridge {
  private service: KitchenService;
  private zones: ZoneRule[];
  constructor(service: KitchenService, zones: ZoneRule[]) {
    this.service = service;
    this.zones = zones;
  }

  // `perform` is the effect to run for FULL/PARTIAL. It returns "what changed".
  async submit(
    envelope: ActionEnvelope,
    perform: (svc: KitchenService) => Promise<unknown>,
    event?: Omit<KitchenEvent, "occurredAt">,
  ): Promise<BridgeResult> {
    const { decision } = resolveAction(envelope, this.zones);

    if (decision.level === "ask") {
      return {
        status: "awaiting_approval",
        zone: envelope.action.zone,
        level: "ask",
        approval: {
          zone: envelope.action.zone,
          description: envelope.action.description,
          envelope,
        },
        note: decision.rule
          ? `Zone '${envelope.action.zone}' is ASK.`
          : `Zone '${envelope.action.zone}' is unlisted; defaulting to ASK.`,
      };
    }

    const changed = await perform(this.service);

    // Every agent write leaves a ledger trace naming the zone and actor.
    await this.service.logEvent(
      event ?? {
        type: "zone_action",
        actor: envelope.actor,
        payload: {
          zone: envelope.action.zone,
          level: decision.level,
          description: envelope.action.description,
        },
      },
    );

    return decision.level === "full"
      ? { status: "done", zone: envelope.action.zone, level: "full", changed }
      : {
          status: "notified",
          zone: envelope.action.zone,
          level: "partial",
          changed,
          note: "Acted and notified the household.",
        };
  }
}
