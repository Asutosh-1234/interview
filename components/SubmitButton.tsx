"use client";

import React from "react";
import { useFormStatus } from "react-dom";

export const SubmitButton: React.FC = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full md:col-span-2 mt-4 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg shadow-violet-600/10 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
    >
      {pending ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        "Start Interview Session"
      )}
    </button>
  );
};
