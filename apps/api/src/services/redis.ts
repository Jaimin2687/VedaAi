import IORedis, { type RedisOptions } from "ioredis";
import { config } from "../config/env";

const useTls = config.redisUrl.startsWith("rediss://");
const redisOptions: RedisOptions = {
  enableReadyCheck: false,
  ...(useTls ? { tls: {} } : {}),
  // Lazy connect: don't open a TCP socket until the first command.
  // This prevents the module-level instantiation from crashing the
  // Vercel serverless function during cold start.
  lazyConnect: true
};

export const redis = new IORedis(config.redisUrl, redisOptions);
export const redisPub = new IORedis(config.redisUrl, redisOptions);
export const redisSub = new IORedis(config.redisUrl, redisOptions);

redis.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Redis error", error);
});

redisPub.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Redis pub error", error);
});

redisSub.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Redis sub error", error);
});
