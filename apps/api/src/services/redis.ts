import IORedis, { type RedisOptions } from "ioredis";
import { config } from "../config/env";

const useTls = config.redisUrl.startsWith("rediss://");
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(useTls ? { tls: {} } : {})
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
