# Fort Kitchen

**A forkable, agent-native kitchen operating system.**

Fort Kitchen is not merely a recipe box or meal planner. It gives a person and their chosen AI agent a shared, durable model of the kitchen: what food they actually eat, what is in the house, what equipment they own, what they planned, what they cooked, and what needs to be bought next.

Fork the repository, hand it to your agent, answer the onboarding questions, and let the agent configure a kitchen system around your actual household.

## What it does

- **Tonight:** chooses a meal from what the household permits and can realistically make.
- **Week:** builds a meal plan and derives a shopping list from the gap between recipes and pantry.
- **Recipes:** stores structured ingredients, steps, categories, notes, substitutions, and equipment settings.
- **Pantry:** tracks presence, quantity, location, opened state, and audit history.
- **Gear:** links appliances and their settings to recipes without making appliances own the recipes.
- **Capture:** turns pasted recipes, photos, screenshots, or natural-language notes into structured records.
- **Cook with an agent:** supports a hands-free voice or text companion that can read recipes, answer pantry questions, and update records through explicit tools.

## The central rule

**The user owns the kitchen truth. The agent helps maintain it.**

Fort Kitchen must never silently replace dietary rules, pantry facts, recipe text, or household preferences with model guesses. Inferences may be proposed; only confirmed facts become durable kitchen state.

## Public architecture

The public version separates four concerns:

1. **Kitchen Core** — canonical records and business rules.
2. **Kitchen Surface** — the phone-first web/PWA interface.
3. **Agent Bridge** — a small, explicit tool contract for any compatible agent.
4. **Adapters** — storage, model, authentication, image extraction, and voice providers.

This means a fork can run:

- locally with JSON or SQLite,
- on Cloudflare with D1/KV/R2,
- against a private memory system,
- with no AI at all,
- or with the owner's preferred agent and model provider.

See [`docs/PUBLIC_ARCHITECTURE.md`](docs/PUBLIC_ARCHITECTURE.md).

## Fork onboarding

The repository is designed so an owner can tell an agent:

> Read `AGENT_INSTALL.md`. Interview me only for facts you cannot safely infer. Configure this fork as my household kitchen system. Do not preserve the example household's diet, voice, branding, or credentials unless I explicitly choose them.

The onboarding process creates a private household configuration from the public templates. See [`AGENT_INSTALL.md`](AGENT_INSTALL.md).

## What belongs in the public repository

- schemas and interfaces;
- generic kitchen logic;
- onboarding questions;
- sample data clearly marked as sample data;
- replaceable adapters;
- a reference UI;
- tests for pantry, planning, recipe, and shopping-list behavior;
- deployment recipes that require the owner to supply their own accounts and secrets.

## What never belongs here

- the reference household's live pantry;
- private recipes without publication permission;
- API keys, access tokens, or identity credentials;
- private memory records;
- hidden dependencies on The Fort That Holds infrastructure;
- a hard-coded diet, persona, religion, culture, or household structure.

## Reference implementation

Fort Kitchen grew from a private phone-first system inside Fort Memory Core. That system currently includes decision-free meal selection, weekly planning, pantry reconciliation, shopping-list generation, recipe extraction, appliance links, photo-assisted pantry loading, and a live cooking agent.

The public repository extracts those capabilities into portable contracts while keeping the private household data private.

## Project status

Architecture and public extraction are beginning here. The first implementation target is a complete local-first fork that works without paid services, followed by optional Cloudflare and agent/voice adapters.

## License

License decision pending. Choose one before accepting outside contributions or encouraging commercial redistribution.