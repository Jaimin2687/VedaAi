import { create } from "zustand";

export type QuestionType = {
  type: string;
  count: number;
  marks: number;
};

export type AssignmentSummary = {
  _id: string;
  title: string;
  dueDate: string;
  totalQuestions: number;
  totalMarks: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
};

export type AnswerKeyItem = {
  questionNumber: string;
  marks: number;
  type: "mcq" | "short" | "long";
  correctOption?: "A" | "B" | "C" | "D";
  points?: string[];
};

export type Generation = {
  header: {
    schoolName: string;
    subject: string;
    className: string;
    timeAllowed: string;
    maxMarks: number;
  };
  sections: Array<{
    title: string;
    instruction: string;
    questions: Array<{
      text: string;
      difficulty: "easy" | "moderate" | "hard";
      marks: number;
      options?: string[];
    }>;
  }>;
  answerKey?: Array<string | AnswerKeyItem>;
  pdfPath?: string;
};

type AssignmentStore = {
  assignments: AssignmentSummary[];
  currentAssignment?: AssignmentSummary;
  currentGeneration?: Generation;
  setAssignments: (assignments: AssignmentSummary[]) => void;
  removeAssignment: (assignmentId: string) => void;
  setCurrent: (assignment?: AssignmentSummary, generation?: Generation) => void;
  updateStatus: (assignmentId: string, status: AssignmentSummary["status"]) => void;
};

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  setAssignments: (assignments) => set({ assignments }),
  removeAssignment: (assignmentId) =>
    set((state) => ({
      assignments: state.assignments.filter((assignment) => assignment._id !== assignmentId),
      currentAssignment:
        state.currentAssignment?._id === assignmentId
          ? undefined
          : state.currentAssignment,
      currentGeneration:
        state.currentAssignment?._id === assignmentId ? undefined : state.currentGeneration
    })),
  setCurrent: (assignment, generation) =>
    set({ currentAssignment: assignment, currentGeneration: generation }),
  updateStatus: (assignmentId, status) =>
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment._id === assignmentId ? { ...assignment, status } : assignment
      ),
      currentAssignment:
        state.currentAssignment?._id === assignmentId
          ? { ...state.currentAssignment, status }
          : state.currentAssignment
    }))
}));
