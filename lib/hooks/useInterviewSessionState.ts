import { useEffect, useRef, useState } from "react";
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

  // Proctoring and Recording States
  const [screenShareState, setScreenShareState] = useState<'idle' | 'prompt' | 'recording' | 'stopped' | 'error'>('idle');
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [proctoringLogs, setProctoringLogs] = useState<{ timestamp: string; event: string; duration?: number }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tabSwitchesCountRef = useRef(0);
  const proctoringLogsRef = useRef<{ timestamp: string; event: string; duration?: number }[]>([]);
  const lastLeftTimeRef = useRef<number | null>(null);

  const addProctoringLog = async (event: string, duration?: number) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      event,
      duration,
    };
    const updatedLogs = [...proctoringLogsRef.current, newLog];
    proctoringLogsRef.current = updatedLogs;
    setProctoringLogs(updatedLogs);

    try {
      await fetch(`/api/setup/${setup.id}/proctoring`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tabSwitchesCount: tabSwitchesCountRef.current,
          tabSwitchLogs: JSON.stringify(updatedLogs),
        }),
      });
    } catch (e) {
      console.error("Failed to sync proctoring logs:", e);
    }
  };

  const startScreenRecording = async () => {
    setScreenShareState('prompt');
    setScreenShareError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 10 },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setScreenShareState('stopped');
          addProctoringLog("Screen sharing was stopped by the user.");
        };
      }

      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const completeBlob = new Blob(chunksRef.current, { type: "video/webm" });
        const { saveRecordingLocal } = await import("@/lib/utils/db");
        await saveRecordingLocal(setup.id, completeBlob);

        setIsUploadingRecording(true);
        try {
          const formData = new FormData();
          formData.append("recording", completeBlob, "recording.webm");

          const res = await fetch(`/api/setup/${setup.id}/recording`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error("Failed to upload recording to server");
          }
          addProctoringLog("Screen recording uploaded successfully.");
        } catch (err: any) {
          console.error(err);
          addProctoringLog(`Screen recording upload failed: ${err.message || err}. Saved in local browser cache.`);
        } finally {
          setIsUploadingRecording(false);
        }
      };

      mediaRecorder.start(2000);
      setScreenShareState('recording');
      addProctoringLog("Screen recording started.");
      return true;
    } catch (err: any) {
      console.error(err);
      setScreenShareState('error');
      setScreenShareError(err.message || "Failed to start screen recording. Please grant permissions.");
      return false;
    }
  };

  const resumeScreenRecording = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    return await startScreenRecording();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleTabSwitch = async (visibilityState: "hidden" | "visible") => {
    if (screenShareState === 'idle') return;

    if (visibilityState === "hidden") {
      const leftTime = Date.now();
      lastLeftTimeRef.current = leftTime;

      const newCount = tabSwitchesCountRef.current + 1;
      tabSwitchesCountRef.current = newCount;
      setTabSwitchesCount(newCount);

      const timestampStr = new Date().toLocaleTimeString();
      await addProctoringLog(`Switched away from interview tab (Violation ${newCount}/3) at ${timestampStr}`);
      dispatch(setWarningToast(`Warning: Tab switch detected! (Violation ${newCount}/3)`));
    } else {
      if (lastLeftTimeRef.current !== null) {
        const returnedTime = Date.now();
        const durationSec = Math.round((returnedTime - lastLeftTimeRef.current) / 1000);
        lastLeftTimeRef.current = null;

        const timestampStr = new Date().toLocaleTimeString();
        await addProctoringLog(`Returned to interview tab at ${timestampStr} (Away for ${durationSec}s)`);

        if (tabSwitchesCountRef.current >= 3) {
          await addProctoringLog(`Interview terminated automatically due to excessive tab switches (3 violations).`);
          stopRecording();
          setTimeout(() => {
            router.push(`/summery?currentSetupId=${setup.id}&terminated=true`);
          }, 1000);
        }
      }
    }
  };

  useSecurityRestrictions(
    screenShareState === 'recording',
    (msg) => dispatch(setWarningToast(msg)),
    handleTabSwitch
  );

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
      stopRecording();
      setTimeout(() => {
        router.push(`/summery?currentSetupId=${setup.id}`);
      }, 1500);
    } else {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
    }
  };

  const handleEndInterview = () => {
    stopRecording();
    setTimeout(() => {
      router.push(`/summery?currentSetupId=${setup.id}`);
    }, 1500);
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
    screenShareState,
    screenShareError,
    isUploadingRecording,
    tabSwitchesCount,
    proctoringLogs,
    startScreenRecording,
    resumeScreenRecording,
    stopRecording,
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
