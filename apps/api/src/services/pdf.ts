import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { config } from "../config/env";
import type { Generation } from "../models/Generation";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const streamPdf = async (
  generation: Generation & { _id: { toString: () => string } },
  writeStream: NodeJS.WritableStream
) => {
  if (!generation.header) {
    throw new Error("Missing generation header.");
  }

  const header = generation.header;

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(writeStream);

    doc.fontSize(16).text(header.schoolName, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(12).text(`Subject: ${header.subject}`, { align: "center" });
    doc.fontSize(12).text(`Class: ${header.className}`, { align: "center" });
    doc.moveDown();

    doc
      .fontSize(10)
      .text(`Time Allowed: ${header.timeAllowed}`, { continued: true })
      .text(`   Maximum Marks: ${header.maxMarks}`, { align: "right" });
    doc.moveDown();

    doc.fontSize(10).text("All questions are compulsory unless stated otherwise.");
    doc.moveDown();

    doc.fontSize(10).text("Name: ____________________");
    doc.text("Roll Number: ______________");
    doc.text("Section: ___________________");
    doc.moveDown();

    generation.sections.forEach((section, sectionIndex) => {
      doc
        .fontSize(12)
        .text(section.title, { align: "center" })
        .moveDown(0.3);
      doc.fontSize(10).text(section.instruction);
      doc.moveDown(0.5);

      section.questions.forEach((question, questionIndex) => {
        const qNumber = `${sectionIndex + 1}.${questionIndex + 1}`;
        doc
          .fontSize(10)
          .text(`${qNumber} [${question.difficulty}] ${question.text} (${question.marks} Marks)`);
        if (question.options?.length) {
          const labels = ["A", "B", "C", "D"];
          question.options.forEach((option, optionIndex) => {
            const label = labels[optionIndex] ?? String.fromCharCode(65 + optionIndex);
            doc.fontSize(10).text(`   ${label}) ${option}`);
          });
        }
      });
      doc.moveDown();
    });

    if (generation.answerKey?.length) {
      doc.addPage();
      doc.fontSize(12).text("Answer Key", { align: "left" });
      doc.moveDown(0.5);
      generation.answerKey.forEach((answer, index) => {
        if (typeof answer === "string") {
          doc.fontSize(10).text(`${index + 1}. ${answer}`);
          return;
        }

        if (!answer || typeof answer !== "object") {
          doc.fontSize(10).text(`${index + 1}. -`);
          return;
        }

        const entry = answer as {
          questionNumber?: string;
          marks?: number;
          type?: string;
          correctOption?: string;
          points?: string[];
        };

        const label = `${entry.questionNumber ?? index + 1} (${entry.marks ?? 0} marks)`;
        if (entry.type === "mcq") {
          doc.fontSize(10).text(`${label}: ${entry.correctOption ?? "-"}`);
          return;
        }

        doc.fontSize(10).text(label);
        if (entry.points?.length) {
          entry.points.forEach((point) => {
            doc.fontSize(10).text(`   - ${point}`);
          });
        }
      });
    }

    doc.end();
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });
};
