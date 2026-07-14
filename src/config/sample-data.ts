// Sample data — clearly sample. Loaded only by the local runner and tests. This
// is NOT a household's real kitchen and imposes NO diet: the one example food
// rule is a nut allergy (a boundary anyone would recognize), included to show
// how the exception gate reads. Delete it and the kitchen imposes nothing.

import type { KitchenService } from "../services/kitchen.ts";
import { BREAD_PHOTO } from "./bread-photo.ts";

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
      // A real recipe, shared with permission — Jimmy's Applesauce & Steam Bread
      // (vegan / gluten-free / oil-free). Kept here as a working starter recipe
      // so a fresh fork opens with something genuinely cookable.
      name: "Applesauce & Steam Bread",
      category: "bread",
      servings: 2,
      ingredients: [
        "1 cup King Arthur gluten-free bread flour",
        "1 cup warm water",
        "1 1/2 tsp active dry yeast",
        "2 cups water",
        "1/2 tbsp active dry yeast",
        "2 cups applesauce",
        "1 tsp salt",
        "gluten-free bread flour, added by feel",
        "a handful of ice cubes",
      ],
      steps: [
        "Mix 1 cup gluten-free flour, the warm water, and the heaping teaspoon of yeast into a loose mud. Rest 1-2 hours until it breathes a soft sourness.",
        "Stir in the 2 cups water, the second yeast, the applesauce, and the salt until dissolved.",
        "Fold in more gluten-free bread flour slowly. Stop while it's still wet and nearly sticky — heavy hydration is what lets it survive the high heat.",
        "Cover with clean wet towels and let it rise under the damp weight.",
        "At least an hour before baking, put a pizza stone on a middle rack and a sacrificial metal pan on the bottom rack. Heat the oven to 500F and let the stone fully absorb the heat.",
        "Turn the risen dough out, shape into 2 large loaves (or 4 small), slash the tops, and move onto the hot stone.",
        "Toss the ice into the bottom pan and shut the door fast — the steam keeps the surface flexible so the loaves expand without tearing.",
        "Bake without opening the door: 30 minutes for 2 large loaves (20 for small), until deeply colored and hollow-sounding on the bottom.",
        "Cool completely before slicing so the crumb sets.",
      ],
      notes: ["Keep the dough wet, nearly sticky — do not over-flour it."],
      photo: BREAD_PHOTO,
    },
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
