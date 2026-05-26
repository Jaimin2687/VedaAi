"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import QuestionPaper from "@/components/QuestionPaper";
import { API_BASE_URL } from "@/lib/api";
import type { AssignmentSummary, Generation } from "@/store/assignmentStore";
import { useAssignmentSocket } from "@/hooks/useAssignmentSocket";

type AssignmentDetailClientProps = {
  assignmentId: string;
  initialAssignment?: AssignmentSummary;
  initialGeneration?: Generation;
  initialError?: string;
};

export default function AssignmentDetailClient({
  assignmentId,
  initialAssignment,
  initialGeneration,
  initialError
}: AssignmentDetailClientProps) {
  const [assignment, setAssignment] = useState<AssignmentSummary | undefined>(initialAssignment);
  const [generation, setGeneration] = useState<Generation | undefined>(initialGeneration);
  const [error, setError] = useState(initialError ?? "");
  const [loading, setLoading] = useState(!initialAssignment);

  const loadAssignment = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}`);
      if (!response.ok) {
        setError("Assignment not found.");
        return;
      }
      const data = await response.json();
      setError("");
      setAssignment(data.assignment);
      setGeneration(data.generation ?? undefined);
    } catch {
      setError("Unable to reach the API.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useAssignmentSocket(assignmentId, (payload) => {
    if (["completed", "pdf-ready", "failed"].includes(payload.status)) {
      void loadAssignment();
    }
  });

  useEffect(() => {
    if (!initialAssignment && !initialError) {
      void loadAssignment();
      return;
    }
    if (initialError) {
      setLoading(false);
    }
  }, [initialAssignment, initialError, loadAssignment]);

  const handleRegenerate = async () => {
    setError("");
    const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/regenerate`, {
      method: "POST"
    });
    if (!response.ok) {
      setError("Failed to regenerate.");
      return;
    }
    setAssignment((prev) => (prev ? { ...prev, status: "pending" } : prev));
  };

  const pdfReady = Boolean(generation?.pdfPath);

  return (
    <AppShell title="Assignment Output" subtitle="AI-generated question paper" showBack backHref="/">
      {loading ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-gray-500 shadow-md">
          Loading assignment...
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-rose-50 p-6 text-sm text-rose-600">{error}</div>
      ) : assignment ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gray-900 px-6 py-4 text-white shadow-md">
            <div>
              <p className="text-sm text-gray-300">
                {assignment.title} • {assignment.totalMarks} Marks
              </p>
              <h2 className="text-lg font-semibold">Here is your customized question paper</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`${API_BASE_URL}/api/assignments/${assignmentId}/pdf`}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  pdfReady ? "bg-white text-gray-900" : "cursor-not-allowed bg-white/40 text-white/70"
                }`}
                aria-disabled={!pdfReady}
                onClick={(event) => {
                  if (!pdfReady) {
                    event.preventDefault();
                  }
                }}
              >
                Download as PDF
              </a>
              <button
                onClick={handleRegenerate}
                className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold"
              >
                Regenerate
              </button>
            </div>
          </div>

          {assignment.status !== "completed" ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-gray-500 shadow-md">
              {assignment.status === "processing"
                ? "Generating your assessment..."
                : assignment.status === "failed"
                  ? "Generation failed. Please try again."
                  : "Queued for generation."}
            </div>
          ) : generation ? (
            <QuestionPaper generation={generation} />
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-gray-500 shadow-md">
              No generated content yet.
            </div>
          )}
        </>
      ) : null}
    </AppShell>
  );
}
