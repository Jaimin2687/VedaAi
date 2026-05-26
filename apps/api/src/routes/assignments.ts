import { Router } from "express";
import fs from "fs/promises";
import multer from "multer";
import { z } from "zod";
import mongoose from "mongoose";
import { AssignmentModel } from "../models/Assignment";
import { GenerationModel } from "../models/Generation";
import { asyncHandler } from "../utils/asyncHandler";
import { generationQueue } from "../queues";
import { config } from "../config/env";
import { streamPdf } from "../services/pdf";
import { redis } from "../services/redis";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (["application/pdf", "text/plain"].includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(Object.assign(new Error("Unsupported file type."), { status: 400 }));
    }
  }
});

const questionTypeSchema = z.object({
  type: z.string().min(1),
  count: z.coerce.number().int().positive(),
  marks: z.coerce.number().int().positive()
});

const createAssignmentSchema = z.object({
  title: z.string().min(1).optional().default("Untitled Assignment"),
  dueDate: z.string().min(1),
  questionTypes: z.array(questionTypeSchema).min(1),
  additionalInstructions: z.string().optional().default("")
});

const extractSourceText = async (file?: Express.Multer.File) => {
  if (!file) return "";

  if (file.mimetype === "application/pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: file.buffer });
      const parsed = await parser.getText();
      return parsed.text.slice(0, 8000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("PDF parsing failed, continuing without extracted text", error);
      return "";
    }
  }

  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8").slice(0, 8000);
  }

  throw Object.assign(new Error("Unsupported file type."), { status: 400 });
};

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const rawQuestionTypes = req.body.questionTypes;
    let parsedQuestionTypes = rawQuestionTypes;
    if (typeof rawQuestionTypes === "string") {
      try {
        parsedQuestionTypes = JSON.parse(rawQuestionTypes);
      } catch (error) {
        throw Object.assign(new Error("Invalid question types format."), { status: 400 });
      }
    }

    const parsed = createAssignmentSchema.parse({
      title: req.body.title,
      dueDate: req.body.dueDate,
      questionTypes: parsedQuestionTypes,
      additionalInstructions: req.body.additionalInstructions
    });

    const dueDate = new Date(parsed.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      throw Object.assign(new Error("Invalid due date."), { status: 400 });
    }

    const totals = parsed.questionTypes.reduce(
      (acc, item) => {
        acc.totalQuestions += item.count;
        acc.totalMarks += item.count * item.marks;
        return acc;
      },
      { totalQuestions: 0, totalMarks: 0 }
    );

    const sourceText = await extractSourceText(req.file ?? undefined);

    const assignment = await AssignmentModel.create({
      title: parsed.title,
      dueDate,
      questionTypes: parsed.questionTypes,
      additionalInstructions: parsed.additionalInstructions,
      sourceText,
      totalQuestions: totals.totalQuestions,
      totalMarks: totals.totalMarks,
      status: "pending"
    });

    await generationQueue.add(
      "generate",
      { assignmentId: assignment._id.toString() },
      { removeOnComplete: true, removeOnFail: false }
    );

    await redis.set(
      `assignment:${assignment._id.toString()}:status`,
      "pending",
      "EX",
      config.jobTtlSeconds
    );

    res.status(201).json({ assignmentId: assignment._id.toString() });
  })
);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const assignments = await AssignmentModel.find()
      .sort({ createdAt: -1 })
      .select("-sourceText");
    res.json(assignments);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const assignmentId = req.params.id;
    if (!mongoose.isValidObjectId(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment id." });
      return;
    }
    const assignment = await AssignmentModel.findById(req.params.id).lean();
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    const generation = assignment.latestGenerationId
      ? await GenerationModel.findById(assignment.latestGenerationId).lean()
      : null;

    res.json({ assignment, generation });
  })
);

router.post(
  "/:id/regenerate",
  asyncHandler(async (req, res) => {
    const assignmentId = req.params.id;
    if (!mongoose.isValidObjectId(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment id." });
      return;
    }
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    assignment.status = "pending";
    await assignment.save();

    await generationQueue.add(
      "generate",
      { assignmentId: assignment._id.toString() },
      { removeOnComplete: true, removeOnFail: false }
    );

    await redis.set(
      `assignment:${assignment._id.toString()}:status`,
      "pending",
      "EX",
      config.jobTtlSeconds
    );

    res.json({ assignmentId: assignment._id.toString() });
  })
);

router.get(
  "/:id/pdf",
  asyncHandler(async (req, res) => {
    const assignmentId = req.params.id;
    if (!mongoose.isValidObjectId(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment id." });
      return;
    }
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment?.latestGenerationId) {
      res.status(404).json({ error: "PDF not available yet." });
      return;
    }

    const generation = await GenerationModel.findById(assignment.latestGenerationId);
    if (!generation) {
      res.status(404).json({ error: "Generation not found." });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="assessment-${generation._id.toString()}.pdf"`
    );

    try {
      await streamPdf(generation as any, res);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to stream PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF." });
      }
    }
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const assignmentId = req.params.id;
    if (!mongoose.isValidObjectId(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment id." });
      return;
    }

    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found." });
      return;
    }

    const generations = await GenerationModel.find({ assignmentId: assignment._id })
      .select("pdfPath")
      .lean();

    await Promise.all(
      generations
        .filter((generation) => generation.pdfPath)
        .map((generation) => fs.unlink(generation.pdfPath).catch(() => undefined))
    );

    await GenerationModel.deleteMany({ assignmentId: assignment._id });
    await AssignmentModel.deleteOne({ _id: assignment._id });
    await redis.del(
      `assignment:${assignment._id.toString()}:status`,
      `assignment:${assignment._id.toString()}:result`
    );

    res.json({ success: true });
  })
);

export default router;
