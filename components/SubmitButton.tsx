"use client";

import React from "react";
import { useFormStatus } from "react-dom";

export const SubmitButton: React.FC = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full md:col-span-2 mt-4 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold rounded-lg hover:shadow-[0px_0px_15px_rgba(255,255,255,0.2)] dark:hover:shadow-[0px_0px_15px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
    >
      {pending ? (
        <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
      ) : (
        "Start Interview Session"
      )}
    </button>
  );
};
