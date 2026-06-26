import { zodVerify } from "@/lib/common/zodVeryfication";
import { createSetupDto } from "./setup.dto";
import { CreateSetupPayload } from "./setup.type";
import { GoogleGenAI, Type } from "@google/genai";
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
    model: ENV.QUESTION_MODEL,
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
  companyName?: string;
  techStack: string[];
  difficulty: string;
  yearsOfExperience: number;
  interviewType: string;
  questionIndex: number;
  history: { question: string; answer: string }[];
}) {
  let prompt = "";
  const companyInfo = config.companyName ? `- Target Company: ${config.companyName}\n` : "";

  if (config.questionIndex === 0) {
    prompt = `
You are an expert technical interviewer.
Generate the first interview question for the candidate based on their setup:
- Job Title: ${config.jobTitle}
${companyInfo}- Target Experience Level: ${config.difficulty} (${config.yearsOfExperience} years of experience)
- Interview Type: ${config.interviewType}
- Tech Stack / Topics: ${config.techStack.join(", ") || "General software development"}

Generate Question #1. If a target company is specified, tailor the question style and scenarios to fit that company's engineering standards.
Respond with ONLY the text of the question. Do not include any formatting, markdown, intro, or conversational filler.

CRITICAL: If the question requires the candidate to write code, solve a programming problem, or write an algorithm, you MUST call the tool 'triggerCodingChallenge' with the appropriate programmingLanguage value (e.g., javascript, python, typescript, java, cpp).
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
${companyInfo}- Target Experience Level: ${config.difficulty} (${config.yearsOfExperience} years of experience)
- Interview Type: ${config.interviewType}
- Tech Stack / Topics: ${config.techStack.join(", ") || "General software development"}

Interview History:
${historyText}

Based on the candidate's previous responses, generate Question #${config.questionIndex + 1}.
Adapt to their answers: go deeper into a topic if they answered well, ask a follow-up to clarify, or pivot to another relevant skill if needed. If a target company is specified, keep questions aligned with that company's focus area.
Respond with ONLY the text of the next question. Do not include any formatting, markdown, intro, or conversational filler.

CRITICAL: If the question requires the candidate to write code, solve a programming problem, or write an algorithm, you MUST call the tool 'triggerCodingChallenge' with the appropriate programmingLanguage value (e.g., javascript, python, typescript, java, cpp).
`;
  }

  const responseStream = await ai.models.generateContentStream({
    model: ENV.QUESTION_MODEL,
    contents: prompt,
    config: {
      tools: [
        {
          functionDeclarations: [
            {
              name: "triggerCodingChallenge",
              description: "Call this tool if and only if the generated interview question is a coding question, programming task, or algorithm challenge. Calling this tool triggers the IDE editor UI so the candidate can write and explain their code.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  programmingLanguage: {
                    type: Type.STRING,
                    description: "The specific programming language for this coding task (e.g. javascript, python, typescript, java, cpp)."
                  }
                },
                required: ["programmingLanguage"]
              }
            }
          ]
        }
      ]
    }
  });

  return responseStream;
}

export async function generateQuestionTips(questionText: string): Promise<string[]> {
  const prompt = `
You are an expert technical interviewer.
Given the following interview question, provide 3 short, helpful hint chips (tips) for the candidate on how to approach answering it.
Each hint must be very brief (under 8 words).

Question: ${questionText}

Respond strictly in JSON format matching this structure:
{
  "tips": [
    "First tip",
    "Second tip",
    "Third tip"
  ]
}
Do not include any other markdown formatting, code block markers, or explanation.
`;

  try {
    const response = await ai.models.generateContent({
      model: ENV.QUESTION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      if (Array.isArray(parsed.tips)) {
        return parsed.tips.slice(0, 3).map((tip: string) => tip.trim());
      }
    }
  } catch (e) {
    console.error("Failed to generate tips:", e);
  }
  return ["Think about structure", "Give real-world examples", "Keep it concise"];
}
