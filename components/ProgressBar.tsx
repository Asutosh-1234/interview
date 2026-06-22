import React from "react";

interface ProgressBarProps {
  current: number; // 1-based index of the current question
  total: number;   // total number of questions
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Question {current} of {total}</span>
        <span>{percentage}% Complete</span>
      </div>
      <div className="h-1.5 w-full bg-slate-900 border border-slate-850 dark:border-slate-800/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-slate-100 rounded-full shadow-[0px_0px_10px_rgba(255,255,255,0.35)] transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
