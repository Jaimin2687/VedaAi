import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./config/env";

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin.split(",").map((origin) => origin.trim()),
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("assignment:subscribe", (assignmentId: string) => {
      if (assignmentId) {
        socket.join(`assignment:${assignmentId}`);
      }
    });

    socket.on("assignment:unsubscribe", (assignmentId: string) => {
      if (assignmentId) {
        socket.leave(`assignment:${assignmentId}`);
      }
    });
  });

  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
