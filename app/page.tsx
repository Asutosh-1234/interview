"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);

  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const neuralCoreRef = useRef<HTMLDivElement>(null);

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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Liquid Shader implementation
  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;

    const syncSize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    window.addEventListener("resize", syncSize);
    syncSize();

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;
      void main() {
        vec2 uv = v_texCoord;
        vec2 mouse = u_mouse / u_resolution;
        float wave1 = sin(uv.x * 2.5 + u_time * 0.3 + uv.y * 1.5);
        float wave2 = sin(uv.y * 2.0 - u_time * 0.2 + uv.x * 1.2);
        float combinedWaves = wave1 * 0.5 + wave2 * 0.5;
        vec3 color1 = vec3(0.0, 0.0, 0.0);
        vec3 color2 = vec3(0.12, 0.12, 0.12);
        float mouseDist = length(uv - mouse);
        float interaction = smoothstep(0.6, 0.0, mouseDist) * 0.1;
        vec3 finalColor = mix(color1, color2, combinedWaves * 0.1 + interaction);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Shader link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      mouse.x = e.clientX;
      mouse.y = canvas.height - e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = (t: number) => {
      if (!canvas || !gl) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", syncSize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (gl) {
        gl.deleteProgram(prog);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(buf);
      }
    };
  }, []);

  // Three.js Neural Core implementation
  useEffect(() => {
    if (!threeLoaded) return;
    const container = neuralCoreRef.current;
    if (!container) return;

    const THREE = (window as any).THREE;
    if (!THREE) return;

    let animationFrameId: number;

    const scene = new THREE.Scene();
    let width = container.clientWidth;
    let height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeometry = new THREE.IcosahedronGeometry(1.8, 4);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      emissive: 0x444444,
      emissiveIntensity: 0.2,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    coreGroup.add(coreMesh);

    const dotsGeometry = new THREE.IcosahedronGeometry(2.6, 3);
    const dotsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
    });
    const dotsMesh = new THREE.Points(dotsGeometry, dotsMaterial);
    coreGroup.add(dotsMesh);

    const innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 })
    );
    coreGroup.add(innerCore);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pl1 = new THREE.PointLight(0xffffff, 1.5, 100);
    pl1.position.set(10, 10, 10);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pl2.position.set(-10, -10, 10);
    scene.add(pl2);

    camera.position.z = 6;

    let mouseX = 0,
      mouseY = 0,
      targetX = 0,
      targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.0004;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.0004;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    const animate = (time: number) => {
      coreGroup.rotation.y += 0.0015;
      coreGroup.rotation.z += 0.0005;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      coreGroup.rotation.x += targetY;
      coreGroup.rotation.y += targetX;

      const s = 1 + Math.sin(time * 0.001) * 0.03;
      coreMesh.scale.set(s, s, s);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer) {
        renderer.dispose();
      }
      coreGeometry.dispose();
      coreMaterial.dispose();
      dotsGeometry.dispose();
      dotsMaterial.dispose();
      innerCore.geometry.dispose();
      (innerCore.material as any).dispose();
      if (container && renderer.domElement) {
        try {
          container.removeChild(renderer.domElement);
        } catch (_) {}
      }
    };
  }, [threeLoaded]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        strategy="beforeInteractive"
        onLoad={() => setThreeLoaded(true)}
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="relative min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-white selection:text-black">
        {/* Multi-layered Background Shell */}
        <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          {/* Liquid Shader Base (Monochrome) */}
          <canvas ref={shaderCanvasRef} className="w-full h-full opacity-35" />
          {/* Accent Blurs */}
          <div className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] opacity-25 pointer-events-none" />
          <div className="absolute bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] opacity-15 pointer-events-none" />
        </div>

        {/* TopNavBar Shell */}
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
                onClick={handleAction}
                className="text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-all duration-300 cursor-pointer"
              >
                Elite Access
              </button>
            </div>
            <div className="flex items-center gap-6">
              {isAuthenticated ? (
                <button
                  onClick={handleAction}
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
                    onClick={handleAction}
                    className="bg-white text-black px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 [box-shadow:0px_0px_30px_rgba(255,255,255,0.2)]"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden bg-black z-10">
          {/* Interactive Neural Core */}
          <div
            ref={neuralCoreRef}
            className="absolute inset-0 z-0 pointer-events-auto mask-[radial-gradient(circle_at_center,black_50%,transparent_90%)]"
            id="neural-core-container"
          />

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
            <p className="text-lg md:text-xl text-slate-450 max-w-2xl mx-auto leading-relaxed opacity-85">
              Eliminate the anxiety of the unknown. Practice with high-fidelity AI simulations that
              adapt to your performance in real-time.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleAction}
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

        {/* Realistic Simulations Section */}
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
                onClick={handleAction}
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
                onClick={handleAction}
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
                onClick={handleAction}
                className="inline-flex items-center gap-3 text-white text-xs font-semibold uppercase tracking-widest hover:gap-6 transition-all duration-300 cursor-pointer"
              >
                Access Track <span className="material-symbols-outlined text-[18px]">trending_flat</span>
              </button>
            </div>
          </div>
        </section>

        {/* Precision Analytics Section */}
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

        {/* Elite Access (Pricing) Section */}
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
                onClick={handleAction}
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
                onClick={handleAction}
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
                onClick={handleAction}
                className="w-full py-4 border border-white/20 hover:bg-white hover:text-black transition-all duration-300 rounded-xl text-xs font-bold uppercase tracking-widest"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
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
              onClick={handleAction}
              className="bg-white text-black px-16 py-6 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95 [box-shadow:0px_0px_35px_rgba(255,255,255,0.3)] mt-8"
            >
              Start Free Trial Now
            </button>
          </div>
        </section>

        {/* Footer Shell */}
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
                  className="text-left text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Simulations
                </button>
                <button
                  onClick={() => scrollToSection("analytics")}
                  className="text-left text-xs text-slate-400 hover:text-white transition-colors"
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
      </div>
    </>
  );
}
