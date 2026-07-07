import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  initializeSession,
  setCurrentQuestionIndex,
  setQuestions,
  setCurrentQuestionText,
  setIsStreaming,
  setAnswer as setAnswerAction,
  setTips,
  setIsLoadingTips,
  setIsSubmitting,
  setError,
  setIsCodingMode,
  setPresetLanguage,
  setWarningToast,
} from "@/lib/store/features/interviewSlice";
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
  const dispatch = useAppDispatch();

  // Read state from Redux
  const {
    currentQuestionIndex,
    questions,
    currentQuestionText,
    isStreaming,
    answer,
    tips,
    isLoadingTips,
    isSubmitting,
    error,
    isCodingMode,
    presetLanguage,
    warningToast,
  } = useAppSelector((state) => state.interview);

  // Initialize session once when component mounts or setup changes
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current) {
      dispatch(
        initializeSession({
          questions: setup.questions,
          timerDuration: setup.timerDuration,
        })
      );
      isInitializedRef.current = true;
    }
  }, [setup.questions, setup.timerDuration, dispatch]);

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Hook up timer
  const timerActive = setup.timerDuration > 0 && !isStreaming && !isSubmitting && isInitializedRef.current;
  const timeLeft = useInterviewTimer(setup.timerDuration, timerActive, () =>
    handleTimeExpired()
  );

  // Hook up security restrictions
  useSecurityRestrictions(
    true,
    (msg) => dispatch(setWarningToast(msg)),
    () => {
      router.push(`/summery?currentSetupId=${setup.id}&terminated=true`);
    }
  );

  // Auto-dismiss warning toast after 3 seconds
  useEffect(() => {
    if (warningToast) {
      const timer = setTimeout(() => {
        dispatch(setWarningToast(null));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningToast, dispatch]);

  // Listen to the custom event triggered by the AI (or ourselves)
  useEffect(() => {
    const handleCodingEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.language) {
        dispatch(setPresetLanguage(customEvent.detail.language));
      }
      dispatch(setIsCodingMode(true));
    };

    window.addEventListener("ai-coding-question", handleCodingEvent);
    return () => {
      window.removeEventListener("ai-coding-question", handleCodingEvent);
    };
  }, [dispatch]);

  // Stream current question when index or questions array changes
  useEffect(() => {
    // Only load if questions have been initialized
    if (questions.length === 0) return;

    const loadQuestion = async () => {
      dispatch(setError(null));
      dispatch(setAnswerAction(""));
      dispatch(setTips([]));
      dispatch(setIsCodingMode(false));
      dispatch(setPresetLanguage("javascript"));

      const questionInDb = questions[currentQuestionIndex];

      if (questionInDb) {
        const { cleanText, language } = parseTriggerToken(questionInDb);
        dispatch(setCurrentQuestionText(cleanText));
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
        dispatch(setIsStreaming(true));
        dispatch(setCurrentQuestionText(""));

        try {
          const finalRawText = await streamQuestion(
            setup.id,
            currentQuestionIndex,
            (displayQuestion, detectedLang) => {
              dispatch(setCurrentQuestionText(displayQuestion));
              if (detectedLang || checkIsCodingQuestion(displayQuestion)) {
                window.dispatchEvent(
                  new CustomEvent("ai-coding-question", {
                    detail: { language: detectedLang || "javascript" },
                  })
                );
              }
            }
          );

          dispatch(setIsStreaming(false));

          const { cleanText, language } = parseTriggerToken(finalRawText);
          const newQuestions = [...questions];
          newQuestions[currentQuestionIndex] = cleanText;
          dispatch(setQuestions(newQuestions));
          dispatch(setCurrentQuestionText(cleanText));

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
          dispatch(setIsStreaming(false));
          dispatch(
            setError(
              err.message || "Failed to generate question. Please try again."
            )
          );
        }
      }
    };

    loadQuestion();
  }, [
    currentQuestionIndex,
    questions.length,
    questions[currentQuestionIndex],
    dispatch,
    setup.id,
  ]);

  const fetchTips = async (questionText: string) => {
    dispatch(setIsLoadingTips(true));
    try {
      const fetchedTips = await fetchTipsApi(setup.id, questionText);
      dispatch(setTips(fetchedTips));
    } catch (e) {
      console.error("Failed to fetch tips", e);
    } finally {
      dispatch(setIsLoadingTips(false));
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      dispatch(setError("Please write an answer before submitting."));
      return;
    }

    dispatch(setError(null));
    dispatch(setIsSubmitting(true));

    try {
      await submitAnswerApi(setup.id, currentQuestionIndex, answer.trim());
      handleNextQuestion();
    } catch (err: any) {
      dispatch(setError(err.message || "Something went wrong."));
    } finally {
      dispatch(setIsSubmitting(false));
    }
  };

  const handleSkip = async () => {
    dispatch(setError(null));
    dispatch(setIsSubmitting(true));

    try {
      await submitAnswerApi(setup.id, currentQuestionIndex, "Skipped", true);
      handleNextQuestion();
    } catch (err: any) {
      dispatch(setError(err.message || "Failed to skip question properly."));
    } finally {
      dispatch(setIsSubmitting(false));
    }
  };

  const handleTimeExpired = async () => {
    const currentAnswer = answerRef.current;
    dispatch(setError("Time expired! Submitting answer..."));
    dispatch(setIsSubmitting(true));

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
      dispatch(setIsSubmitting(false));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= setup.questionsCount) {
      router.push(`/summery?currentSetupId=${setup.id}`);
    } else {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
    }
  };

  const handleEndInterview = () => {
    router.push(`/summery?currentSetupId=${setup.id}`);
  };

  const setAnswer = (val: string) => {
    dispatch(setAnswerAction(val));
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
