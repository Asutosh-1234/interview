"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "./ProgressBar";
import { CodeEditorContainer } from "./CodeEditorContainer";

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

interface InterviewContainerProps {
  setup: SetupProps;
}

export const InterviewContainer: React.FC<InterviewContainerProps> = ({ setup }) => {
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
  const [timeLeft, setTimeLeft] = useState<number>(setup.timerDuration);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [presetLanguage, setPresetLanguage] = useState("javascript");
  const [warningToast, setWarningToast] = useState<string | null>(null);

  // Auto-dismiss warning toast after 3 seconds
  useEffect(() => {
    if (warningToast) {
      const timer = setTimeout(() => {
        setWarningToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningToast]);

  // Prevent copy, cut, paste, drop, and right-click during the interview session
  useEffect(() => {
    const handleBlockAction = (e: Event) => {
      e.preventDefault();
      setWarningToast("Copying and pasting is disabled during the interview session.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (
        isCmdOrCtrl &&
        (e.key === "c" ||
          e.key === "v" ||
          e.key === "x" ||
          e.key === "C" ||
          e.key === "V" ||
          e.key === "X")
      ) {
        e.preventDefault();
        e.stopPropagation(); // Stop Monaco editor or browser from handling this shortcut
        setWarningToast("Keyboard shortcuts for copy, cut, and paste are disabled.");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setWarningToast("Right-click context menu is disabled.");
    };

    // Use capturing phase (true) to intercept events before Monaco editor or others catch them
    document.addEventListener("copy", handleBlockAction, true);
    document.addEventListener("cut", handleBlockAction, true);
    document.addEventListener("paste", handleBlockAction, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("drop", handleBlockAction, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("copy", handleBlockAction, true);
      document.removeEventListener("cut", handleBlockAction, true);
      document.removeEventListener("paste", handleBlockAction, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("drop", handleBlockAction, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, []);

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const checkIsCodingQuestion = (text: string): boolean => {
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
      "implement a method"
    ];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("```") || lowerText.includes("`code`")) {
      return true;
    }
    
    return codingKeywords.some(keyword => lowerText.includes(keyword));
  };

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

  const wordCount = answer.trim() === "" ? 0 : answer.trim().split(/\s+/).length;
  const isQuestionLoaded = currentQuestionText.length > 0;

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
        // Question is already generated and saved
        let processedQuestion = questionInDb;
        let dbLanguage = "javascript";
        
        // Check if DB question has trigger token (in case it was written raw)
        if (processedQuestion.includes("[TRIGGER_CODE_EDITOR:")) {
          const match = processedQuestion.match(/\[TRIGGER_CODE_EDITOR:([a-zA-Z0-9+#]+)\]/);
          if (match) {
            dbLanguage = match[1];
            processedQuestion = processedQuestion.replace(/\[TRIGGER_CODE_EDITOR:[a-zA-Z0-9+#]+\]/g, "");
          }
        }
        
        setCurrentQuestionText(processedQuestion);
        fetchTips(processedQuestion);

        // Classify question and dispatch custom event if it's coding
        if (checkIsCodingQuestion(processedQuestion)) {
          window.dispatchEvent(new CustomEvent("ai-coding-question", {
            detail: { questionText: processedQuestion, language: dbLanguage }
          }));
        }
      } else {
        // Need to stream the question
        setIsStreaming(true);
        setCurrentQuestionText("");
        
        try {
          const res = await fetch(`/api/setup/${setup.id}/questions/next`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ questionIndex: currentQuestionIndex }),
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
          let detectedLang = "javascript";

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              const chunk = decoder.decode(value);
              text += chunk;
              
              // Inspect and strip trigger token
              let displayQuestion = text;
              if (displayQuestion.includes("[TRIGGER_CODE_EDITOR:")) {
                const match = displayQuestion.match(/\[TRIGGER_CODE_EDITOR:([a-zA-Z0-9+#]+)\]/);
                if (match) {
                  detectedLang = match[1];
                  // Remove the trigger tag from text
                  displayQuestion = displayQuestion.replace(/\[TRIGGER_CODE_EDITOR:[a-zA-Z0-9+#]+\]/g, "");
                  
                  // Dispatch custom event immediately
                  window.dispatchEvent(new CustomEvent("ai-coding-question", {
                    detail: { language: detectedLang }
                  }));
                }
              }
              
              setCurrentQuestionText(displayQuestion);
            }
          }

          setIsStreaming(false);
          
          // Strip trigger tokens from final text before saving/setting state
          let finalCleanText = text.trim();
          if (finalCleanText.includes("[TRIGGER_CODE_EDITOR:")) {
            finalCleanText = finalCleanText.replace(/\[TRIGGER_CODE_EDITOR:[a-zA-Z0-9+#]+\]/g, "");
          }
          
          // Update questions local state
          const newQuestions = [...questions];
          newQuestions[currentQuestionIndex] = finalCleanText;
          setQuestions(newQuestions);
          setCurrentQuestionText(finalCleanText);
          
          // Load tips for this generated question
          fetchTips(finalCleanText);

          // Classify question and dispatch custom event if it's coding
          if (checkIsCodingQuestion(finalCleanText)) {
            window.dispatchEvent(new CustomEvent("ai-coding-question", {
              detail: { questionText: finalCleanText, language: detectedLang }
            }));
          }
        } catch (err: any) {
          setIsStreaming(false);
          setError(err.message || "Failed to generate question. Please try again.");
        }
      }
    };

    loadQuestion();
  }, [currentQuestionIndex]);

  const fetchTips = async (questionText: string) => {
    setIsLoadingTips(true);
    try {
      const res = await fetch(`/api/setup/${setup.id}/questions/tips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: questionText }),
      });

      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || []);
      }
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
      const res = await fetch(`/api/setup/${setup.id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          answer: answer.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit answer.");
      }

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
      const res = await fetch(`/api/setup/${setup.id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          skipped: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to skip question.");
      }

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
      const res = await fetch(`/api/setup/${setup.id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          answer: isSkipped ? "Skipped" : currentAnswer.trim(),
          skipped: isSkipped,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to auto-submit.");
      }

      handleNextQuestion();
    } catch (err) {
      console.error(err);
      handleNextQuestion();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (setup.timerDuration <= 0 || isStreaming || isSubmitting) return;

    setTimeLeft(setup.timerDuration);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, isStreaming, isSubmitting, setup.timerDuration]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= setup.questionsCount) {
      // Completed last question, redirect to summary
      router.push(`/summery?currentSetupId=${setup.id}`);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleEndInterview = () => {
    router.push(`/summery?currentSetupId=${setup.id}`);
  };

  return (
    <div className="w-full max-w-[800px] glass-panel rounded-xl p-8 md:p-12 shadow-2xl z-10 flex flex-col gap-6 animate-slide-in">
      {/* Header Info */}
      <div className="flex flex-col gap-4 border-b border-slate-850 dark:border-slate-800/80 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Active Session
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-100 uppercase">
              {setup.jobTitle}
            </h1>
            {setup.companyName && (
              <p className="text-xs text-slate-450 mt-1 font-medium">
                Targeting: {setup.companyName} ({setup.difficulty} level)
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-slate-850 dark:border-slate-800/85 rounded-full select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-100 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-200 tracking-wider uppercase">
                {setup.interviewType}
              </span>
            </div>
            {setup.timerDuration > 0 && !isStreaming && !isSubmitting && (
              <span className={`px-2.5 py-1 text-xs font-semibold border rounded-lg flex items-center gap-1.5 ${
                timeLeft <= 15 
                  ? "text-red-400 bg-red-500/10 border-red-500/30 animate-pulse" 
                  : "text-slate-350 bg-slate-900 border-slate-850 dark:border-slate-800/80"
              }`}>
                ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <ProgressBar current={currentQuestionIndex + 1} total={setup.questionsCount} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Question Card */}
      <div className="flex flex-col gap-4 p-6 rounded-lg bg-slate-900/60 dark:bg-black/30 border border-slate-850 dark:border-slate-800/80 min-h-[140px] relative justify-center white-shadow select-none">
        {/* Left vertical primary accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 rounded-l-lg" />
        
        {isStreaming && (
          <span className="absolute top-4 right-4 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-100"></span>
          </span>
        )}
        
        {isQuestionLoaded ? (
          <div className="flex flex-col gap-4 pl-2">
            <p className="text-base md:text-lg font-medium text-slate-100 leading-relaxed">
              {currentQuestionText}
              {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-slate-100 animate-pulse" />}
            </p>

            {/* Tip Chips */}
            {tips.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center mt-1">
                {tips.map((tip, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 dark:bg-slate-900 border border-slate-850 dark:border-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-[10px] font-semibold rounded-full"
                  >
                    💡 {tip}
                  </span>
                ))}
              </div>
            )}
            
            {isLoadingTips && (
              <div className="flex gap-2 items-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Loading tips...</span>
                <span className="w-3 h-3 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-4 items-center">
            <span className="w-6 h-6 border-2 border-slate-800 border-t-slate-200 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Interviewer is generating the question...</p>
          </div>
        )}
      </div>

      {/* Answer Area */}
      {!isCodingMode ? (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            Your Response
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isStreaming || isSubmitting}
            placeholder={isStreaming ? "Wait for the interviewer to finish asking..." : "Type your detailed answer here. Focus on real-world examples, structure, and technical depth..."}
            className="w-full h-40 px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-600 transition-all duration-200 resize-none disabled:opacity-60 disabled:cursor-not-allowed text-sm custom-scrollbar"
          />
          <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
            <span>Word Count: {wordCount}</span>
            <span>Aim for 50-150 words for a complete answer</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <button
              onClick={handleSkip}
              disabled={isStreaming || isSubmitting}
              className="order-2 md:order-1 h-14 border border-slate-850 dark:border-slate-800/80 text-slate-350 hover:text-slate-100 font-semibold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-900/60 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
            >
              Skip Question
            </button>
            <button
              onClick={handleSubmitAnswer}
              disabled={isStreaming || isSubmitting || !answer.trim()}
              className="order-1 md:order-2 h-14 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold rounded-lg hover:shadow-[0px_0px_15px_rgba(255,255,255,0.2)] dark:hover:shadow-[0px_0px_15px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none uppercase tracking-widest text-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Answer"
              )}
            </button>
            <button
              onClick={handleEndInterview}
              disabled={isStreaming || isSubmitting}
              className="order-3 md:order-3 h-14 border border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/60 rounded-lg font-semibold text-xs uppercase tracking-widest active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
            >
              End Interview
            </button>
          </div>
        </div>
      ) : (
        <CodeEditorContainer
          questionText={currentQuestionText}
          initialLanguage={presetLanguage}
          isSubmitting={isSubmitting}
          onChange={(payload) => setAnswer(JSON.stringify(payload))}
          onSubmit={handleSubmitAnswer}
          onSkip={handleSkip}
          onEndInterview={handleEndInterview}
        />
      )}

      {/* Warning Toast */}
      {warningToast && (
        <div className="fixed bottom-6 left-0 right-0 mx-auto w-max z-50 bg-red-950/95 border border-red-500/50 text-red-200 text-sm px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fade-in whitespace-nowrap min-w-[320px] justify-center">
          <span className="text-base text-red-400">🚨</span>
          <span className="font-medium tracking-tight">{warningToast}</span>
        </div>
      )}
    </div>
  );
};
