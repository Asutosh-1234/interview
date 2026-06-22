"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface AnswerData {
  id: number;
  answer: string;
  questionIndex: number;
  feedback: {
    overall: number;
    clarity: number;
    depth: number;
    relevance: number;
    strengths: string;
    improvements: string;
    model_answer_hint: string;
  } | null;
  score: number | null;
  createdAt: string;
}

interface SetupData {
  id: number;
  jobTitle: string;
  companyName: string | null;
  questionsCount: number;
  techStack: string[];
  difficulty: string;
  yearsOfExperience: number;
  interviewType: string;
  questions: string[];
}

interface SummaryContainerProps {
  setup: SetupData;
  initialAnswers: AnswerData[];
}

export const SummaryContainer: React.FC<SummaryContainerProps> = ({ setup, initialAnswers }) => {
  const [answers, setAnswers] = useState<AnswerData[]>(initialAnswers);
  const [isPolling, setIsPolling] = useState(false);

  // Check if any answers are still pending review (excluding skipped)
  const hasPendingReviews = answers.some(
    (ans) => ans.answer !== "Skipped" && ans.answer.trim() !== "" && ans.feedback === null
  );

  useEffect(() => {
    if (!hasPendingReviews) return;

    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/setup/${setup.id}/answers`);
        if (res.ok) {
          const data = await res.json();
          const fetchedAnswers = data.answers || [];
          setAnswers(fetchedAnswers);

          // Check if any are still pending in the newly fetched data
          const stillPending = fetchedAnswers.some(
            (ans: AnswerData) => ans.answer !== "Skipped" && ans.answer.trim() !== "" && ans.feedback === null
          );
          if (!stillPending) {
            clearInterval(interval);
            setIsPolling(false);
          }
        }
      } catch (e) {
        console.error("Failed to poll answers update:", e);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [hasPendingReviews, setup.id]);

  // Compute Metrics
  let answeredCount = 0;
  let skippedCount = 0;
  let totalScoreSum = 0;
  let gradedCount = 0;

  const history = setup.questions.map((questionText, index) => {
    const ansRecord = answers.find((a) => a.questionIndex === index);

    let isAnswered = false;
    let isSkipped = true;
    let answerText = "Skipped";
    let score = 0;
    let feedback = null;
    let isPending = false;

    if (ansRecord) {
      answerText = ansRecord.answer;
      isSkipped = ansRecord.answer === "Skipped" || ansRecord.answer.trim() === "";
      isAnswered = !isSkipped;
      score = ansRecord.score || 0;
      feedback = ansRecord.feedback;
      isPending = isAnswered && !feedback;
    }

    if (isAnswered) {
      answeredCount++;
      if (feedback) {
        totalScoreSum += score;
        gradedCount++;
      }
    } else {
      skippedCount++;
    }

    return {
      index,
      questionText,
      answerText,
      isAnswered,
      isSkipped,
      isPending,
      score,
      feedback,
    };
  });

  // Calculate Average Score (only count graded questions)
  const averageScore = gradedCount > 0 ? parseFloat((totalScoreSum / gradedCount).toFixed(1)) : 0;

  // Determine Verdict Label
  let verdictLabel = "Needs Work";
  let verdictColor = "text-red-400 bg-red-500/10 border-red-500/30";

  if (gradedCount > 0) {
    if (averageScore >= 8) {
      verdictLabel = "Strong";
      verdictColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    } else if (averageScore >= 6) {
      verdictLabel = "Good";
      verdictColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
    } else if (averageScore >= 4) {
      verdictLabel = "Fair";
      verdictColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
    }
  } else if (isPolling) {
    verdictLabel = "Evaluating...";
    verdictColor = "text-slate-400 bg-slate-500/10 border-slate-500/30 animate-pulse";
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 z-10 my-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3 text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Interview Summary Report
          </h1>
          <p className="text-sm text-slate-400">
            {setup.jobTitle} simulator session metrics
          </p>
        </div>
        {isPolling && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-violet-400 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
            AI is analyzing responses...
          </div>
        )}
      </div>

      {/* Overview Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Average Score */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Average Score</span>
          <span className="text-3xl font-extrabold text-violet-400">
            {gradedCount > 0 ? averageScore : (isPolling ? "..." : "0")}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">out of 10</span>
        </div>

        {/* Verdict */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Verdict</span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${verdictColor}`}>
            {verdictLabel}
          </span>
        </div>

        {/* Answered */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Answered</span>
          <span className="text-3xl font-extrabold text-slate-100">{answeredCount}</span>
          <span className="text-[10px] text-slate-500 mt-0.5">questions</span>
        </div>

        {/* Skipped */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skipped</span>
          <span className="text-3xl font-extrabold text-slate-400">{skippedCount}</span>
          <span className="text-[10px] text-slate-500 mt-0.5">questions</span>
        </div>
      </div>

      {/* Question History Timeline */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-200 mb-1">Question & Answer History</h2>

        {history.map((item, idx) => (
          <details
            key={item.index}
            className="group bg-slate-900/20 border border-slate-850/80 rounded-xl overflow-hidden transition-all duration-200"
          >
            <summary className="flex justify-between items-center p-4 font-semibold text-slate-200 cursor-pointer hover:bg-slate-900/30 transition-all select-none list-none outline-hidden [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-bold">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-slate-300 group-open:text-violet-400 transition-colors line-clamp-1 max-w-[200px] sm:max-w-md">
                  {item.questionText}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {item.isSkipped ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-900/50 border border-slate-800 rounded-md">
                    Skipped
                  </span>
                ) : item.isPending ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/30 rounded-md animate-pulse">
                    Reviewing...
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                    item.score >= 8 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                    item.score >= 5 ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                    "text-red-400 bg-red-500/10 border-red-500/30"
                  }`}>
                    Score: {item.score}/10
                  </span>
                )}
                {/* Accordion Arrow Icon */}
                <svg
                  className="w-4 h-4 text-slate-500 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>

            <div className="p-4 border-t border-slate-850/80 bg-slate-950/20 text-slate-300 text-sm flex flex-col gap-4">
              {/* Full Question Text */}
              <div>
                <strong className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">Full Question</strong>
                <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                  {item.questionText}
                </p>
              </div>

              {/* Candidate Answer */}
              <div>
                <strong className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">Your Answer</strong>
                <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900 whitespace-pre-wrap">
                  {item.answerText}
                </p>
              </div>

              {/* Evaluation Feedback */}
              {item.isPending ? (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                  <span className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-2" />
                  <p className="text-xs text-slate-400">Interviewer feedback is generating. Please wait a moment...</p>
                </div>
              ) : item.feedback ? (
                <div className="flex flex-col gap-3 mt-1">
                  <strong className="block text-xs uppercase font-bold tracking-wider text-slate-500">Evaluation Details</strong>

                  {!item.isSkipped && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 flex justify-between text-xs items-center">
                        <span className="text-slate-400">Clarity</span>
                        <span className="font-semibold text-slate-200">{item.feedback.clarity}/10</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 flex justify-between text-xs items-center">
                        <span className="text-slate-400">Depth</span>
                        <span className="font-semibold text-slate-200">{item.feedback.depth}/10</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 flex justify-between text-xs items-center">
                        <span className="text-slate-400">Relevance</span>
                        <span className="font-semibold text-slate-200">{item.feedback.relevance}/10</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border-l-3 border-emerald-500/30 text-xs">
                      <span className="block text-emerald-400 font-bold mb-0.5">Strength</span>
                      {item.feedback.strengths}
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/5 border-l-3 border-amber-500/30 text-xs">
                      <span className="block text-amber-400 font-bold mb-0.5">Area for Improvement</span>
                      {item.feedback.improvements}
                    </div>

                    <div className="p-3 rounded-lg bg-sky-500/5 border-l-3 border-sky-500/30 text-xs">
                      <span className="block text-sky-400 font-bold mb-0.5">Ideal Answer Hint</span>
                      {item.feedback.model_answer_hint}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </div>

      {/* Restart Action */}
      <Link
        href="/setup"
        className="w-full mt-2 py-3.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/10 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-center"
      >
        Configure New Interview Session
      </Link>
    </div>
  );
};
