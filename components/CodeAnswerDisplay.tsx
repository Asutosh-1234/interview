"use client";

import React from "react";

interface CodeAnswerDisplayProps {
  answerText: string;
}

export const CodeAnswerDisplay: React.FC<CodeAnswerDisplayProps> = ({ answerText }) => {
  let code = "";
  let explanation = "";
  let language = "javascript";

  try {
    const parsed = JSON.parse(answerText);
    code = parsed.code || "";
    explanation = parsed.explanation || "";
    language = parsed.language || "javascript";
  } catch (e) {
    // Fallback if parsing fails
    code = answerText;
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Code Block */}
      <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-[#1e1e1e] text-[#d4d4d4]">
        <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 border-b border-border">
          <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">
            Submitted Code
          </span>
          <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold text-gray-400 bg-black/40 rounded-md border border-border/80">
            {language}
          </span>
        </div>
        <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[300px] custom-scrollbar whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="flex flex-col gap-1">
          <strong className="block text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
            Written Explanation
          </strong>
          <p className="text-foreground leading-relaxed bg-card p-3.5 rounded-lg border border-border whitespace-pre-wrap text-sm">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};
