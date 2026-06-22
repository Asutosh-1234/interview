"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// Import modular landing page components
import LiquidShader from "@/components/landing/LiquidShader";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import Specialties from "@/components/landing/Specialties";
import Analytics from "@/components/landing/Analytics";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      router.push("/setup");
    } else {
      router.push("/login");
    }
  };

  return (
    <>
      {/* Three.js script loaded before page elements are interactive */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        strategy="beforeInteractive"
        onLoad={() => setThreeLoaded(true)}
      />
      {/* Google Material Icons font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="relative min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-white selection:text-black">
        {/* Multi-layered Background Shell */}
        <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          {/* WebGL liquid shader */}
          <LiquidShader />
          {/* Decorative ambient blurs */}
          <div className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] opacity-25 pointer-events-none" />
          <div className="absolute bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] opacity-15 pointer-events-none" />
        </div>

        {/* Header/Navbar */}
        <LandingNavbar isAuthenticated={isAuthenticated} onAction={handleAction} />

        {/* Hero Section (Contains interactive Three.js 3D Neural Core) */}
        <Hero threeLoaded={threeLoaded} onAction={handleAction} />

        {/* Specialties Tracks Section */}
        <Specialties onAction={handleAction} />

        {/* Analytical Feedback Core Section */}
        <Analytics />

        {/* Pricing/Access Plan Grid */}
        <Pricing onAction={handleAction} />

        {/* Bottom CTA Block */}
        <CTA onAction={handleAction} />

        {/* Footer */}
        <LandingFooter />
      </div>
    </>
  );
}
