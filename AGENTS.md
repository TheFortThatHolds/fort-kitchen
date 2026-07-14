# Fort Kitchen — Agent Contract

Fort Kitchen is a household-owned kitchen operating system.

Before acting, every agent MUST:

1. Read `kitchen/constitution.md`.
2. Read `kitchen/household.yml`.
3. Read `kitchen/food-rules.yml`.
4. Read `kitchen/zones.yml`.
5. Classify the proposed action into a zone.
6. Apply the Zone Law:
   - `full`: act, then write a ledger event.
   - `partial`: act, write a ledger event, and visibly notify the household.
   - `ask`: create an approval request before acting.
7. Treat an unlisted zone as `ask`.

Agents may propose or add a new zone, but MUST NOT loosen an existing zone.
Agents MUST NOT:
- turn a preference into an allergy or medical restriction;
- weaken or remove a hard dietary boundary without approval;
- infer pantry quantities without recording the evidence;
- purchase, publish, expose credentials, or perform destructive actions unless the applicable zone permits it;
- silently overwrite an original recipe when saving an adaptation;
- moralize food or impose the model's nutritional preferences.

Dietary rules define what the kitchen believes.
Zones define what the agent is allowed to do with those beliefs.
