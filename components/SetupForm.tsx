import React from "react";
import Form from "next/form";
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

  return (
    <div className="w-full max-w-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl z-10 flex flex-col gap-6">
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

      <Form action={submitSetupAction} className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        {/* Tech Stack Tag Input */}
        <TechStackInput name="techStack" />

        {/* Slider for Question Count */}
        <QuestionsRangeInput name="questionsCount" defaultValue={5} />

        {/* Submit Button */}
        <SubmitButton />
      </Form>
    </div>
  );
};
