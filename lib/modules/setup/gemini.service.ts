import { zodVerify } from "@/lib/common/zodVeryfication";
import { createSetupDto } from "./setup.dto";
import { CreateSetupPayload } from "./setup.type";
import { GoogleGenAI } from "@google/genai";
import ENV from "@/lib/common/env";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export async function questionGeneration(config: CreateSetupPayload) {
  const verifiedData = zodVerify(createSetupDto, config);

  if (!verifiedData.success) {
    throw new Error(verifiedData.error?.issues.map((err) => err.message).join(", "));
  }

  const {
    difficulty,
    interviewType,
    jobTitle,
    questionsCount,
    techStack,
    yearsOfExperience
  } = verifiedData.data;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are an expert technical interviewer. Generate a list of customized interview questions based on the following candidate configuration: 
    - Job Role / Title: ${jobTitle}
    - Target Experience Level: ${difficulty} (${yearsOfExperience} years of experience)
    - Interview Type: ${interviewType}
    - Key Tech Stack / Topics: ${techStack.join(", ") || "General software development"}
    - Number of Questions to generate: ${questionsCount}

    Provide highly relevant, professional, and challenging questions suitable for the specified role and level.
    Respond strictly in JSON format matching the following structure:
    {
      "questions": [
        "First question here",
        "Second question here"
      ]
    }
    Do not include any other markdown formatting, code block markers, explanation, or conversational text.
    `,
    config: {
      responseMimeType: "application/json",
    }
  });

  if (!response || !response.text) {
    throw new Error("Failed to generate questions");
  }

  const questionsText = response.text;

  try {
    const parsed = JSON.parse(questionsText.trim());
    return parsed;
  } catch (error) {
    const jsonRegex = /\{[\s\S]*\}/;
    const match = questionsText.match(jsonRegex);
    if (!match) {
      throw new Error("Failed to parse questions JSON from response");
    }
    return JSON.parse(match[0]);
  }
}

export async function generateNextQuestionStream(config: {
  jobTitle: string;
  techStack: string[];
  difficulty: string;
  yearsOfExperience: number;
  interviewType: string;
  questionIndex: number;
  history: { question: string; answer: string }[];
}) {
  let prompt = "";

  if (config.questionIndex === 0) {
    prompt = `
You are an expert technical interviewer.
Generate the first interview question for the candidate based on their setup:
- Job Title: ${config.jobTitle}
- Target Experience Level: ${config.difficulty} (${config.yearsOfExperience} years of experience)
- Interview Type: ${config.interviewType}
- Tech Stack / Topics: ${config.techStack.join(", ") || "General software development"}

Generate Question #1.
Respond with ONLY the text of the question. Do not include any formatting, markdown, intro, or conversational filler.
`;
  } else {
    const historyText = config.history
      .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
      .join("\n\n");

    prompt = `
You are an expert technical interviewer.
Generate the next adaptive interview question for the candidate based on their setup and the history of the interview.

Candidate Setup:
- Job Title: ${config.jobTitle}
- Target Experience Level: ${config.difficulty} (${config.yearsOfExperience} years of experience)
- Interview Type: ${config.interviewType}
- Tech Stack / Topics: ${config.techStack.join(", ") || "General software development"}

Interview History:
${historyText}

Based on the candidate's previous responses, generate Question #${config.questionIndex + 1}.
Adapt to their answers: go deeper into a topic if they answered well, ask a follow-up to clarify, or pivot to another relevant skill if needed.
Respond with ONLY the text of the next question. Do not include any formatting, markdown, intro, or conversational filler.
`;
  }

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return responseStream;
}
