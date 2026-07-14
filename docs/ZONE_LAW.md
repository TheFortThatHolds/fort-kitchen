# Kitchen Zone Law

Fort Kitchen uses a web of permission zones rather than one global autonomy setting.

## The three levels

### FULL

The agent acts without interruption and writes a ledger event.

### PARTIAL

The agent acts, writes a ledger event, and tells the household what changed.

### ASK

The agent creates an approval request and does not perform the action until approved.

Unlisted actions default to ASK.

## Rule versus permission

A food rule answers:

> How should this kitchen treat this food, ingredient, constraint, or preference?

A zone answers:

> What may the agent do without asking first?

Example:

- `gluten: exclude` is a food rule.
- Applying that exclusion during meal selection belongs to `meal-suggestions`, which may be FULL.
- Removing the exclusion belongs to `dietary-boundaries`, which should normally be ASK.

## Scoped zones

Implementations may narrow a zone by household member, pantry location, retailer, amount, appliance, or another explicit scope.

```yaml
- zone: purchasing
  level: full
  scope:
    retailer: example-store
    maximum_total: 40
    submit_order: false
```

A scoped permission never grants authority outside its declared scope.

## Agent invariant

Agents may make the web more specific by proposing or adding a zone.
Agents may not loosen an existing zone.
Only the household may grant more authority.
