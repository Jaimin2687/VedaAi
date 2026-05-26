import Groq from "groq-sdk";
import { z } from "zod";
import { config } from "../config/env";

const groq = new Groq({ apiKey: config.groqApiKey });

const toNumber = (value: unknown) => {
  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return value;
};

const normalizeDifficulty = (value: unknown) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === "medium") return "moderate";
  if (normalized === "avg") return "moderate";
  return normalized;
};

const questionSchema = z.object({
  text: z.string().min(1),
  difficulty: z.preprocess(normalizeDifficulty, z.enum(["easy", "moderate", "hard"])),
  marks: z.preprocess(toNumber, z.number().positive()),
  options: z.array(z.string().min(1)).optional()
});

const sectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(questionSchema).min(1)
});

const answerKeyItemSchema = z
  .object({
    questionNumber: z.string().optional(),
    marks: z.preprocess(toNumber, z.number().positive()).optional(),
    type: z.enum(["mcq", "short", "long"]).optional(),
    correctOption: z.string().optional(),
    points: z.array(z.string().min(1)).optional()
  })
  .passthrough();

const assessmentSchema = z.object({
  header: z.object({
    schoolName: z.string().min(1),
    subject: z.string().min(1),
    className: z.string().min(1),
    timeAllowed: z.string().min(1),
    maxMarks: z.preprocess(toNumber, z.number().positive())
  }),
  sections: z.array(sectionSchema).min(1),
  answerKey: z.array(z.union([z.string(), answerKeyItemSchema])).optional().default([])
});

type AnswerKeyItem = {
  questionNumber: string;
  marks: number;
  type: "mcq" | "short" | "long";
  correctOption?: "A" | "B" | "C" | "D";
  points?: string[];
};

const extractOptionsFromText = (text: string) => {
  const match = text.match(/A\)\s*(.+?)\s*B\)\s*(.+?)\s*C\)\s*(.+?)\s*D\)\s*(.+)$/i);
  if (!match) return null;
  const question = text.slice(0, match.index).replace(/[:\-\s]+$/, "").trim();
  const options = [match[1], match[2], match[3], match[4]].map((value) => value.trim());
  return { question, options };
};

const extractSubject = (text: string) => {
  const cleaned = text.replace(/[?]/g, "").trim();
  return cleaned
    .replace(
      /^(what is|define|explain|describe|discuss|outline|state|list|compare|differentiate between|difference between|distinguish between|why|how)\s+/i,
      ""
    )
    .trim() || "the topic";
};

const toTitle = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const buildDefaultOptions = (questionText: string) => {
  const subject = extractSubject(questionText);
  return [
    toTitle(subject),
    `Key feature of ${subject}`,
    `Example of ${subject}`,
    `Unrelated concept`
  ];
};

const buildDefaultPoints = (questionText: string, count: number) => {
  const subject = extractSubject(questionText);
  const seeds = [
    `Definition of ${subject}`,
    `Key characteristics of ${subject}`,
    `Steps/working of ${subject}`,
    `Examples or applications of ${subject}`,
    `Advantages and limitations of ${subject}`,
    `Common pitfalls or misconceptions about ${subject}`
  ];
  return seeds.slice(0, count).map((item) => toTitle(item));
};

const normalizeAnswerKeyEntry = (
  entry: AnswerKeyItem | null,
  questionNumber: string,
  marks: number,
  questionText: string
): AnswerKeyItem => {
  const type = marks === 1 ? "mcq" : marks >= 5 ? "long" : "short";
  const base: AnswerKeyItem = {
    questionNumber,
    marks,
    type
  };

  if (!entry) {
    if (type === "mcq") {
      return { ...base, correctOption: "A" };
    }
    const points = buildDefaultPoints(questionText, type === "long" ? 4 : 2);
    return { ...base, points };
  }

  if (type === "mcq") {
    const correctOption = entry.correctOption?.toUpperCase() as "A" | "B" | "C" | "D" | undefined;
    return { ...base, correctOption: correctOption ?? "A" };
  }

  const points = (entry.points ?? []).filter(Boolean);
  const minPoints = type === "long" ? 3 : 1;
  const paddedPoints = points.length >= minPoints
    ? points
    : [...points, ...buildDefaultPoints(questionText, minPoints - points.length)];

  return { ...base, points: paddedPoints };
};

const normalizeAssessment = (assessment: z.infer<typeof assessmentSchema>) => {
  const answerKeyMap = new Map<string, AnswerKeyItem>();
  const rawAnswerKey = assessment.answerKey ?? [];

  rawAnswerKey.forEach((entry) => {
    if (typeof entry === "string") {
      const match = entry.match(/^(\d+\.\d+)\s*(?:\((\d+)\s*marks?\))?\s*[:\-]\s*(.*)$/i);
      if (!match) return;
      const questionNumber = match[1];
      const marks = match[2] ? Number(match[2]) : undefined;
      const body = match[3]?.trim();
      if (!body) return;

      if (/^[A-D]$/i.test(body)) {
        answerKeyMap.set(questionNumber, {
          questionNumber,
          marks: marks ?? 1,
          type: "mcq",
          correctOption: body.toUpperCase() as "A" | "B" | "C" | "D"
        });
        return;
      }

      const points = body
        .split(/;|\.|\n/)
        .map((value) => value.trim())
        .filter(Boolean);

      answerKeyMap.set(questionNumber, {
        questionNumber,
        marks: marks ?? Math.max(2, points.length),
        type: points.length >= 3 ? "long" : "short",
        points
      });
      return;
    }

    if (entry && typeof entry === "object" && "questionNumber" in entry) {
      const item = entry as AnswerKeyItem;
      if (!item.questionNumber) return;
      answerKeyMap.set(item.questionNumber, {
        questionNumber: item.questionNumber,
        marks: item.marks ?? 1,
        type: item.type ?? "short",
        correctOption: item.correctOption as "A" | "B" | "C" | "D" | undefined,
        points: item.points
      });
    }
  });

  const normalizedSections = assessment.sections.map((section, sectionIndex) => {
    const questions = section.questions.map((question, questionIndex) => {
      let text = question.text.trim();
      let options = question.options?.filter(Boolean) ?? [];

      if (!options.length) {
        const extracted = extractOptionsFromText(text);
        if (extracted) {
          text = extracted.question || text;
          options = extracted.options;
        }
      }

      if (question.marks === 1) {
        if (options.length < 4) {
          const fallbackOptions = buildDefaultOptions(text);
          options = [...options, ...fallbackOptions].slice(0, 4);
        } else if (options.length > 4) {
          options = options.slice(0, 4);
        }
      }

      return {
        ...question,
        text,
        options: options.length ? options : undefined
      };
    });

    return {
      ...section,
      questions
    };
  });

  const normalizedAnswerKey: AnswerKeyItem[] = [];
  normalizedSections.forEach((section, sectionIndex) => {
    section.questions.forEach((question, questionIndex) => {
      const questionNumber = `${sectionIndex + 1}.${questionIndex + 1}`;
      const entry = answerKeyMap.get(questionNumber) ?? null;
      normalizedAnswerKey.push(
        normalizeAnswerKeyEntry(entry, questionNumber, question.marks, question.text)
      );
    });
  });

  return {
    ...assessment,
    sections: normalizedSections,
    answerKey: normalizedAnswerKey
  };
};

const stripTrailingCommas = (value: string) =>
  value.replace(/,\s*([}\]])/g, "$1");

const extractJson = (content: string) => {
  let cleanContent = content.trim();
  
  // Remove markdown code blocks if present
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const match = cleanContent.match(jsonBlockRegex);
  if (match) {
    cleanContent = match[1].trim();
  }

  const start = cleanContent.indexOf("{");
  const end = cleanContent.lastIndexOf("}");

  if (start === -1 || end === -1 || start > end) {
    throw new Error("LLM response did not contain complete JSON.");
  }

  return stripTrailingCommas(cleanContent.slice(start, end + 1));
};

export const generateAssessment = async (prompt: string) => {
  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a precise JSON generator. Follow the schema exactly and return JSON only. The output must be a valid JSON object."
      },
      { role: "user", content: prompt }
    ]
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const json = extractJson(content);
  const parsed = assessmentSchema.safeParse(JSON.parse(json));

  if (!parsed.success) {
    throw new Error("LLM response failed schema validation.");
  }

  return normalizeAssessment(parsed.data);
};
