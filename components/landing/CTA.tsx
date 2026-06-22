"use client";

interface CTAProps {
  onAction: () => void;
}

export default function CTA({ onAction }: CTAProps) {
  return (
    <section className="py-32 relative overflow-hidden bg-black border-t border-white/10 z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] opacity-20 pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-8xl font-bold text-white mb-8 tracking-tighter">
          Ready for the Future?
        </h2>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 opacity-80">
          Join 10,000+ elite professionals who have mastered their craft with Lumina AI.
        </p>
        <button
          onClick={onAction}
          className="bg-white text-black px-16 py-6 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95 [box-shadow:0px_0px_35px_rgba(255,255,255,0.3)] mt-8"
        >
          Start Free Trial Now
        </button>
      </div>
    </section>
  );
}
