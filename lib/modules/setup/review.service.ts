import { GoogleGenAI } from "@google/genai";
import ENV from "../../common/env";
import prisma from "../../db/prisma";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export async function reviewAnswerAndSave(
  setupId: number,
  questionIndex: number,
  questionText: string,
  answerText: string
): Promise<any> {
  let evaluatedAnswer = answerText;
  let isCodingAnswer = false;
  let codeSnippet = "";
  let explanationSnippet = "";

  try {
    const trimmed = answerText.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.code !== undefined || parsed.explanation !== undefined) {
        codeSnippet = parsed.code || "";
        explanationSnippet = parsed.explanation || "";
        isCodingAnswer = true;
        evaluatedAnswer = `Code Snippet:\n\`\`\`\n${codeSnippet}\n\`\`\`\n\nExplanation:\n${explanationSnippet}`;
      }
    }
  } catch (e) {
    // Treat as regular answer text
  }

  const prompt = isCodingAnswer
    ? `
You are an expert technical interviewer.
Evaluate the candidate's code submission and accompanying explanation for the following coding question.

Question: ${questionText}

Candidate's Code Submission:
\`\`\`
${codeSnippet}
\`\`\`

Candidate's Explanation:
${explanationSnippet}

Act as a strict but fair interviewer. Evaluate the candidate's code and explanation against the question.
Assess the code correctness, code quality, edge cases, complexity (time and space), and the clarity and depth of their explanation.
Provide scores out of 10 and concise comments.
Respond strictly in JSON format matching this structure:
{
  "overall": 8,
  "clarity": 7,
  "depth": 8,
  "relevance": 9,
  "strengths": "One sentence on what was done well in the code or explanation.",
  "improvements": "One sentence on what to improve in the code or explanation.",
  "model_answer_hint": "One sentence hinting at the ideal answer approach or optimal code solution."
}
Use integer scores only (1-10) — no decimals. Do not include any other markdown formatting, code block markers, or explanation.
`
    : `
You are an expert technical interviewer.
Evaluate the candidate's answer to the following question.

Question: ${questionText}
Candidate's Answer: ${answerText}

Act as a strict but fair interviewer. Evaluate the candidate's answer against the question.
Provide scores out of 10 and concise comments.
Respond strictly in JSON format matching this structure:
{
  "overall": 8,
  "clarity": 7,
  "depth": 8,
  "relevance": 9,
  "strengths": "One sentence on what was done well.",
  "improvements": "One sentence on what to improve.",
  "model_answer_hint": "One sentence hinting at the ideal answer approach."
}
Use integer scores only (1-10) — no decimals. Do not include any other markdown formatting, code block markers, or explanation.
`;

  let evaluation: any = null;

  try {
    const response = await ai.models.generateContent({
      model: ENV.REVIEW_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response || !response.text) {
      throw new Error("No response text from Gemini API for review");
    }

    const parsed = JSON.parse(response.text.trim());
    const overall = typeof parsed.overall === "number" ? parsed.overall : 0;
    const clarity = typeof parsed.clarity === "number" ? parsed.clarity : 0;
    const depth = typeof parsed.depth === "number" ? parsed.depth : 0;
    const relevance = typeof parsed.relevance === "number" ? parsed.relevance : 0;
    const strengths = parsed.strengths || "Answer submitted.";
    const improvements = parsed.improvements || "No specific improvements suggested.";
    const model_answer_hint = parsed.model_answer_hint || parsed.hint || "No hint available.";

    evaluation = {
      overall,
      clarity,
      depth,
      relevance,
      strengths,
      improvements,
      model_answer_hint
    };

    const feedbackStr = JSON.stringify(evaluation);

    // Find if the answer record already exists
    const existingAnswer = await prisma.answers.findFirst({
      where: {
        userInputId: setupId,
        questionIndex: questionIndex,
      },
    });

    if (existingAnswer) {
      await prisma.answers.update({
        where: { id: existingAnswer.id },
        data: {
          feedback: feedbackStr,
          score: overall,
        },
      });
    } else {
      await prisma.answers.create({
        data: {
          userInputId: setupId,
          questionIndex: questionIndex,
          answer: answerText,
          feedback: feedbackStr,
          score: overall,
        },
      });
    }
  } catch (error) {
    console.error("Error in reviewAnswerAndSave:", error);
    // Persist a fallback placeholder review in case of failure so the database record is created
    evaluation = {
      overall: 0,
      clarity: 0,
      depth: 0,
      relevance: 0,
      strengths: "Evaluation failed to run successfully.",
      improvements: "Please check your connection and configuration.",
      model_answer_hint: "Review evaluation failed."
    };
    const feedbackStr = JSON.stringify(evaluation);

    try {
      const existingAnswer = await prisma.answers.findFirst({
        where: {
          userInputId: setupId,
          questionIndex: questionIndex,
        },
      });

      if (existingAnswer) {
        await prisma.answers.update({
          where: { id: existingAnswer.id },
          data: {
            feedback: feedbackStr,
            score: 0,
          },
        });
      } else {
        await prisma.answers.create({
          data: {
            userInputId: setupId,
            questionIndex: questionIndex,
            answer: answerText,
            feedback: feedbackStr,
            score: 0,
          },
        });
      }
    } catch (dbErr) {
      console.error("Failed to save fallback review to database:", dbErr);
    }
  }

  return evaluation;
}
