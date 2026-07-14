# Zone-aware onboarding

The onboarding interface should collect two separate decisions.

## 1. What is the rule?

For each dietary choice:

- Who does it apply to?
- Is it an exclusion, warning, avoidance, preference, or requirement?
- Why does it exist?
- Where did the information come from?

## 2. How much authority does the agent have?

Natural-language choices compile to zone levels:

- “Manage this automatically” -> FULL
- “Change it, then tell me” -> PARTIAL
- “Never change this without asking” -> ASK

Recommended defaults:

- Allergies and medical restrictions -> dietary-boundaries / ASK
- Religious and ethical hard boundaries -> dietary-boundaries / ASK
- Ordinary likes and dislikes -> dietary-preferences / PARTIAL
- Applying established rules to suggestions -> meal-suggestions / FULL
- Preparing shopping lists -> shopping-list / FULL
- Spending money -> purchasing / ASK

The user does not need to understand the underlying architecture to use it.
The interface should always show the compiled rule and permission before saving onboarding.
