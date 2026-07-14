import type { ZoneAction, ZoneDecision, ZoneRule } from "./zone-law";
import { decideZone } from "./zone-law";

export interface ActionEnvelope<TPayload = unknown> {
  id: string;
  createdAt: string;
  actor: string;
  action: ZoneAction;
  payload: TPayload;
}

export interface ActionResolution<TPayload = unknown> {
  envelope: ActionEnvelope<TPayload>;
  decision: ZoneDecision;
}

export function resolveAction<TPayload>(
  envelope: ActionEnvelope<TPayload>,
  zones: ZoneRule[],
): ActionResolution<TPayload> {
  return {
    envelope,
    decision: decideZone(envelope.action, zones),
  };
}
