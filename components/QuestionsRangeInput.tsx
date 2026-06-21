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
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Number of Questions
        </label>
        <span className="text-sm font-bold text-violet-400 bg-violet-600/10 border border-violet-500/25 px-2.5 py-0.5 rounded-full">
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
        className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
      />
      <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1">
        <span>3 Min</span>
        <span>5 Standard</span>
        <span>10 Max</span>
      </div>
    </div>
  );
};
