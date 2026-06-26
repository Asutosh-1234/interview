"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorContainerProps {
  onChange: (payload: { code: string; explanation: string; language: string }) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onEndInterview: () => void;
  isSubmitting: boolean;
  questionText: string;
  initialLanguage?: string;
}

const STARTER_CODES: Record<string, string> = {
  javascript: `// Write your JavaScript solution here\n\nfunction solution() {\n  \n}`,
  python: `# Write your Python solution here\n\ndef solution():\n    pass`,
  typescript: `// Write your TypeScript solution here\n\nfunction solution(): void {\n  \n}`,
  java: `// Write your Java solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}`,
  cpp: `// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`,
};

export const CodeEditorContainer: React.FC<CodeEditorContainerProps> = ({
  onChange,
  onSubmit,
  onSkip,
  onEndInterview,
  isSubmitting,
  questionText,
  initialLanguage = "javascript",
}) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(STARTER_CODES[initialLanguage] || STARTER_CODES.javascript);
  const [explanation, setExplanation] = useState("");
  const [editorTheme, setEditorTheme] = useState("vs-dark");

  // Sync state if initialLanguage changes
  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
      setCode(STARTER_CODES[initialLanguage] || STARTER_CODES.javascript);
    }
  }, [initialLanguage]);

  // Sync editor theme with document.documentElement.classList
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setEditorTheme(isDark ? "vs-dark" : "light");

    // Optional observer to watch theme changes
    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains("dark");
      setEditorTheme(isDarkNow ? "vs-dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Update parent whenever code, explanation, or language changes
  useEffect(() => {
    onChange({ code, explanation, language });
  }, [code, explanation, language, onChange]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLang = e.target.value;
    setLanguage(nextLang);
    setCode(STARTER_CODES[nextLang] || "");
  };

  return (
    <div className="flex flex-col gap-6 w-full mt-2 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor Area (3/5 width on desktop) */}
        <div className="lg:col-span-3 flex flex-col gap-2 h-[450px] min-h-[350px]">
          <div className="flex justify-between items-center bg-card px-4 py-2 border border-border rounded-t-lg">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Interactive IDE
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="lang-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Language:
              </label>
              <select
                id="lang-select"
                value={language}
                onChange={handleLanguageChange}
                className="bg-background text-foreground border border-border rounded-md px-2.5 py-1 text-xs outline-none cursor-pointer hover:border-primary transition-colors font-medium"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>
          <div className="grow border-x border-b border-border rounded-b-lg overflow-hidden shadow-inner bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={language}
              theme={editorTheme}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                lineHeight: 20,
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                },
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Code Explanation & Submission Area (2/5 width on desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-col gap-2 h-full justify-between">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Approach & Explanation
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain your code logic, time/space complexity, and why you chose this design..."
                className="w-full h-[220px] px-4 py-3 bg-card border border-border rounded-lg focus:outline-none text-foreground placeholder-muted-foreground transition-all duration-200 resize-none text-sm custom-scrollbar"
              />
              <span className="text-[10px] text-muted-foreground text-right mt-0.5">
                Explain Big-O complexity for extra points
              </span>
            </div>

            {/* Submission actions */}
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={onSubmit}
                disabled={isSubmitting || !code.trim() || !explanation.trim()}
                className="w-full h-12 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-bold rounded-lg active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none uppercase tracking-widest text-xs shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Submitting Code...
                  </>
                ) : (
                  "Submit Code Solution"
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onSkip}
                  disabled={isSubmitting}
                  className="h-12 border border-border text-foreground hover:bg-muted font-semibold rounded-lg text-xs uppercase tracking-widest active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
                >
                  Skip Question
                </button>
                <button
                  onClick={onEndInterview}
                  disabled={isSubmitting}
                  className="h-12 border border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/60 rounded-lg font-semibold text-xs uppercase tracking-widest active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
                >
                  End Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
