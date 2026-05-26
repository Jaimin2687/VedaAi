"use client";

import Link from "next/link";
import clsx from "clsx";
import type { AssignmentSummary } from "@/store/assignmentStore";

const statusStyles: Record<AssignmentSummary["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700"
};

type AssignmentCardProps = {
  assignment: AssignmentSummary;
  onDelete?: (assignmentId: string) => void;
};

export default function AssignmentCard({ assignment, onDelete }: AssignmentCardProps) {
  return (
    <Link
      href={`/assignments/${assignment._id}`}
      className="group relative flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
          <p className="text-xs text-gray-500">Assigned on {new Date(assignment.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx("rounded-full px-2 py-1 text-xs font-semibold", statusStyles[assignment.status])}>
            {assignment.status}
          </span>
          {onDelete ? (
            <button
              type="button"
              className="rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-rose-200 hover:text-rose-600"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(assignment._id);
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
        <span>
          {assignment.totalQuestions} Q • {assignment.totalMarks} Marks
        </span>
      </div>
    </Link>
  );
}
