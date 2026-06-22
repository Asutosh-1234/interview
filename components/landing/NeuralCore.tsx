"use client";

import { useEffect, useRef } from "react";

interface NeuralCoreProps {
  threeLoaded: boolean;
}

export default function NeuralCore({ threeLoaded }: NeuralCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threeLoaded) return;
    const container = containerRef.current;
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
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-auto mask-[radial-gradient(circle_at_center,black_50%,transparent_90%)]"
      id="neural-core-container"
    />
  );
}
