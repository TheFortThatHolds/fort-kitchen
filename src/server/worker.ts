// Cloudflare Worker entry — the deployment the reference kitchen runs on.
// Bring your own KV namespace (see wrangler.jsonc). No Fort credentials, no
// hidden dependency on Fort infrastructure: a fork deploys this to its own
// Cloudflare account and owns every byte.

import { KVStore, type KVLike } from "../adapters/store-kv.ts";
import { KitchenService } from "../services/kitchen.ts";
import { loadZones } from "../config/zones.ts";
import { handle } from "./router.ts";

export interface Env {
  KITCHEN: KVLike; // KV namespace binding
  KITCHEN_NS?: string; // optional namespace prefix (host many households)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.KITCHEN) {
      return new Response("KV binding 'KITCHEN' is not configured. See wrangler.jsonc.", {
        status: 500,
      });
    }
    const store = new KVStore(env.KITCHEN, env.KITCHEN_NS ?? "kitchen");
    const service = new KitchenService(store);
    const zones = await loadZones(store);
    return handle(request, service, zones);
  },
};
