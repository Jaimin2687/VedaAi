import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/db";

const app = createApp();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Connect to DB on each invocation — cached after the first call.
  // Do NOT call initSocket() or initPubSub() here — they require a persistent
  // server process and are incompatible with Vercel serverless functions.
  await connectDatabase();
  return app(req as any, res as any);
}
