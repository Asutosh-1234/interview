"use client";

import Image from "next/image";

export default function Analytics() {
  return (
    <section
      id="analytics"
      className="py-32 bg-black border-y border-white/10 relative overflow-hidden z-10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-8 order-2 lg:order-1">
          <div className="inline-block bg-white text-black px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Analytical Core
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
            Precision Feedback.
            <br />
            Zero Noise.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Lumina AI analyzes over 200 vocal and semantic markers to provide a breakdown of
            your confidence, technical accuracy, and narrative structure.
          </p>
          <ul className="space-y-4 pt-4">
            <li className="flex items-center gap-4 group cursor-default">
              <span className="material-symbols-outlined text-white">check_circle</span>
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Micro-expression & Tone Analysis
              </span>
            </li>
            <li className="flex items-center gap-4 group cursor-default">
              <span className="material-symbols-outlined text-white">check_circle</span>
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Semantic Depth & Technical Logic Scores
              </span>
            </li>
            <li className="flex items-center gap-4 group cursor-default">
              <span className="material-symbols-outlined text-white">check_circle</span>
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Real-time Biometric Stress Tracking
              </span>
            </li>
          </ul>
        </div>
        <div className="order-1 lg:order-2 relative group">
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" />
          <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative border border-white/20 transition-all duration-300 hover:scale-102 hover:filter hover:brightness-110 hover:[box-shadow:0_0_35px_rgba(255,255,255,0.2)]">
            <div className="w-full h-[500px] relative filter grayscale contrast-125">
              <Image
                src="/neural_accuracy.png"
                alt="Neural Accuracy Graph Illustration"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-xl p-6 border border-white/20 flex justify-between items-center rounded-xl">
              <div>
                <p className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                  Neural Accuracy
                </p>
                <p className="text-3xl md:text-4xl font-bold text-white">99.8%</p>
              </div>
              <div className="flex gap-1.5">
                <div className="h-12 w-2.5 bg-white rounded-full animate-pulse" />
                <div className="h-12 w-2.5 bg-white/60 rounded-full animate-pulse [animation-delay:200ms]" />
                <div className="h-12 w-2.5 bg-white/30 rounded-full animate-pulse [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
