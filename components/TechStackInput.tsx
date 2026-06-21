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
      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
        className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-violet-500 text-slate-100 placeholder-slate-600 transition-all duration-200"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 border border-violet-500/25 text-violet-300 text-xs font-medium rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(idx)}
                className="text-violet-400 hover:text-violet-200 font-bold focus:outline-none cursor-pointer"
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
