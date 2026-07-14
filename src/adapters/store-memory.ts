// Local-first, zero-service adapter. Holds records and events in memory and can
// serialize to / from a plain JSON snapshot — enough to back a full fork that
// runs with no accounts and no paid services. A file-backed adapter is this plus
// read/write to disk.

import type { KitchenEvent, KitchenRecord } from "../domain/types.ts";
import { type Clock, type KitchenStore, type PutInput, systemClock } from "../ports/store.ts";

export interface MemorySnapshot {
  records: KitchenRecord[];
  events: KitchenEvent[];
}

let counter = 0;

export class MemoryStore implements KitchenStore {
  private records = new Map<string, KitchenRecord>();
  private log: KitchenEvent[] = [];
  private clock: Clock;
  private newId: () => string;

  constructor(opts: { clock?: Clock; snapshot?: MemorySnapshot; idFactory?: () => string } = {}) {
    this.clock = opts.clock ?? systemClock;
    this.newId = opts.idFactory ?? (() => `rec_${(++counter).toString(36)}_${this.clock()}`);
    if (opts.snapshot) {
      for (const r of opts.snapshot.records) this.records.set(r.id, r);
      this.log = [...opts.snapshot.events];
    }
  }

  async list<T>(kind?: string): Promise<KitchenRecord<T>[]> {
    const all = [...this.records.values()] as KitchenRecord<T>[];
    return kind ? all.filter((r) => r.kind === kind) : all;
  }

  async get<T>(id: string): Promise<KitchenRecord<T> | null> {
    return (this.records.get(id) as KitchenRecord<T>) ?? null;
  }

  async put<T>(input: PutInput<T>): Promise<KitchenRecord<T>> {
    const now = this.clock();
    const existing = input.id ? this.records.get(input.id) : undefined;
    const record: KitchenRecord<T> = {
      id: input.id ?? this.newId(),
      kind: input.kind,
      data: input.data,
      source: input.source ?? "user",
      confidence: input.confidence ?? "confirmed",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.records.set(record.id, record as KitchenRecord);
    return record;
  }

  async remove(id: string): Promise<void> {
    this.records.delete(id);
  }

  async append(event: KitchenEvent): Promise<void> {
    this.log.push(event);
  }

  async events(): Promise<KitchenEvent[]> {
    return [...this.log];
  }

  snapshot(): MemorySnapshot {
    return { records: [...this.records.values()], events: [...this.log] };
  }
}
