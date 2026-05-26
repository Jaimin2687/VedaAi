import mongoose, { Schema, type InferSchemaType } from "mongoose";

const QuestionSchema = new Schema(
  {
    text: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      required: true
    },
    marks: { type: Number, required: true },
    options: { type: [String] }
  },
  { _id: false }
);

const SectionSchema = new Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [QuestionSchema], default: [] }
  },
  { _id: false }
);

const GenerationSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    header: {
      schoolName: { type: String, required: true },
      subject: { type: String, required: true },
      className: { type: String, required: true },
      timeAllowed: { type: String, required: true },
      maxMarks: { type: Number, required: true }
    },
    sections: { type: [SectionSchema], default: [] },
    answerKey: { type: [Schema.Types.Mixed], default: [] },
    pdfPath: { type: String, default: "" }
  },
  { timestamps: true }
);

export type Generation = InferSchemaType<typeof GenerationSchema>;

export const GenerationModel =
  mongoose.models.Generation ?? mongoose.model("Generation", GenerationSchema);
