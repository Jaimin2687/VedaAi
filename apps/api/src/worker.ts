import { Worker } from "bullmq";
import { AssignmentModel, type Assignment } from "./models/Assignment";
import { GenerationModel } from "./models/Generation";
import { buildPrompt } from "./services/prompt";
import { generateAssessment } from "./services/groq";
import { generatePdf } from "./services/pdf";
import { config } from "./config/env";
import { redis, redisPub } from "./services/redis";
import { pdfQueue, queueConnection } from "./queues";
import { connectDatabase } from "./db";

const publishUpdate = async (payload: Record<string, unknown>) => {
  await redisPub.publish("assignment-updates", JSON.stringify(payload));
};

const buildFallbackAssessment = (assignment: Assignment) => {
  const answerKey: Array<{
    questionNumber: string;
    marks: number;
    type: "mcq" | "short" | "long";
    correctOption?: "A" | "B" | "C" | "D";
    points?: string[];
  }> = [];
  const isMcqType = (type: string, marks: number) => {
    const normalized = type.toLowerCase();
    return marks === 1 || normalized.includes("multiple") || normalized.includes("mcq");
  };

  const sections = assignment.questionTypes.length
    ? assignment.questionTypes.map((item, index) => {
        const sectionIndex = index + 1;
        return {
          title: `Section ${String.fromCharCode(65 + index)}`,
          instruction: `Attempt all ${item.type} questions.`,
          questions: Array.from({ length: item.count }, (_unused, qIndex) => {
            const questionNumber = `${sectionIndex}.${qIndex + 1}`;
            const isMcq = isMcqType(item.type, item.marks);
            const questionText = `${item.type} question ${qIndex + 1}`;
            const options = isMcq
              ? ["Option 1", "Option 2", "Option 3", "Option 4"]
              : undefined;

            if (isMcq) {
              answerKey.push({
                questionNumber,
                marks: item.marks,
                type: "mcq",
                correctOption: "A"
              });
            } else if (item.marks >= 5) {
              answerKey.push({
                questionNumber,
                marks: item.marks,
                type: "long",
                points: ["point1", "point2", "point3", "point4"]
              });
            } else {
              answerKey.push({
                questionNumber,
                marks: item.marks,
                type: "short",
                points: ["point1", "point2"]
              });
            }

            return {
              text: questionText,
              difficulty: "moderate" as const,
              marks: item.marks,
              options
            };
          })
        };
      })
    : [
        {
          title: "Section A",
          instruction: "Attempt all questions.",
          questions: [
            {
              text: "Short answer question 1",
              difficulty: "moderate" as const,
              marks: 1,
              options: ["Option 1", "Option 2", "Option 3", "Option 4"]
            }
          ]
        }
      ];

  if (!answerKey.length) {
    answerKey.push({
      questionNumber: "1.1",
      marks: 1,
      type: "mcq",
      correctOption: "A"
    });
  }

  return {
    header: {
      schoolName: "Your School",
      subject: assignment.title,
      className: "Class",
      timeAllowed: "60 minutes",
      maxMarks: assignment.totalMarks
    },
    sections,
    answerKey
  };
};

const startWorkers = async () => {
  await connectDatabase();

  const generationWorker = new Worker(
    "generation",
    async (job) => {
      const assignment = await AssignmentModel.findById(job.data.assignmentId);
      if (!assignment) {
        throw new Error("Assignment not found.");
      }

      assignment.status = "processing";
      await assignment.save();

      await redis.set(`assignment:${assignment._id.toString()}:status`, "processing", "EX", config.jobTtlSeconds);
      await publishUpdate({
        assignmentId: assignment._id.toString(),
        status: "processing"
      });

      const prompt = buildPrompt(assignment);
      let assessment;

      try {
        assessment = await generateAssessment(prompt);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Groq generation failed, using fallback", error);
        assessment = buildFallbackAssessment(assignment);
      }

      const generation = await GenerationModel.create({
        assignmentId: assignment._id,
        header: assessment.header,
        sections: assessment.sections,
        answerKey: assessment.answerKey ?? []
      });

      assignment.status = "completed";
      assignment.latestGenerationId = generation._id;
      await assignment.save();

      await redis.set(
        `assignment:${assignment._id.toString()}:result`,
        JSON.stringify(assessment),
        "EX",
        config.jobTtlSeconds
      );
      await redis.set(`assignment:${assignment._id.toString()}:status`, "completed", "EX", config.jobTtlSeconds);

      await publishUpdate({
        assignmentId: assignment._id.toString(),
        status: "completed",
        generationId: generation._id.toString()
      });

      await pdfQueue.add(
        "generate-pdf",
        { generationId: generation._id.toString() },
        { removeOnComplete: true, removeOnFail: false }
      );

      return generation._id.toString();
    },
    { connection: queueConnection, concurrency: 2 }
  );

  generationWorker.on("failed", async (job, error) => {
    // eslint-disable-next-line no-console
    console.error("Generation job failed", { jobId: job?.id, assignmentId: job?.data?.assignmentId }, error);
    if (!job?.data?.assignmentId) return;
    const assignment = await AssignmentModel.findById(job.data.assignmentId);
    if (!assignment) return;
    assignment.status = "failed";
    await assignment.save();
    await redis.set(`assignment:${assignment._id.toString()}:status`, "failed", "EX", config.jobTtlSeconds);
    await publishUpdate({
      assignmentId: assignment._id.toString(),
      status: "failed",
      error: error.message
    });
  });

  const pdfWorker = new Worker(
    "pdf",
    async (job) => {
      const generation = await GenerationModel.findById(job.data.generationId);
      if (!generation) {
        throw new Error("Generation not found.");
      }

      const pdfPath = await generatePdf(generation);
      generation.pdfPath = pdfPath;
      await generation.save();

      await publishUpdate({
        assignmentId: generation.assignmentId.toString(),
        status: "pdf-ready"
      });

      return pdfPath;
    },
    { connection: queueConnection, concurrency: 1 }
  );

  pdfWorker.on("failed", async (job, error) => {
    // eslint-disable-next-line no-console
    console.error("PDF job failed", { jobId: job?.id, generationId: job?.data?.generationId }, error);
    if (!job?.data?.generationId) return;
    const generation = await GenerationModel.findById(job.data.generationId);
    if (!generation) return;
    await publishUpdate({
      assignmentId: generation.assignmentId.toString(),
      status: "pdf-failed",
      error: error.message
    });
  });
};

startWorkers().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Worker failed to start", error);
  process.exit(1);
});
