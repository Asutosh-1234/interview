"use client";

import React from "react";
import { ProgressBar } from "./ProgressBar";
import { CodeEditorContainer } from "./CodeEditorContainer";
import { useInterviewSessionState } from "@/lib/hooks/useInterviewSessionState";

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
  const {
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
  } = useInterviewSessionState(setup);

  const wordCount = answer.trim() === "" ? 0 : answer.trim().split(/\s+/).length;
  const isQuestionLoaded = currentQuestionText.length > 0;

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
