"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export const SetupForm: React.FC<SetupFormProps> = ({ error }) => {
  const router = useRouter();
  const [isGeneratingProfileSetup, setIsGeneratingProfileSetup] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(error || null);

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

  const handleProfileBasedSetup = async () => {
    setIsGeneratingProfileSetup(true);
    setSetupError(null);

    try {
      const response = await fetch("/api/setup/profile-based", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create setup from profile");
      }

      const setup = data;
      router.push(`/interview?currentSetupId=${setup.id}&questionsCount=${setup.questionsCount}&jobTitle=${encodeURIComponent(setup.jobTitle)}&companyName=${encodeURIComponent(setup.companyName || "")}&timerDuration=0`);
    } catch (err: any) {
      setSetupError(err.message || "Failed to create setup. Make sure you have uploaded a resume or completed your profile details.");
    } finally {
      setIsGeneratingProfileSetup(false);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 z-10 animate-slide-in">
      {/* Configuration Form Card */}
      <div className="w-full glass-panel rounded-xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 dark:border-slate-800/80 pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tighter text-slate-100">
              Configure Simulator
            </h1>
            <p className="text-xs text-slate-400">
              Set your interview preferences to generate customized AI questions
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-850 dark:border-slate-800 hover:border-slate-100 hover:bg-slate-900 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none"
          >
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            View Dashboard
          </Link>
        </div>

        {/* Quick Profile Setup Option */}
        <div className="p-5 rounded-xl border border-slate-850 dark:border-slate-800/80 bg-slate-950/45 dark:bg-black/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-slate-205">🚀 Quick Start with Resume / Profile</h3>
            <p className="text-[11px] text-slate-400">
              Let Gemini analyze your bio, skills, and resume text to generate a tailored interview instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={handleProfileBasedSetup}
            disabled={isGeneratingProfileSetup}
            className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-slate-105 hover:bg-slate-200 disabled:opacity-50 text-slate-950 rounded-lg active:scale-[0.98] transition-all duration-150 shrink-0 select-none cursor-pointer flex items-center gap-2"
          >
            {isGeneratingProfileSetup ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              "Tailor Interview"
            )}
          </button>
        </div>

        {setupError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
            {setupError}
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
    </div>
  );
};
