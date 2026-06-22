"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "./ProgressBar";

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

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const wordCount = answer.trim() === "" ? 0 : answer.trim().split(/\s+/).length;
  const isQuestionLoaded = currentQuestionText.length > 0;

  // Stream current question when index or questions array changes
  useEffect(() => {
    const loadQuestion = async () => {
      setError(null);
      setAnswer("");
      setTips([]);
      
      const questionInDb = questions[currentQuestionIndex];
      
      if (questionInDb) {
        // Question is already generated and saved
        setCurrentQuestionText(questionInDb);
        fetchTips(questionInDb);
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

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              const chunk = decoder.decode(value);
              text += chunk;
              setCurrentQuestionText(text);
            }
          }

          setIsStreaming(false);
          // Update questions local state
          const newQuestions = [...questions];
          newQuestions[currentQuestionIndex] = text.trim();
          setQuestions(newQuestions);
          
          // Load tips for this generated question
          fetchTips(text.trim());
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
    <div className="w-full max-w-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl z-10 flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {setup.jobTitle}
            </h1>
            {setup.companyName && (
              <p className="text-xs text-slate-400 font-medium">
                Targeting: {setup.companyName} ({setup.difficulty} level)
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-linear-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-violet-400 tracking-wide uppercase">
              {setup.interviewType}
            </span>
            {setup.timerDuration > 0 && !isStreaming && !isSubmitting && (
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                timeLeft <= 15 
                  ? "text-red-400 bg-red-500/10 border-red-500/30 animate-pulse" 
                  : "text-amber-400 bg-amber-500/10 border-amber-500/30"
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
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Question Card */}
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 min-h-[140px] relative justify-center">
        {isStreaming && (
          <span className="absolute top-4 right-4 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
        )}
        
        {isQuestionLoaded ? (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-medium text-slate-100 leading-relaxed">
              {currentQuestionText}
              {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-violet-400 animate-pulse" />}
            </p>

            {/* Tip Chips */}
            {tips.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mr-1">Interviewer Tips:</span>
                {tips.map((tip, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 transition-all hover:border-slate-700"
                  >
                    💡 {tip}
                  </span>
                ))}
              </div>
            )}
            
            {isLoadingTips && (
              <div className="flex gap-2 items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mr-1">Loading tips...</span>
                <span className="w-3 h-3 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-4 items-center">
            <span className="w-8 h-8 border-3 border-violet-600/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-400">Interviewer is generating the question...</p>
          </div>
        )}
      </div>

      {/* Answer Area */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Your Response
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isStreaming || isSubmitting}
          placeholder={isStreaming ? "Wait for the interviewer to finish asking..." : "Type your detailed answer here. Focus on real-world examples, structure, and technical depth..."}
          className="w-full h-40 px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-violet-500 text-slate-100 placeholder-slate-600 transition-all duration-200 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Word Count: {wordCount}</span>
          <span>Aim for 50-150 words for a complete answer</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <button
            onClick={handleSkip}
            disabled={isStreaming || isSubmitting}
            className="py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 font-semibold rounded-xl active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Skip Question
          </button>
          <button
            onClick={handleSubmitAnswer}
            disabled={isStreaming || isSubmitting || !answer.trim()}
            className="py-3 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-800/50 disabled:to-indigo-800/50 text-white font-bold rounded-xl active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answer"
            )}
          </button>
          <button
            onClick={handleEndInterview}
            disabled={isStreaming || isSubmitting}
            className="col-span-2 sm:col-span-1 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-950/60 hover:border-red-900/80 text-red-400 hover:text-red-300 font-semibold rounded-xl active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
};
