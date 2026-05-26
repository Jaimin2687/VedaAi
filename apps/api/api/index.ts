import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDatabase } from "../src/db";

// Lazily cached Express app — created on the first invocation and
// reused across warm starts. Avoids module-level side-effects that
// can crash the serverless cold-start.
let app: ReturnType<typeof import("../src/app").createApp> | null = null;

const getApp = () => {
  if (!app) {
    // Dynamic require so the full import tree (routes → redis → queues)
    // only runs once we know env config parsed successfully.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createApp } = require("../src/app") as typeof import("../src/app");
    app = createApp();
  }
  return app;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDatabase();
    const expressApp = getApp();
    return expressApp(req as any, res as any);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Handler error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
