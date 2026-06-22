"use client";

import React, { useState } from "react";

interface QuestionsRangeInputProps {
  defaultValue?: number;
  name?: string;
}

export const QuestionsRangeInput: React.FC<QuestionsRangeInputProps> = ({
  defaultValue = 5,
  name = "questionsCount",
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-3 md:col-span-2 mt-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Number of Questions
        </label>
        <span className="text-xs font-bold text-slate-950 bg-slate-100 px-3 py-1 rounded-full shadow-[0px_0px_10px_rgba(255,255,255,0.15)] dark:shadow-[0px_0px_10px_rgba(255,255,255,0.08)] select-none">
          {value} Questions
        </span>
      </div>
      <input
        type="range"
        name={name}
        min={3}
        max={10}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value))}
        className="w-full h-[2px] bg-slate-850 dark:bg-slate-800 accent-slate-100 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-0.5">
        <span>3 Min</span>
        <span>5 Standard</span>
        <span>10 Max</span>
      </div>
    </div>
  );
};
