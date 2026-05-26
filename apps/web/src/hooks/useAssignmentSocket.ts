import { useCallback, useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";

const ALLOWED_STATUSES = ["pending", "processing", "completed", "failed"] as const;
let socket: Socket | null = null;

export const useAssignmentSocket = (
  assignmentId?: string,
  onUpdate?: (payload: { assignmentId: string; status: string }) => void
) => {
  const updateStatus = useAssignmentStore((state) => state.updateStatus);
  const isStatus = useCallback(
    (value: string): value is (typeof ALLOWED_STATUSES)[number] =>
      ALLOWED_STATUSES.includes(value as (typeof ALLOWED_STATUSES)[number]),
    []
  );

  useEffect(() => {
    if (!socket) {
      socket = io(API_BASE_URL, { transports: ["websocket"] });
    }

    const handleUpdate = (payload: { assignmentId: string; status: string }) => {
      if (payload.assignmentId && isStatus(payload.status)) {
        updateStatus(payload.assignmentId, payload.status);
      }
      onUpdate?.(payload);
    };

    socket.on("assignment:update", handleUpdate);

    if (assignmentId) {
      socket.emit("assignment:subscribe", assignmentId);
    }

    return () => {
      if (assignmentId) {
        socket?.emit("assignment:unsubscribe", assignmentId);
      }
      socket?.off("assignment:update", handleUpdate);
    };
  }, [assignmentId, onUpdate, updateStatus, isStatus]);
};
