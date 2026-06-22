"use client";

import Link from "next/link";

interface LandingNavbarProps {
  isAuthenticated: boolean;
  onAction: () => void;
}

export default function LandingNavbar({ isAuthenticated, onAction }: LandingNavbarProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-2xl border-b border-white/10 h-20">
      <div className="flex justify-between items-center px-6 md:px-12 max-w-7xl mx-auto h-full">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tighter text-white hover:opacity-90 select-none"
        >
          Lumina AI
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <button
            onClick={() => scrollToSection("specialties")}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-all duration-300 cursor-pointer"
          >
            Simulations
          </button>
          <button
            onClick={() => scrollToSection("analytics")}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-all duration-300 cursor-pointer"
          >
            Feedback
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-all duration-300 cursor-pointer"
          >
            Pricing
          </button>
          <button
            onClick={onAction}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-all duration-300 cursor-pointer"
          >
            Elite Access
          </button>
        </div>
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <button
              onClick={onAction}
              className="bg-white text-black px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 [box-shadow:0px_0px_30px_rgba(255,255,255,0.2)]"
            >
              Dashboard
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Login
              </Link>
              <button
                onClick={onAction}
                className="bg-white text-black px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 [box-shadow:0px_0px_30px_rgba(255,255,255,0.2)]"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
