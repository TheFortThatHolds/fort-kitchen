// The default zone table, mirroring kitchen/zones.yml. Loaded when a household
// has not stored its own zones. A fork narrows or extends this via the store or
// by editing kitchen/zones.yml during onboarding — but per the agent invariant,
// only the household may loosen a level.

import type { ZoneRule } from "../domain/zone-law.ts";

export const DEFAULT_ZONES: ZoneRule[] = [
  { zone: "meal-suggestions", level: "full", note: "Suggest and rank meals within established household food rules." },
  { zone: "tonight-decision", level: "full", note: "Choose a meal when the household invokes decision-free mode." },
  { zone: "weekly-planning", level: "full", note: "Build and adjust ordinary meal plans inside established rules." },
  { zone: "pantry-routine", level: "full", note: "Record explicit ordinary pantry changes such as present, opened, low, or used." },
  { zone: "pantry-inference", level: "partial", note: "Infer likely pantry use from a recorded cooking event, then notify the household." },
  { zone: "dietary-preferences", level: "partial", note: "Record or adjust ordinary likes, dislikes, rankings, and convenience preferences, then notify." },
  { zone: "dietary-boundaries", level: "ask", note: "Add, remove, or weaken allergies, medical restrictions, religious rules, or hard exclusions." },
  { zone: "substitutions", level: "full", note: "Use substitutions already approved and documented in household rules or recipe history." },
  { zone: "novel-substitutions", level: "partial", note: "Use a new compatible substitution, preserve the original recipe, and report the change." },
  { zone: "recipe-revision", level: "partial", note: "Save a new recipe version after cooking while preserving provenance and the original." },
  { zone: "recipe-import", level: "full", note: "Parse and save recipes supplied by the household without changing their dietary boundaries." },
  { zone: "shopping-list", level: "full", note: "Generate and revise shopping lists from meal plans and pantry state." },
  { zone: "shopping-cart", level: "partial", note: "Prepare a retailer cart without submitting the order." },
  { zone: "purchasing", level: "ask", note: "Place orders, authorize retailer substitutions, or spend money." },
  { zone: "household-members", level: "ask", note: "Add or remove members or change which rules apply to them." },
  { zone: "health-interpretation", level: "ask", note: "Translate medical information into kitchen rules." },
  { zone: "credentials", level: "ask", note: "Create, change, expose, or approve credentials and provider permissions." },
  { zone: "destructive", level: "ask", note: "Delete records, erase history, overwrite originals, or remove storage." },
  { zone: "public-sharing", level: "ask", note: "Publish recipes, household data, or kitchen history to a public surface." },
];
