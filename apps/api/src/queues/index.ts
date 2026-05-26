import { Queue } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";
import { config } from "../config/env";

const useTls = config.redisUrl.startsWith("rediss://");
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(useTls ? { tls: {} } : {}),
  // Lazy connect: don't open a TCP socket until the first command.
  // This prevents the module-level instantiation from crashing the
  // Vercel serverless function during cold start.
  lazyConnect: true
};

export const queueConnection = new IORedis(config.redisUrl, redisOptions);

queueConnection.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Redis queue error", error);
});

export const generationQueue = new Queue("generation", { connection: queueConnection });
export const pdfQueue = new Queue("pdf", { connection: queueConnection });
