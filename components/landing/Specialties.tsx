"use client";

interface SpecialtiesProps {
  onAction: () => void;
}

export default function Specialties({ onAction }: SpecialtiesProps) {
  return (
    <section
      id="specialties"
      className="relative py-32 px-6 md:px-12 max-w-7xl mx-auto bg-black z-10"
    >
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-7xl font-bold text-white mb-4 tracking-tighter">
          Surgical Precision
        </h2>
        <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto opacity-75">
          Deep-domain specialization for the world's most demanding career tracks.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <div className="glass-card border-t border-white/30 p-8 rounded-xl group transition-all duration-400 hover:-translate-y-2 hover:border-white/40 hover:[box-shadow:0px_20px_40px_rgba(0,0,0,0.6),0px_0px_30px_rgba(255,255,255,0.1)]">
          <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <span className="material-symbols-outlined text-[28px]">code</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Software Engineering</h3>
          <p className="text-sm text-slate-400 mb-8 opacity-80 leading-relaxed">
            System design, algorithmic deep-dives, and collaborative whiteboarding sessions with
            AI architects.
          </p>
          <button
            onClick={onAction}
            className="inline-flex items-center gap-3 text-white text-xs font-semibold uppercase tracking-widest hover:gap-6 transition-all duration-300 cursor-pointer"
          >
            Access Track <span className="material-symbols-outlined text-[18px]">trending_flat</span>
          </button>
        </div>
        {/* Card 2 */}
        <div className="glass-card border-t border-white/30 p-8 rounded-xl group transition-all duration-400 hover:-translate-y-2 hover:border-white/40 hover:[box-shadow:0px_20px_40px_rgba(0,0,0,0.6),0px_0px_30px_rgba(255,255,255,0.1)]">
          <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <span className="material-symbols-outlined text-[28px]">psychology</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Product Leadership</h3>
          <p className="text-sm text-slate-400 mb-8 opacity-80 leading-relaxed">
            Case studies, product sense metrics, and stakeholder management simulations under
            extreme pressure.
          </p>
          <button
            onClick={onAction}
            className="inline-flex items-center gap-3 text-white text-xs font-semibold uppercase tracking-widest hover:gap-6 transition-all duration-300 cursor-pointer"
          >
            Access Track <span className="material-symbols-outlined text-[18px]">trending_flat</span>
          </button>
        </div>
        {/* Card 3 */}
        <div className="glass-card border-t border-white/30 p-8 rounded-xl group transition-all duration-400 hover:-translate-y-2 hover:border-white/40 hover:[box-shadow:0px_20px_40px_rgba(0,0,0,0.6),0px_0px_30px_rgba(255,255,255,0.1)]">
          <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <span className="material-symbols-outlined text-[28px]">payments</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Quantitative Finance</h3>
          <p className="text-sm text-slate-400 mb-8 opacity-80 leading-relaxed">
            Technical finance drills, M&A modeling Q&A, and high-stakes behavioral neural
            analysis.
          </p>
          <button
            onClick={onAction}
            className="inline-flex items-center gap-3 text-white text-xs font-semibold uppercase tracking-widest hover:gap-6 transition-all duration-300 cursor-pointer"
          >
            Access Track <span className="material-symbols-outlined text-[18px]">trending_flat</span>
          </button>
        </div>
      </div>
    </section>
  );
}
