// Cloudflare KV adapter — mirrors how the reference kitchen actually persists:
// each record is one KV key, the event ledger is an appendable list. Bring your
// own KV namespace (wrangler.jsonc); this holds no Fort credentials and no hard
// dependency on Fort infrastructure.
//
// Keys are namespaced so one namespace can host many households:
//   <ns>:rec:<kind>:<id>     -> KitchenRecord JSON
//   <ns>:events               -> KitchenEvent[] JSON (append-only)

import type { KitchenEvent, KitchenRecord } from "../domain/types.ts";
import { type Clock, type KitchenStore, type PutInput, systemClock } from "../ports/store.ts";

// Minimal shape of a Cloudflare KV binding — declared locally so this file
// needs no @cloudflare/workers-types to typecheck in a plain-node fork.
export interface KVLike {
  get(key: string, type: "json"): Promise<unknown>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(opts: { prefix: string; cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

export class KVStore implements KitchenStore {
  private kv: KVLike;
  private ns: string;
  private clock: Clock;
  constructor(kv: KVLike, ns = "kitchen", clock: Clock = systemClock) {
    this.kv = kv;
    this.ns = ns;
    this.clock = clock;
  }

  private recKey(kind: string, id: string) {
    return `${this.ns}:rec:${kind}:${id}`;
  }
  private idPrefix() {
    return `${this.ns}:rec:`;
  }
  private eventsKey() {
    return `${this.ns}:events`;
  }

  async list<T>(kind?: string): Promise<KitchenRecord<T>[]> {
    const prefix = kind ? `${this.ns}:rec:${kind}:` : this.idPrefix();
    const out: KitchenRecord<T>[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.kv.list({ prefix, cursor });
      for (const k of page.keys) {
        const rec = (await this.kv.get(k.name, "json")) as KitchenRecord<T> | null;
        if (rec) out.push(rec);
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return out;
  }

  async get<T>(id: string): Promise<KitchenRecord<T> | null> {
    // Id alone doesn't carry the kind, so scan the id space. Records are few per
    // household; a fork at scale can add a kind index.
    let cursor: string | undefined;
    do {
      const page = await this.kv.list({ prefix: this.idPrefix(), cursor });
      for (const k of page.keys) {
        if (k.name.endsWith(`:${id}`)) {
          return (await this.kv.get(k.name, "json")) as KitchenRecord<T> | null;
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return null;
  }

  async put<T>(input: PutInput<T>): Promise<KitchenRecord<T>> {
    const now = this.clock();
    const existing = input.id ? await this.get<T>(input.id) : null;
    const record: KitchenRecord<T> = {
      id: input.id ?? crypto.randomUUID(),
      kind: input.kind,
      data: input.data,
      source: input.source ?? "user",
      confidence: input.confidence ?? "confirmed",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.kv.put(this.recKey(record.kind, record.id), JSON.stringify(record));
    return record;
  }

  async remove(id: string): Promise<void> {
    const rec = await this.get(id);
    if (rec) await this.kv.delete(this.recKey(rec.kind, rec.id));
  }

  async append(event: KitchenEvent): Promise<void> {
    const current = ((await this.kv.get(this.eventsKey(), "json")) as KitchenEvent[] | null) ?? [];
    current.push(event);
    await this.kv.put(this.eventsKey(), JSON.stringify(current));
  }

  async events(): Promise<KitchenEvent[]> {
    return ((await this.kv.get(this.eventsKey(), "json")) as KitchenEvent[] | null) ?? [];
  }
}
