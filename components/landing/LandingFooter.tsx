"use client";

export default function LandingFooter() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-black w-full py-16 border-t border-white/10 z-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start px-6 md:px-12 max-w-7xl mx-auto gap-12">
        <div className="flex flex-col gap-4">
          <span className="text-3xl font-bold tracking-tighter text-white">Lumina AI</span>
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            Absolute Authority in Recruitment.
          </p>
          <p className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} Lumina Global. All rights reserved.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              System
            </span>
            <button
              onClick={() => scrollToSection("specialties")}
              className="text-left text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Simulations
            </button>
            <button
              onClick={() => scrollToSection("analytics")}
              className="text-left text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Methodology
            </button>
            <a
              className="text-xs text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              Security
            </a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Company
            </span>
            <a
              className="text-xs text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              Our Vision
            </a>
            <a
              className="text-xs text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              Careers
            </a>
            <a
              className="text-xs text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              Contact
            </a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Connect
            </span>
            <a
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              href="#"
            >
              <span className="material-symbols-outlined text-sm">public</span> Network
            </a>
            <a
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              href="#"
            >
              <span className="material-symbols-outlined text-sm">share</span> Intelligence
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
