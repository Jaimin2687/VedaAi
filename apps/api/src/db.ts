import mongoose from "mongoose";
import { config } from "./config/env";

// Cache the connection across serverless invocations (Vercel warm starts).
// Without this, each request opens a new connection and exhausts the pool.
let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
  conn: null,
  promise: null
};

export const connectDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(config.mongoUri, {
      autoIndex: config.nodeEnv !== "production",
      bufferCommands: false
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};
