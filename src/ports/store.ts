// The one port every adapter implements. Kitchen services depend on this, never
// on a concrete database. Swap the adapter (memory, JSON file, SQLite,
// Cloudflare KV, a private memory core) without touching the domain.

import type { KitchenEvent, KitchenRecord } from "../domain/types.ts";

export interface KitchenStore {
  list<T = Record<string, unknown>>(kind?: string): Promise<KitchenRecord<T>[]>;
  get<T = Record<string, unknown>>(id: string): Promise<KitchenRecord<T> | null>;
  put<T = Record<string, unknown>>(record: PutInput<T>): Promise<KitchenRecord<T>>;
  remove(id: string): Promise<void>;
  append(event: KitchenEvent): Promise<void>;
  events(): Promise<KitchenEvent[]>;
}

export interface PutInput<T = Record<string, unknown>> {
  id?: string; // omit to create; supply to update
  kind: string;
  data: T;
  source?: KitchenRecord["source"];
  confidence?: KitchenRecord["confidence"];
}

// A monotonic-ish clock the adapters share so tests can inject a fixed time.
export type Clock = () => string;
export const systemClock: Clock = () => new Date().toISOString();
