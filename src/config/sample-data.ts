// Sample data — clearly sample. Loaded only by the local runner and tests. This
// is NOT a household's real kitchen and imposes NO diet: the one example food
// rule is a nut allergy (a boundary anyone would recognize), included to show
// how the exception gate reads. Delete it and the kitchen imposes nothing.

import type { KitchenService } from "../services/kitchen.ts";

export async function seedSample(service: KitchenService): Promise<void> {
  // One example boundary rule. Category/treatment show the shape; not a default.
  await service.save({
    kind: "foodrule",
    data: {
      kind: "foodrule",
      id: "nuts-example",
      subject: "peanuts",
      treatment: "exclude",
      category: "allergy",
      applies_to: { members: ["primary"] },
      change_zone: "dietary-boundaries",
      source: { type: "user", evidence: "sample data — replace during onboarding" },
    } as never,
  });

  const recipes = [
    {
      name: "Weeknight Chili",
      category: "dinner",
      ingredients: ["1 can black beans", "1 can kidney beans", "1 onion", "1 tbsp chili powder", "1 can diced tomatoes", "salt to taste"],
      steps: ["Sauté the onion.", "Add everything else.", "Simmer 20 minutes."],
    },
    {
      name: "Fried Rice",
      category: "dinner",
      ingredients: ["2 cups cooked rice", "1 cup frozen peas", "2 cloves garlic", "2 tbsp soy sauce", "1 carrot"],
      steps: ["Heat the pan.", "Fry aromatics, add rice.", "Season and toss."],
    },
    {
      name: "Peanut Noodles",
      category: "dinner",
      ingredients: ["8 oz noodles", "3 tbsp peanut butter", "2 tbsp soy sauce", "1 clove garlic"],
      steps: ["Cook noodles.", "Whisk sauce.", "Combine."],
      // No explicit exception set — the nut rule derives it automatically.
    },
  ];
  for (const r of recipes) {
    await service.save({ kind: "recipe", data: { kind: "recipe", ...r } as never });
  }

  const pantry = ["black beans", "kidney beans", "onion", "chili powder", "diced tomatoes", "cooked rice", "garlic", "soy sauce"];
  for (const name of pantry) {
    await service.save({ kind: "pantry", data: { kind: "pantry", name, have: true } as never });
  }
}
