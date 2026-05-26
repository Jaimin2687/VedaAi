import type { Assignment } from "../models/Assignment";

export const buildPrompt = (assignment: Assignment) => {
  const questionTypeSummary = assignment.questionTypes
    .map((item) => `${item.type}: ${item.count} questions, ${item.marks} marks each`)
    .join("; ");

  return `
You are an expert assessment designer. Generate a structured question paper in JSON.
The output must be valid JSON only (no markdown, no commentary).

Assignment context:
- Title: ${assignment.title}
- Due date: ${assignment.dueDate.toISOString()}
- Question types: ${questionTypeSummary}
- Total questions: ${assignment.totalQuestions}
- Total marks: ${assignment.totalMarks}
- Additional instructions: ${assignment.additionalInstructions || "None"}

Reference material (optional):
${assignment.sourceText ? assignment.sourceText : "No reference material provided."}

Requirements:
- Create sections labeled "Section A", "Section B", ... as needed.
- Each section includes a title and instruction (e.g., "Attempt all questions").
- Questions must include text, difficulty (easy|moderate|hard), and marks.
- Ensure total questions and marks align with the assignment request.
- Make questions age-appropriate and aligned with the material if provided.
- For any question with marks = 1, or if the question type indicates "Multiple Choice" or "MCQ",
  generate an MCQ with exactly 4 options. Put options in a separate array field named "options"
  (do NOT inline options inside the question text).
- Answer key must list every question in order and include the question number, marks, and a
  structured answer object with correctOption (for MCQs) or points (for short/long answers).
- Answer length must reflect marks:
  - 1 mark (MCQ): only correctOption (A/B/C/D).
  - 2-4 marks (short): 1-2 points in "points".
  - 5+ marks (long): 3-6 points in "points".

Return JSON in this exact shape:
{
  "header": {
    "schoolName": "string",
    "subject": "string",
    "className": "string",
    "timeAllowed": "string",
    "maxMarks": number
  },
  "sections": [
    {
      "title": "Section A",
      "instruction": "string",
      "questions": [
        {
          "text": "string",
          "difficulty": "easy|moderate|hard",
          "marks": number,
          "options": ["string", "string", "string", "string"]
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": "1.1",
      "marks": number,
      "type": "mcq|short|long",
      "correctOption": "A|B|C|D",
      "points": ["string"]
    }
  ]
}
`.trim();
};
