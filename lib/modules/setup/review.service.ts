import { GoogleGenAI } from "@google/genai";
import ENV from "../../common/env";
import prisma from "../../db/prisma";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export async function reviewAnswerAndSave(
  setupId: number,
  questionIndex: number,
  questionText: string,
  answerText: string
): Promise<void> {
  const prompt = `
You are an expert technical interviewer.
Evaluate the candidate's answer to the following question.

Question: ${questionText}
Candidate's Answer: ${answerText}

Provide constructive feedback and rate the answer on a scale from 0 to 10.
Respond strictly in JSON format matching this structure:
{
  "feedback": "Your detailed feedback and suggestions for improvement.",
  "score": 8
}
Do not include any other markdown formatting, code block markers, or explanation.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response || !response.text) {
      throw new Error("No response text from Gemini API for review");
    }

    const parsed = JSON.parse(response.text.trim());
    const feedback = parsed.feedback || "Answer evaluated.";
    const score = typeof parsed.score === "number" ? parsed.score : null;

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
          feedback,
          score,
        },
      });
    } else {
      await prisma.answers.create({
        data: {
          userInputId: setupId,
          questionIndex: questionIndex,
          answer: answerText,
          feedback,
          score,
        },
      });
    }
  } catch (error) {
    console.error("Error in background reviewAnswerAndSave:", error);
    // Persist a fallback placeholder review in case of failure so the database record is created
    try {
      const existingAnswer = await prisma.answers.findFirst({
        where: {
          userInputId: setupId,
          questionIndex: questionIndex,
        },
      });

      if (!existingAnswer) {
        await prisma.answers.create({
          data: {
            userInputId: setupId,
            questionIndex: questionIndex,
            answer: answerText,
            feedback: "Review evaluation failed. The answer has been saved.",
            score: null,
          },
        });
      }
    } catch (dbErr) {
      console.error("Failed to save fallback review to database:", dbErr);
    }
  }
}
