import mongoose from "mongoose";
import { config } from "./config/env";

export const connectDatabase = async () => {
  await mongoose.connect(config.mongoUri, {
    autoIndex: config.nodeEnv !== "production"
  });
};
