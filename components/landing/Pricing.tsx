"use client";

interface PricingProps {
  onAction: () => void;
}

export default function Pricing({ onAction }: PricingProps) {
  return (
    <section
      id="pricing"
      className="py-32 px-6 md:px-12 max-w-7xl mx-auto bg-black z-10 relative"
    >
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-7xl font-bold text-white mb-4 tracking-tighter">
          Elite Access
        </h2>
        <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto opacity-75">
          Invest in your career with surgical precision.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
        {/* Starter Plan */}
        <div className="glass-card p-10 rounded-2xl flex flex-col h-fit">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Initiate
          </p>
          <div className="text-white mb-8">
            <span className="text-4xl md:text-5xl font-bold">$0</span>
            <span className="text-sm text-slate-400 opacity-60">/session</span>
          </div>
          <ul className="space-y-5 mb-10 grow">
            <li className="text-sm text-slate-300 flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">check</span> 2
              Basic Simulations
            </li>
            <li className="text-sm text-slate-300 flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">check</span>{" "}
              Automated Feedback
            </li>
          </ul>
          <button
            onClick={onAction}
            className="w-full py-4 border border-white/20 hover:bg-white hover:text-black transition-all duration-300 rounded-xl text-xs font-bold uppercase tracking-widest"
          >
            Start Free
          </button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card p-12 rounded-2xl flex flex-col border-white/50 bg-black relative z-25 md:scale-110 border-t [box-shadow:0px_0px_30px_rgba(255,255,255,0.1)]">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-black">
            Recommended
          </div>
          <p className="text-xs font-semibold text-white uppercase tracking-[0.2em] mb-4 mt-2">
            Professional
          </p>
          <div className="text-white mb-8">
            <span className="text-4xl md:text-5xl font-bold">$49</span>
            <span className="text-sm text-slate-300 opacity-60">/month</span>
          </div>
          <ul className="space-y-5 mb-12 grow">
            <li className="text-sm text-white flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">verified</span>{" "}
              Unlimited Simulations
            </li>
            <li className="text-sm text-white flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">verified</span>{" "}
              Neural Benchmarking
            </li>
            <li className="text-sm text-white flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">verified</span>{" "}
              Predictive Outcome Analysis
            </li>
            <li className="text-sm text-white flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">verified</span>{" "}
              24/7 Priority Support
            </li>
          </ul>
          <button
            onClick={onAction}
            className="w-full py-5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all duration-300 [box-shadow:0px_0px_30px_rgba(255,255,255,0.2)]"
          >
            Elevate My Career
          </button>
        </div>

        {/* Team Plan */}
        <div className="glass-card p-10 rounded-2xl flex flex-col h-fit">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Enterprise
          </p>
          <div className="text-white mb-8">
            <span className="text-4xl md:text-5xl font-bold">Custom</span>
          </div>
          <ul className="space-y-5 mb-10 grow">
            <li className="text-sm text-slate-300 flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">check</span> Team-wide
              Analytics
            </li>
            <li className="text-sm text-slate-300 flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">check</span> Custom
              Role Training
            </li>
            <li className="text-sm text-slate-300 flex gap-3">
              <span className="material-symbols-outlined text-white text-lg">check</span> Full API
              Integration
            </li>
          </ul>
          <button
            onClick={onAction}
            className="w-full py-4 border border-white/20 hover:bg-white hover:text-black transition-all duration-300 rounded-xl text-xs font-bold uppercase tracking-widest"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}
