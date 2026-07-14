import { decideZone, type ZoneRule } from "../src/domain/zone-law";

const zones: ZoneRule[] = [
  {
    zone: "meal-suggestions",
    level: "full",
    note: "Suggest meals inside established rules.",
  },
  {
    zone: "dietary-boundaries",
    level: "ask",
    note: "Never weaken a hard boundary without approval.",
  },
];

console.assert(
  decideZone(
    { zone: "meal-suggestions", description: "Choose dinner" },
    zones,
  ).level === "full",
);

console.assert(
  decideZone(
    { zone: "dietary-boundaries", description: "Remove gluten exclusion" },
    zones,
  ).level === "ask",
);

console.assert(
  decideZone(
    { zone: "unlisted-action", description: "Unknown operation" },
    zones,
  ).level === "ask",
);
