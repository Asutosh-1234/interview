"use client";

import NeuralCore from "./NeuralCore";

interface HeroProps {
  threeLoaded: boolean;
  onAction: () => void;
}

export default function Hero({ threeLoaded, onAction }: HeroProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden bg-black z-10">
      {/* Interactive Neural Core */}
      <NeuralCore threeLoaded={threeLoaded} />

      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8 mt-12 md:mt-0">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/20 px-6 py-1.5 rounded-full text-white text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          V2.0 Core Active
        </div>
        <h1 className="text-4xl md:text-8xl text-white font-bold leading-[1.1] tracking-tighter [text-shadow:0_0_50px_rgba(255,255,255,0.2)]">
          Master Your Interview. <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-white to-gray-500 opacity-90">
            Absolute Intelligence.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed opacity-85">
          Eliminate the anxiety of the unknown. Practice with high-fidelity AI simulations that
          adapt to your performance in real-time.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onAction}
            className="w-full sm:w-auto bg-white text-black px-12 py-5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:scale-102 hover:brightness-110 active:scale-95 [box-shadow:0px_0px_35px_rgba(255,255,255,0.2)]"
          >
            Begin Simulation
          </button>
          <button
            onClick={() => scrollToSection("specialties")}
            className="w-full sm:w-auto bg-transparent border border-white/30 text-white px-12 py-5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:scale-102 hover:bg-white/5 active:scale-95 backdrop-blur-sm"
          >
            Explore Tech
          </button>
        </div>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
          System Overview
        </span>
        <span className="material-symbols-outlined text-[20px]">
          keyboard_double_arrow_down
        </span>
      </div>
    </section>
  );
}
