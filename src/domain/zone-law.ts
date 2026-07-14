export type ZoneLevel = "full" | "partial" | "ask";

export interface ZoneScope {
  [key: string]: unknown;
}

export interface ZoneRule {
  zone: string;
  level: ZoneLevel;
  note: string;
  scope?: ZoneScope;
}

export interface ZoneAction {
  zone: string;
  description: string;
  evidence?: string;
  scope?: ZoneScope;
}

export type ZoneDecision =
  | { level: "full"; behavior: "act_and_ledger"; rule: ZoneRule }
  | { level: "partial"; behavior: "act_ledger_and_notify"; rule: ZoneRule }
  | { level: "ask"; behavior: "request_approval"; rule?: ZoneRule };

function scopeMatches(ruleScope: ZoneScope | undefined, actionScope: ZoneScope | undefined): boolean {
  if (!ruleScope) return true;
  if (!actionScope) return false;

  return Object.entries(ruleScope).every(([key, expected]) => {
    const actual = actionScope[key];

    if (Array.isArray(expected)) {
      return Array.isArray(actual)
        ? expected.every((value) => actual.includes(value))
        : expected.includes(actual);
    }

    return actual === expected;
  });
}

export function decideZone(
  action: ZoneAction,
  zones: ZoneRule[],
): ZoneDecision {
  const candidates = zones.filter(
    (rule) => rule.zone === action.zone && scopeMatches(rule.scope, action.scope),
  );

  // Prefer the most specifically scoped matching rule.
  const rule = candidates.sort(
    (a, b) => Object.keys(b.scope ?? {}).length - Object.keys(a.scope ?? {}).length,
  )[0];

  if (!rule) {
    return { level: "ask", behavior: "request_approval" };
  }

  if (rule.level === "full") {
    return { level: "full", behavior: "act_and_ledger", rule };
  }

  if (rule.level === "partial") {
    return { level: "partial", behavior: "act_ledger_and_notify", rule };
  }

  return { level: "ask", behavior: "request_approval", rule };
}
