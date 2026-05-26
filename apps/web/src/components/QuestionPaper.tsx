"use client";

import Badge from "@/components/ui/Badge";
import type { AnswerKeyItem, Generation } from "@/store/assignmentStore";

type QuestionPaperProps = {
  generation: Generation;
};

export default function QuestionPaper({ generation }: QuestionPaperProps) {
  const optionLabels = ["A", "B", "C", "D"];
  const isAnswerKeyItem = (value: unknown): value is AnswerKeyItem => {
    return Boolean(value && typeof value === "object" && "questionNumber" in value);
  };

  return (
    <div className="rounded-3xl bg-white p-10 shadow-md">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">{generation.header.schoolName}</h2>
        <p className="text-sm text-gray-600">Subject: {generation.header.subject}</p>
        <p className="text-sm text-gray-600">Class: {generation.header.className}</p>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <span>Time Allowed: {generation.header.timeAllowed}</span>
        <span>Maximum Marks: {generation.header.maxMarks}</span>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        All questions are compulsory unless stated otherwise.
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <div className="flex items-center gap-3">
          <span className="w-20">Name:</span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20">Roll No:</span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20">Section:</span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {generation.sections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`} className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            </div>
            <p className="text-sm text-gray-600">{section.instruction}</p>
            <div className="space-y-3">
              {section.questions.map((question, index) => (
                <div key={`${question.text}-${index}`} className="flex gap-3 text-sm text-gray-800">
                  <span className="text-gray-500">{sectionIndex + 1}.{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{question.text}</span>
                      <Badge
                        tone={question.difficulty}
                        label={question.difficulty === "moderate" ? "Moderate" : question.difficulty}
                      />
                    </div>
                    {question.options?.length ? (
                      <ul className="mt-2 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <li key={`${option}-${optionIndex}`} className="flex gap-2">
                            <span className="text-gray-500">{optionLabels[optionIndex]})</span>
                            <span>{option}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <span className="text-gray-500">{question.marks} Marks</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {generation.answerKey?.length ? (
        <div className="mt-10 border-t border-dashed border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-800">Answer Key</h4>
          <ol className="mt-2 space-y-2 text-sm text-gray-600">
            {generation.answerKey.map((entry, index) => {
              if (!isAnswerKeyItem(entry)) {
                return <li key={`${entry}-${index}`}>{entry}</li>;
              }

              return (
                <li key={`${entry.questionNumber}-${index}`}>
                  <div className="font-medium text-gray-700">
                    {entry.questionNumber} ({entry.marks} marks)
                  </div>
                  {entry.type === "mcq" ? (
                    <div>Correct: {entry.correctOption ?? "-"}</div>
                  ) : entry.points?.length ? (
                    <ul className="mt-1 list-disc pl-5">
                      {entry.points.map((point, pointIndex) => (
                        <li key={`${entry.questionNumber}-${pointIndex}`}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
