import React from "react";

interface FeedbackData {
  overall: number;
  clarity: number;
  depth: number;
  relevance: number;
  strengths: string;
  improvements: string;
  model_answer_hint: string;
}

interface FeedbackPanelProps {
  feedback: FeedbackData;
  onNext: () => void;
  isLastQuestion: boolean;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ feedback, onNext, isLastQuestion }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 5) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500 shadow-emerald-500/20";
    if (score >= 5) return "bg-amber-500 shadow-amber-500/20";
    return "bg-red-500 shadow-red-500/20";
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      <hr className="border-slate-800/60 my-2" />
      
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          AI Interviewer Feedback
        </h3>
        <p className="text-xs text-slate-400">
          Instant assessment of your response
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center md:col-span-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Score</span>
          <div className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center ${getScoreColor(feedback.overall)}`}>
            <span className="text-3xl font-extrabold">{feedback.overall}</span>
            <span className="text-xs opacity-60">/ 10</span>
          </div>
        </div>

        {/* Breakdown Scores */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 md:col-span-2 justify-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metric Breakdown</span>
          
          {/* Clarity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Clarity & Communication</span>
              <span className="text-slate-200">{feedback.clarity}/10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${getProgressColor(feedback.clarity)}`}
                style={{ width: `${feedback.clarity * 10}%` }}
              />
            </div>
          </div>

          {/* Depth */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Technical Depth & Accuracy</span>
              <span className="text-slate-200">{feedback.depth}/10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${getProgressColor(feedback.depth)}`}
                style={{ width: `${feedback.depth * 10}%` }}
              />
            </div>
          </div>

          {/* Relevance */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Question Relevance</span>
              <span className="text-slate-200">{feedback.relevance}/10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${getProgressColor(feedback.relevance)}`}
                style={{ width: `${feedback.relevance * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strength, Improvement, Hint */}
      <div className="flex flex-col gap-4">
        {/* Strength */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border-l-4 border-emerald-500/50 text-slate-300 text-sm">
          <strong className="block text-emerald-400 font-semibold mb-0.5">Key Strength</strong>
          {feedback.strengths}
        </div>

        {/* Improvement */}
        <div className="p-4 rounded-xl bg-amber-500/5 border-l-4 border-amber-500/50 text-slate-300 text-sm">
          <strong className="block text-amber-400 font-semibold mb-0.5">Area for Improvement</strong>
          {feedback.improvements}
        </div>

        {/* Model Hint */}
        <div className="p-4 rounded-xl bg-sky-500/5 border-l-4 border-sky-500/50 text-slate-300 text-sm">
          <strong className="block text-sky-400 font-semibold mb-0.5">Ideal Answer Approach</strong>
          {feedback.model_answer_hint}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full mt-2 py-3.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/10 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
      >
        {isLastQuestion ? "Finish & View Summary" : "Next Question"}
      </button>
    </div>
  );
};
