import http from "http";
import { createApp } from "./app";
import { connectDatabase } from "./db";
import { config } from "./config/env";
import { initSocket } from "./socket";
import { initPubSub } from "./pubsub";

const startServer = async () => {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);
  await initPubSub();

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${config.port}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
