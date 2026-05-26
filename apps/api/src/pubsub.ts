import { redisSub } from "./services/redis";
import { getSocket } from "./socket";

const CHANNEL = "assignment-updates";

export const initPubSub = async () => {
  await redisSub.subscribe(CHANNEL);

  redisSub.on("message", (channel, message) => {
    if (channel !== CHANNEL) return;
    try {
      const payload = JSON.parse(message);
      const assignmentId = payload.assignmentId as string;
      if (!assignmentId) return;
      getSocket().to(`assignment:${assignmentId}`).emit("assignment:update", payload);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse pubsub message", error);
    }
  });
};
