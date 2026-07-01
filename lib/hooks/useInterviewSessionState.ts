import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInterviewTimer } from "./useInterviewTimer";
import { useSecurityRestrictions } from "./useSecurityRestrictions";

interface SetupProps {
  id: number;
  jobTitle: string;
  companyName: string | null;
  questionsCount: number;
  techStack: string[];
  difficulty: string;
  yearsOfExperience: number;
  interviewType: string;
  questions: string[];
  timerDuration: number;
}

export function useInterviewSessionState(setup: SetupProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>(setup.questions);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const [answer, setAnswer] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [presetLanguage, setPresetLanguage] = useState("javascript");
  const [warningToast, setWarningToast] = useState<string | null>(null);

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Hook up timer
  const timerActive = setup.timerDuration > 0 && !isStreaming && !isSubmitting;
  const timeLeft = useInterviewTimer(setup.timerDuration, timerActive, () =>
    handleTimeExpired()
  );

  // Hook up security restrictions
  useSecurityRestrictions(true, (msg) => setWarningToast(msg));

  // Auto-dismiss warning toast after 3 seconds
  useEffect(() => {
    if (warningToast) {
      const timer = setTimeout(() => {
        setWarningToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningToast]);

  // Listen to the custom event triggered by the AI (or ourselves)
  useEffect(() => {
    const handleCodingEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.language) {
        setPresetLanguage(customEvent.detail.language);
      }
      setIsCodingMode(true);
    };

    window.addEventListener("ai-coding-question", handleCodingEvent);
    return () => {
      window.removeEventListener("ai-coding-question", handleCodingEvent);
    };
  }, []);

  // Stream current question when index or questions array changes
  useEffect(() => {
    const loadQuestion = async () => {
      setError(null);
      setAnswer("");
      setTips([]);
      setIsCodingMode(false);
      setPresetLanguage("javascript");

      const questionInDb = questions[currentQuestionIndex];

      if (questionInDb) {
        const { cleanText, language } = parseTriggerToken(questionInDb);
        setCurrentQuestionText(cleanText);
        fetchTips(cleanText);

        if (checkIsCodingQuestion(cleanText)) {
          window.dispatchEvent(
            new CustomEvent("ai-coding-question", {
              detail: {
                questionText: cleanText,
                language: language || "javascript",
              },
            })
          );
        }
      } else {
        setIsStreaming(true);
        setCurrentQuestionText("");

        try {
          const finalRawText = await streamQuestion(
            setup.id,
            currentQuestionIndex,
            (displayQuestion, detectedLang) => {
              setCurrentQuestionText(displayQuestion);
              if (detectedLang || checkIsCodingQuestion(displayQuestion)) {
                window.dispatchEvent(
                  new CustomEvent("ai-coding-question", {
                    detail: { language: detectedLang || "javascript" },
                  })
                );
              }
            }
          );

          setIsStreaming(false);

          const { cleanText, language } = parseTriggerToken(finalRawText);
          const newQuestions = [...questions];
          newQuestions[currentQuestionIndex] = cleanText;
          setQuestions(newQuestions);
          setCurrentQuestionText(cleanText);

          fetchTips(cleanText);

          if (checkIsCodingQuestion(cleanText)) {
            window.dispatchEvent(
              new CustomEvent("ai-coding-question", {
                detail: {
                  questionText: cleanText,
                  language: language || "javascript",
                },
              })
            );
          }
        } catch (err: any) {
          setIsStreaming(false);
          setError(
            err.message || "Failed to generate question. Please try again."
          );
        }
      }
    };

    loadQuestion();
  }, [currentQuestionIndex]);

  const fetchTips = async (questionText: string) => {
    setIsLoadingTips(true);
    try {
      const fetchedTips = await fetchTipsApi(setup.id, questionText);
      setTips(fetchedTips);
    } catch (e) {
      console.error("Failed to fetch tips", e);
    } finally {
      setIsLoadingTips(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please write an answer before submitting.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await submitAnswerApi(setup.id, currentQuestionIndex, answer.trim());
      handleNextQuestion();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await submitAnswerApi(setup.id, currentQuestionIndex, "Skipped", true);
      handleNextQuestion();
    } catch (err: any) {
      setError(err.message || "Failed to skip question properly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeExpired = async () => {
    const currentAnswer = answerRef.current;
    setError("Time expired! Submitting answer...");
    setIsSubmitting(true);

    try {
      const isSkipped = currentAnswer.trim() === "";
      await submitAnswerApi(
        setup.id,
        currentQuestionIndex,
        isSkipped ? "Skipped" : currentAnswer.trim(),
        isSkipped
      );
      handleNextQuestion();
    } catch (err) {
      console.error(err);
      handleNextQuestion();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= setup.questionsCount) {
      router.push(`/summery?currentSetupId=${setup.id}`);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleEndInterview = () => {
    router.push(`/summery?currentSetupId=${setup.id}`);
  };

  return {
    currentQuestionIndex,
    currentQuestionText,
    isStreaming,
    answer,
    setAnswer,
    tips,
    isLoadingTips,
    isSubmitting,
    error,
    timeLeft,
    isCodingMode,
    presetLanguage,
    warningToast,
    handleSubmitAnswer,
    handleSkip,
    handleEndInterview,
  };
}

// ==========================================
// Helper functions & API utility clients
// ==========================================

function checkIsCodingQuestion(text: string): boolean {
  const codingKeywords = [
    "write a function",
    "write code",
    "implement a function",
    "coding question",
    "coding challenge",
    "write a program",
    "write an algorithm",
    "fizzbuzz",
    "programming problem",
    "implement the following",
    "solve this challenge",
    "implement a method",
  ];
  const lowerText = text.toLowerCase();

  if (lowerText.includes("```") || lowerText.includes("`code`")) {
    return true;
  }

  return codingKeywords.some((keyword) => lowerText.includes(keyword));
}

function parseTriggerToken(text: string): {
  cleanText: string;
  language: string | null;
} {
  const match = text.match(/\[TRIGGER_CODE_EDITOR:([a-zA-Z0-9+#]+)\]/);
  if (match) {
    return {
      cleanText: text.replace(/\[TRIGGER_CODE_EDITOR:[a-zA-Z0-9+#]+\]/g, ""),
      language: match[1],
    };
  }
  return { cleanText: text, language: null };
}

async function fetchTipsApi(
  setupId: number,
  questionText: string
): Promise<string[]> {
  const res = await fetch(`/api/setup/${setupId}/questions/tips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question: questionText }),
  });

  if (res.ok) {
    const data = await res.json();
    return data.tips || [];
  }
  throw new Error("Failed to fetch tips");
}

async function submitAnswerApi(
  setupId: number,
  questionIndex: number,
  answerText: string,
  skipped = false
): Promise<void> {
  const res = await fetch(`/api/setup/${setupId}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionIndex,
      answer: answerText,
      skipped,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to submit answer.");
  }
}

async function streamQuestion(
  setupId: number,
  questionIndex: number,
  onChunk: (displayQuestion: string, detectedLang: string | null) => void
): Promise<string> {
  const res = await fetch(`/api/setup/${setupId}/questions/next`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ questionIndex }),
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || "Failed to generate next question");
  }

  if (!res.body) {
    throw new Error("Response body is not readable");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let text = "";

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      const chunk = decoder.decode(value);
      text += chunk;

      const { cleanText, language } = parseTriggerToken(text);
      onChunk(cleanText, language);
    }
  }

  return text.trim();
}
