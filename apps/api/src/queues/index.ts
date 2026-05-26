import { Queue } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";
import { config } from "../config/env";

const useTls = config.redisUrl.startsWith("rediss://");
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(useTls ? { tls: {} } : {})
};

export const queueConnection = new IORedis(config.redisUrl, redisOptions);

queueConnection.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Redis queue error", error);
});

export const generationQueue = new Queue("generation", { connection: queueConnection });
export const pdfQueue = new Queue("pdf", { connection: queueConnection });
