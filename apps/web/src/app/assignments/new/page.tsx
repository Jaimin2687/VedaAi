"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AppShell from "@/components/layout/AppShell";
import { API_BASE_URL } from "@/lib/api";

const questionTypeSchema = z.object({
  type: z.string().min(1, "Select a question type."),
  count: z.coerce.number().int().positive("Question count must be positive."),
  marks: z.coerce.number().int().positive("Marks must be positive.")
});

const formSchema = z.object({
  title: z.string().min(2, "Title is required."),
  dueDate: z.string().min(1, "Due date is required."),
  questionTypes: z.array(questionTypeSchema).min(1),
  additionalInstructions: z.string().optional()
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.infer<typeof formSchema>;

const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Long Answer Questions"
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Quiz on Electricity",
      questionTypes: [
        { type: QUESTION_TYPE_OPTIONS[0], count: 4, marks: 1 },
        { type: QUESTION_TYPE_OPTIONS[1], count: 3, marks: 2 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questionTypes"
  });

  const questionTypes = useWatch({ control, name: "questionTypes" });
  const totals = useMemo(() => {
    return questionTypes?.reduce(
      (acc, item) => {
        acc.totalQuestions += Number(item.count || 0);
        acc.totalMarks += Number(item.count || 0) * Number(item.marks || 0);
        return acc;
      },
      { totalQuestions: 0, totalMarks: 0 }
    );
  }, [questionTypes]);

  const onSubmit = async (values: FormInput) => {
    setError("");
    const parsed = formSchema.parse(values);
    const formData = new FormData();
    formData.append("title", parsed.title);
    formData.append("dueDate", parsed.dueDate);
    formData.append("questionTypes", JSON.stringify(parsed.questionTypes));
    formData.append("additionalInstructions", parsed.additionalInstructions ?? "");

    if (fileRef.current?.files?.[0]) {
      formData.append("file", fileRef.current.files[0]);
    }

    const response = await fetch(`${API_BASE_URL}/api/assignments`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const message = await response.json().catch(() => ({ error: "Failed to create assignment." }));
      setError(message.error ?? "Failed to create assignment.");
      return;
    }

    const data = await response.json();
    router.push(`/assignments/${data.assignmentId}`);
  };

  return (
    <AppShell
      title="Create Assignment"
      subtitle="Set up a new assignment for your students"
      showBack
      backHref="/"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-gray-900">Assignment Details</h2>
          <p className="text-sm text-gray-500">Basic information about your assignment</p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">Assignment Title</label>
              <input
                {...register("title")}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                placeholder="Quiz on Electricity"
              />
              {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p> : null}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Upload Material (optional)</label>
              <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 px-6 py-6 text-center text-sm text-gray-500">
                <p>Choose a file or drag & drop it here</p>
                <p className="text-xs text-gray-400">PDF or TXT up to 10MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  className="mt-3 text-xs"
                  accept=".pdf,.txt"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                {...register("dueDate")}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
              />
              {errors.dueDate ? <p className="mt-1 text-xs text-rose-600">{errors.dueDate.message}</p> : null}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Question Type</label>
                <div className="text-xs text-gray-500">No. of Questions • Marks</div>
              </div>
              <div className="mt-3 space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap items-center gap-3">
                    <select
                      {...register(`questionTypes.${index}.type`)}
                      className="flex-1 rounded-2xl border border-gray-200 px-3 py-2 text-sm"
                    >
                      {QUESTION_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      {...register(`questionTypes.${index}.count`, { valueAsNumber: true })}
                      className="w-24 rounded-2xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      {...register(`questionTypes.${index}.marks`, { valueAsNumber: true })}
                      className="w-24 rounded-2xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-sm text-gray-400 hover:text-rose-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => append({ type: QUESTION_TYPE_OPTIONS[0], count: 1, marks: 1 })}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">+</span>
                Add Question Type
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Questions: {totals?.totalQuestions ?? 0}</span>
              <span>Total Marks: {totals?.totalMarks ?? 0}</span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Additional Information (For better output)</label>
              <textarea
                {...register("additionalInstructions")}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm"
                placeholder="e.g. Generate a question paper for a 45-minute exam."
              />
            </div>
          </div>
        </div>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p> : null}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700"
          >
            ← Previous
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-gray-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSubmitting ? "Generating..." : "Next →"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
