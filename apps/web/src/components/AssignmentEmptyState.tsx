"use client";

import Link from "next/link";

export default function AssignmentEmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-md">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-3xl">
        🔍
      </div>
      <h2 className="text-lg font-semibold text-gray-900">No assignments yet</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Create your first assignment to start collecting and grading student submissions. Set rubrics,
        define marking criteria, and let AI assist with grading.
      </p>
      <Link
        href="/assignments/new"
        className="mt-6 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white"
      >
        + Create Your First Assignment
      </Link>
    </div>
  );
}
