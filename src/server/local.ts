// Local runner — the zero-service fork. `npm start` serves the whole app from an
// in-memory store seeded with sample data, no accounts, no cloud, no keys. This
// is the "works without AI, works without paid services" promise made runnable.
//
// Uses Node's built-in fetch server (node:http) with the Web Request/Response
// the shared router already speaks.

import { createServer } from "node:http";
import { MemoryStore } from "../adapters/store-memory.ts";
import { KitchenService } from "../services/kitchen.ts";
import { DEFAULT_ZONES } from "../config/default-zones.ts";
import { seedSample } from "../config/sample-data.ts";
import { handle } from "./router.ts";

const port = Number(process.env.PORT ?? 8787);
const store = new MemoryStore();
const service = new KitchenService(store);
await seedSample(service);

const server = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: body && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
  });

  const response = await handle(request, service, DEFAULT_ZONES);
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(port, () => {
  console.log(`Fort Kitchen (local, in-memory) → http://localhost:${port}`);
  console.log("Sample data loaded. No accounts, no cloud, no keys.");
});
