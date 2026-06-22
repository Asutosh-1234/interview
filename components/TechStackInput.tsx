"use client";

import React, { useState } from "react";

interface TechStackInputProps {
  tags?: string[];
  onChange?: (tags: string[]) => void;
  name?: string;
  defaultValue?: string[];
}

export const TechStackInput: React.FC<TechStackInputProps> = ({
  tags: controlledTags,
  onChange,
  name = "techStack",
  defaultValue = [],
}) => {
  const [input, setInput] = useState("");
  const [localTags, setLocalTags] = useState<string[]>(defaultValue);

  const isControlled = controlledTags !== undefined && onChange !== undefined;
  const tags = isControlled ? controlledTags : localTags;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const newTag = input.trim();
      if (!tags.includes(newTag)) {
        const nextTags = [...tags, newTag];
        if (isControlled && onChange) {
          onChange(nextTags);
        } else {
          setLocalTags(nextTags);
        }
      }
      setInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const nextTags = tags.filter((_, i) => i !== indexToRemove);
    if (isControlled && onChange) {
      onChange(nextTags);
    } else {
      setLocalTags(nextTags);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 md:col-span-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
        Tech Stack Topics (Optional)
      </label>
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(tags)}
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a topic (e.g. React, Python) and press Enter"
        className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-600 transition-all duration-200 text-sm"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-850 dark:border-slate-800/80 text-slate-350 dark:text-slate-300 text-xs font-semibold rounded-lg select-none"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(idx)}
                className="text-slate-400 hover:text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
