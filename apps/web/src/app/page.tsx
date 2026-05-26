"use client";

import { useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import AssignmentCard from "@/components/AssignmentCard";
import AssignmentEmptyState from "@/components/AssignmentEmptyState";
import { API_BASE_URL } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";

export default function Home() {
  const assignments = useAssignmentStore((state) => state.assignments);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const removeAssignment = useAssignmentStore((state) => state.removeAssignment);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/assignments`);
        if (!response.ok) return;
        const data = await response.json();
        setAssignments(data);
      } catch {
        // Silently ignore when API is temporarily unavailable.
      }
    };

    loadAssignments();
  }, [setAssignments]);

  return (
    <AppShell title="Assignments" subtitle="Manage and create assignments for your classes.">
      <div className="rounded-3xl bg-white px-6 py-4 shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-500">
            🔎 <span>Search Assignment</span>
          </div>
          <Link
            href="/assignments/new"
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Create Assignment
          </Link>
          <button className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
            Filter By
          </button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <AssignmentEmptyState />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment._id}
              assignment={assignment}
              onDelete={async (assignmentId) => {
                const confirmed = window.confirm("Delete this assignment? This cannot be undone.");
                if (!confirmed) return;
                try {
                  const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}`, {
                    method: "DELETE"
                  });
                  if (!response.ok) return;
                  removeAssignment(assignmentId);
                } catch {
                  // Ignore network errors for now.
                }
              }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
