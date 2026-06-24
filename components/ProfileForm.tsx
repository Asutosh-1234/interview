"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const ProfileForm: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "parsing" | "form">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setStep("parsing");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/resume-parser", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse resume");
      }

      // Pre-fill form fields from response
      const ext = data.extractedData || {};
      setName(ext.name || "");
      setPhone(ext.phone || "");
      setExperienceYears(ext.experienceYears || 0);
      setSkills(Array.isArray(ext.skills) ? ext.skills.join(", ") : "");
      setBio(ext.bio || "");
      setResumeUrl(data.resumeUrl || "");
      setResumeName(data.resumeName || file.name);
      setResumeText(ext.resumeText || "");

      setStep("form");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while parsing the resume. You can fill out details manually.");
      setStep("form"); // allow manual entry if parser fails
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          bio,
          skills: skillsArray,
          experienceYears: Number(experienceYears),
          resumeUrl,
          resumeName,
          resumeText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      // Redirect to next step: Setup Simulator
      router.push("/setup");
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 z-10 animate-slide-in">
      <div className="w-full glass-panel rounded-xl p-8 shadow-2xl flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 dark:border-slate-800/80 pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tighter text-slate-100">
              Complete Your Profile
            </h1>
            <p className="text-xs text-slate-400">
              Upload your resume to auto-fill, or enter your details manually.
            </p>
          </div>
          <Link
            href="/setup"
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-850 dark:border-slate-800 rounded-lg transition-all cursor-pointer select-none"
          >
            Skip for now &rarr;
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* STEP 1: Upload Resume Dropzone */}
        {step === "upload" && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-850 dark:border-slate-800/80 hover:border-slate-100 dark:hover:border-slate-600 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-300 group cursor-pointer text-center relative"
          >
            <input
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-850 dark:border-slate-800">
              <svg
                className="w-8 h-8 text-slate-400 group-hover:text-slate-200 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              Drag & drop your resume here
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs">
              Supports PDF, DOCX, or TXT formats. Max file size 5MB.
            </p>
            <span className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-slate-100 group-hover:bg-slate-200 rounded-lg transition-colors">
              Browse File
            </span>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-6 text-xs text-slate-500 hover:text-slate-350 underline transition-colors relative z-10 pointer-events-auto"
            >
              Fill details manually without resume
            </button>
          </div>
        )}

        {/* STEP 2: Gemini Parsing Loading Screen */}
        {step === "parsing" && (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-6">
            <div className="relative w-20 h-20">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 opacity-20 animate-ping" />
              {/* Inner spinning gradient */}
              <div className="absolute inset-0 rounded-full border-t-4 border-slate-100 animate-spin" />
              <div className="absolute inset-2 bg-slate-950 rounded-full flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-md font-bold text-slate-200">
                Gemini is parsing your resume
              </h3>
              <p className="text-xs text-slate-550 max-w-sm">
                Our AI model is extracting your skills, experience details, and info to auto-fill the profile form...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Profile Form Screen */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {resumeName && (
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📄</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-sm">
                      {resumeName}
                    </span>
                    <span className="text-[10px] text-green-400">
                      Successfully parsed by Gemini AI!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("upload");
                    setResumeName("");
                    setResumeUrl("");
                    setResumeText("");
                  }}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Change
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-650 transition-all duration-205 text-sm"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-650 transition-all duration-205 text-sm"
                />
              </div>

              {/* Experience Years */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  min={0}
                  max={50}
                  className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-650 transition-all duration-205 text-sm"
                />
              </div>

              {/* Skills */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Key Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                  className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-655 transition-all duration-205 text-sm"
                />
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Professional Bio / Summary
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Write a brief professional bio summarizing your experience and goals..."
                  className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-655 transition-all duration-205 text-sm resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-grow py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold rounded-lg hover:shadow-[0px_0px_15px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  "Save & Continue"
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-5 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 dark:border-slate-800 text-slate-300 font-semibold rounded-lg transition-colors text-sm"
              >
                Reset Resume
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
