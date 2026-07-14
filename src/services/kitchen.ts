// The application layer: reads typed records out of the store, runs the
// deterministic domain services, and writes changes back as records + ledger
// events. The HTTP surface and the agent bridge both call through here, so the
// two front doors can never diverge in behavior.

import type { FoodRule } from "../domain/food-rules.ts";
import { deriveShoppingList, makeResolver, type ShoppingResult } from "../domain/shopping.ts";
import { decideTonight, type Rng, type TonightPick } from "../domain/tonight.ts";
import type {
  Appliance,
  KitchenEvent,
  KitchenRecord,
  MealPlan,
  PantryItem,
  Recipe,
} from "../domain/types.ts";
import type { KitchenStore, PutInput } from "../ports/store.ts";

export class KitchenService {
  private store: KitchenStore;
  constructor(store: KitchenStore) {
    this.store = store;
  }

  private async listData<T>(kind: string): Promise<Array<T & { _id: string }>> {
    const recs = (await this.store.list<T>(kind)) as KitchenRecord<T>[];
    return recs.map((r) => ({ ...(r.data as T), _id: r.id }));
  }

  recipes() {
    return this.listData<Recipe>("recipe");
  }
  pantry() {
    return this.listData<PantryItem>("pantry");
  }
  appliances() {
    return this.listData<Appliance>("appliance");
  }

  async foodRules(): Promise<FoodRule[]> {
    return this.listData<FoodRule>("foodrule");
  }

  async tonight(opts: { includeExceptions?: boolean; rng?: Rng } = {}): Promise<TonightPick | null> {
    const [recipes, rules, pantry] = await Promise.all([
      this.recipes(),
      this.foodRules(),
      this.pantry(),
    ]);
    return decideTonight(recipes, rules, pantry, opts);
  }

  async shoppingFor(mealLabels: string[]): Promise<ShoppingResult> {
    const [recipes, pantry] = await Promise.all([this.recipes(), this.pantry()]);
    return deriveShoppingList(mealLabels, makeResolver(recipes), pantry);
  }

  async mealPlan(weekOf: string): Promise<MealPlan | null> {
    const plans = await this.store.list<MealPlan>("mealplan");
    return plans.find((p) => p.data.weekOf === weekOf)?.data ?? null;
  }

  // Generic write used by both front doors; always records a ledger event.
  async save<T extends { kind: string }>(
    input: PutInput<T>,
    event?: Omit<KitchenEvent, "occurredAt">,
  ): Promise<KitchenRecord<T>> {
    const rec = await this.store.put<T>(input);
    if (event) await this.store.append({ ...event, occurredAt: rec.updatedAt });
    return rec;
  }

  async delete(id: string, actor = "user"): Promise<void> {
    await this.store.remove(id);
    await this.store.append({
      type: "recipe_changed",
      occurredAt: new Date().toISOString(),
      actor,
      payload: { deleted: id },
    });
  }

  async logEvent(event: Omit<KitchenEvent, "occurredAt">): Promise<void> {
    await this.store.append({ ...event, occurredAt: new Date().toISOString() });
  }

  ledger() {
    return this.store.events();
  }
}
