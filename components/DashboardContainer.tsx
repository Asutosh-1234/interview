"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Session {
  id: number;
  jobTitle: string;
  companyName: string | null;
  interviewType: string;
  difficulty: string;
  questionsCount: number;
  answeredCount: number;
  skippedCount: number;
  averageScore: number;
  verdict: string;
  date: string;
}

interface DashboardContainerProps {
  sessions: Session[];
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({ sessions }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isStartingProfile, setIsStartingProfile] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickProfileStart = async () => {
    setIsStartingProfile(true);
    setDashError(null);

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
      const errorMsg = err.message || "Failed to create setup. Redirecting to Profile Setup page...";
      setDashError(errorMsg);
      if (errorMsg.toLowerCase().includes("profile") || errorMsg.toLowerCase().includes("resume")) {
        setTimeout(() => {
          router.push("/profile-setup");
        }, 2500);
      }
    } finally {
      setIsStartingProfile(false);
    }
  };

  // 1. Calculate Account-Wide Stats
  const totalSessions = sessions.length;

  const gradedSessions = sessions.filter((s) => s.averageScore > 0);
  const overallAvgScore =
    gradedSessions.length > 0
      ? parseFloat((gradedSessions.reduce((sum, s) => sum + s.averageScore, 0) / gradedSessions.length).toFixed(1))
      : 0;

  const totalQs = sessions.reduce((sum, s) => sum + s.questionsCount, 0);
  const totalAnswered = sessions.reduce((sum, s) => sum + s.answeredCount, 0);
  const completionRate = totalQs > 0 ? Math.round((totalAnswered / totalQs) * 100) : 0;

  const jobCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    jobCounts[s.jobTitle] = (jobCounts[s.jobTitle] || 0) + 1;
  });
  let mostPracticedRole = "N/A";
  let maxCount = 0;
  for (const [job, count] of Object.entries(jobCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostPracticedRole = job;
    }
  }

  // Helper formats
  const formatDate = (dateString: string) => {
    if (!mounted) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getVerdictBadgeClass = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case "strong":
        return "text-emerald-400 bg-emerald-500/5 border-emerald-500/25";
      case "good":
        return "text-indigo-400 bg-indigo-500/5 border-indigo-500/25";
      case "fair":
        return "text-amber-450 bg-amber-500/5 border-amber-500/25";
      case "in progress":
        return "text-slate-300 bg-slate-900/50 border-slate-800/80 animate-pulse";
      case "not started":
        return "text-slate-400 bg-slate-900/20 border-slate-850 dark:border-slate-800";
      default:
        return "text-red-400 bg-red-500/5 border-red-500/25";
    }
  };

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-6 z-10 my-8 animate-slide-in">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 text-center sm:text-left border-b border-slate-850 dark:border-slate-800/80 pb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Interview Dashboard
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-100 uppercase">
            Account Simulator Stats
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Monitor your progress, review past simulations, and track score improvements
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleQuickProfileStart}
            disabled={isStartingProfile}
            className="px-5 py-3 text-xs font-bold uppercase tracking-widest border border-slate-850 dark:border-slate-800 hover:border-slate-100 hover:bg-slate-900 text-slate-200 rounded-lg active:scale-[0.98] transition-all duration-150 select-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            {isStartingProfile ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                Analyzing Profile...
              </>
            ) : (
              "Tailored Profile Interview"
            )}
          </button>
          <Link
            href="/setup"
            className="px-5 py-3 text-xs font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-lg hover:shadow-[0px_0px_15px_rgba(255,255,255,0.2)] dark:hover:shadow-[0px_0px_15px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-150 select-none cursor-pointer text-center whitespace-nowrap"
          >
            Start New Session
          </Link>
        </div>
      </div>

      {dashError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{dashError}</span>
          <button onClick={() => setDashError(null)} className="text-slate-450 hover:text-slate-200 text-xs ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <div className="border border-slate-850 dark:border-slate-800/80 p-5 rounded-lg bg-slate-950/60 dark:bg-black/30 white-shadow flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-slate-100 group">
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Total Sessions</span>
          <span className="text-3xl font-extrabold text-slate-100 transition-transform group-hover:scale-105 duration-300">{totalSessions}</span>
          <span className="text-[10px] text-slate-500 mt-1">interviews generated</span>
        </div>

        {/* Overall Average */}
        <div className="border border-slate-850 dark:border-slate-800/80 p-5 rounded-lg bg-slate-950/60 dark:bg-black/30 white-shadow flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-slate-100 group">
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Average Score</span>
          <span className="text-3xl font-extrabold text-slate-100 transition-transform group-hover:scale-105 duration-300">
            {overallAvgScore > 0 ? `${overallAvgScore}/10` : "N/A"}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">across graded reviews</span>
        </div>

        {/* Completion Rate */}
        <div className="border border-slate-850 dark:border-slate-800/80 p-5 rounded-lg bg-slate-950/60 dark:bg-black/30 white-shadow flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-slate-100 group">
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Completion Rate</span>
          <span className="text-3xl font-extrabold text-slate-100 transition-transform group-hover:scale-105 duration-300">{completionRate}%</span>
          <span className="text-[10px] text-slate-500 mt-1">questions answered</span>
        </div>

        {/* Primary Focus */}
        <div className="border border-slate-850 dark:border-slate-800/80 p-5 rounded-lg bg-slate-950/60 dark:bg-black/30 white-shadow flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-slate-100 group">
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2.5">Primary Focus</span>
          <span className="text-xs font-bold text-slate-200 truncate w-full px-1 uppercase tracking-wider block transition-all group-hover:scale-[1.02]" title={mostPracticedRole}>
            {mostPracticedRole}
          </span>
          <span className="text-[10px] text-slate-500 mt-2">most practiced role</span>
        </div>
      </div>

      {/* Detailed Session History Section */}
      <div className="w-full glass-panel rounded-xl p-8 shadow-2xl flex flex-col gap-6">
        <h2 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Account Interview History
        </h2>
        <hr className="border-slate-850 dark:border-slate-800/80" />

        {sessions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-lg bg-slate-950/40 dark:bg-black/25 border border-slate-850 dark:border-slate-800/80 royal-glow-hover transition-all gap-4"
              >
                {/* Session Details */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 text-sm md:text-base uppercase tracking-tight truncate">
                      {session.jobTitle}
                    </span>
                    {session.companyName && (
                      <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-950 dark:bg-slate-900 border border-slate-850 dark:border-slate-800 rounded-md">
                        {session.companyName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                    <span className="uppercase font-medium tracking-wide">{session.interviewType}</span>
                    <span>•</span>
                    <span className="uppercase font-medium tracking-wide">{session.difficulty} level</span>
                    <span>•</span>
                    <span>{session.questionsCount} Questions</span>
                    <span>•</span>
                    <span className="text-slate-500">{formatDate(session.date)}</span>
                  </div>
                </div>

                {/* Score & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-850 dark:border-slate-800/60 pt-3 md:pt-0 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-md border ${getVerdictBadgeClass(session.verdict)}`}>
                      {session.verdict}
                    </span>
                    {session.averageScore > 0 ? (
                      <span className="text-slate-200 font-bold text-xs md:text-sm">
                        Avg: {session.averageScore}/10
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold text-xs">
                        No Grade
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {session.verdict === "In Progress" ? (
                      <Link
                        href={`/interview?currentSetupId=${session.id}`}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-sm transition-all select-none"
                      >
                        Resume
                      </Link>
                    ) : (
                      <Link
                        href={`/summery?currentSetupId=${session.id}`}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-200 border border-slate-850 dark:border-slate-800 hover:border-slate-100 hover:bg-slate-900 rounded-lg transition-all select-none"
                      >
                        View Report
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-4 bg-slate-950/20 border border-dashed border-slate-850 dark:border-slate-800 rounded-xl">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-3.5 3.5a2 2 0 01-2.828 0L4 13" />
            </svg>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wide">No sessions found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                You haven&apos;t practice any AI interview sessions yet. Complete your first practice simulation to view metrics!
              </p>
            </div>
            <Link
              href="/setup"
              className="mt-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all select-none"
            >
              Start Your First Interview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
