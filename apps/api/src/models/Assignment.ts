import mongoose, { Schema, type InferSchemaType } from "mongoose";

const QuestionTypeSchema = new Schema(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const AssignmentSchema = new Schema(
  {
    title: { type: String, default: "Untitled Assignment" },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], default: [] },
    additionalInstructions: { type: String, default: "" },
    sourceText: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    latestGenerationId: { type: Schema.Types.ObjectId, ref: "Generation" }
  },
  { timestamps: true }
);

export type Assignment = InferSchemaType<typeof AssignmentSchema>;

export const AssignmentModel =
  mongoose.models.Assignment ?? mongoose.model("Assignment", AssignmentSchema);
