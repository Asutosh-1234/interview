"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Level, InterviewType } from "@/generated/prisma/enums";
import { FormInput } from "./ui/FormInput";
import { FormSelect } from "./ui/FormSelect";
import { TechStackInput } from "./TechStackInput";
import { QuestionsRangeInput } from "./QuestionsRangeInput";
import { SubmitButton } from "./SubmitButton";
import { submitSetupAction } from "@/app/(screens)/setup/actions";

interface SetupFormProps {
  error?: string;
}

interface PastSession {
  id: number;
  jobTitle: string;
  interviewType: string;
  averageScore: number;
  verdict: string;
  totalQuestions: number;
  answeredCount: number;
  skippedCount: number;
  date: string;
}

export const SetupForm: React.FC<SetupFormProps> = ({ error }) => {
  const [sessions, setSessions] = useState<PastSession[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_interview_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Sort by date descending (most recent first)
          parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setSessions(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load session history from localStorage", e);
    }
  }, []);

  const difficultyOptions = [
    { value: Level.Fresher, label: "Fresher" },
    { value: Level.Junior, label: "Junior" },
    { value: Level.Mid, label: "Mid-Level" },
    { value: Level.Senior, label: "Senior" },
  ];

  const interviewTypeOptions = [
    { value: InterviewType.Technical, label: "Technical" },
    { value: InterviewType.Behavioral, label: "Behavioral" },
    { value: InterviewType.System, label: "System Design" },
    { value: InterviewType.Design, label: "UI/UX Design" },
    { value: InterviewType.Mixed, label: "Mixed" },
  ];

  const getVerdictBadgeClass = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case "strong":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "good":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      case "fair":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-red-400 bg-red-500/10 border-red-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 z-10">
      {/* Configuration Form Card */}
      <div className="w-full bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Configure Simulator
          </h1>
          <p className="text-sm text-slate-400">
            Set your interview preferences to generate customized AI questions
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form action={submitSetupAction} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Job Role */}
          <FormInput
            label="Job Role / Title"
            name="jobTitle"
            placeholder="e.g. Frontend Engineer, Fullstack Developer"
            required
            className="md:col-span-2"
          />

          {/* Company Name */}
          <FormInput
            label="Company Name (Optional)"
            name="companyName"
            placeholder="e.g. Google, Stripe"
          />

          {/* Years of Experience */}
          <FormInput
            label="Years of Experience"
            type="number"
            name="yearsOfExperience"
            defaultValue={0}
            min={0}
            max={50}
          />

          {/* Interview Type */}
          <FormSelect
            label="Interview Type"
            name="interviewType"
            defaultValue={InterviewType.Technical}
            options={interviewTypeOptions}
          />

          {/* Experience Level */}
          <FormSelect
            label="Experience Level"
            name="difficulty"
            defaultValue={Level.Junior}
            options={difficultyOptions}
          />

          {/* Question Timer Option */}
          <FormSelect
            label="Question Timer"
            name="timerDuration"
            defaultValue="0"
            options={[
              { value: "0", label: "No Timer (Unlimited)" },
              { value: "60", label: "1 Minute" },
              { value: "120", label: "2 Minutes" },
              { value: "180", label: "3 Minutes" },
              { value: "300", label: "5 Minutes" },
            ]}
          />

          {/* Dummy element for grid balancing */}
          <div className="hidden md:block" />

          {/* Tech Stack Tag Input */}
          <TechStackInput name="techStack" />

          {/* Slider for Question Count */}
          <QuestionsRangeInput name="questionsCount" defaultValue={5} />

          {/* Submit Button */}
          <SubmitButton />
        </form>
      </div>

      {/* Session History Card (Only shown if history exists) */}
      {sessions.length > 0 && (
        <div className="w-full bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            📊 Past Session History
          </h2>
          <hr className="border-slate-800/60" />
          
          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-all gap-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-slate-200 text-sm">
                    {session.jobTitle} ({session.interviewType})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatDate(session.date)}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getVerdictBadgeClass(session.verdict)}`}>
                      {session.verdict}
                    </span>
                    <span className="text-slate-300 font-medium">
                      Avg: {session.averageScore}/10
                    </span>
                  </div>

                  <Link
                    href={`/summery?currentSetupId=${session.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-violet-400 hover:text-white border border-violet-500/20 hover:border-violet-500 bg-violet-500/5 hover:bg-violet-600 rounded-lg transition-all"
                  >
                    View Report
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
