import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 border-t border-slate-850/80 dark:border-slate-800/80 bg-slate-950/60 dark:bg-black/95 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 gap-4 max-w-7xl mx-auto text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <span className="font-sans text-lg font-bold tracking-tighter text-slate-100">
            AI Interview Bot
          </span>
          <span className="font-sans text-xs text-slate-500">
            © {new Date().getFullYear()} AI Interview Bot. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="#" className="font-sans text-xs text-slate-500 hover:text-slate-200 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="font-sans text-xs text-slate-500 hover:text-slate-200 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="font-sans text-xs text-slate-500 hover:text-slate-200 transition-colors">
            Help Center
          </a>
          <a href="#" className="font-sans text-xs text-slate-500 hover:text-slate-200 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
};
