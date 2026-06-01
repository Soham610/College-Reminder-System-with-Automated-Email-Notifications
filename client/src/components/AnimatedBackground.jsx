import { useEffect, useRef } from "react";

const PARTICLE_COLORS = [
  "rgba(34, 211, 238, 0.9)",
  "rgba(99, 102, 241, 0.9)",
  "rgba(139, 92, 246, 0.88)",
  "rgba(236, 72, 153, 0.72)",
];

const buildParticles = (count, width, height) =>
  Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    radius: 1.2 + Math.random() * 2.4,
    color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
    alpha: 0.4 + Math.random() * 0.55,
  }));

const AnimatedBackground = ({ mode = "light" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (mode !== "dark") {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 720;
    const particleCount = reduceMotion ? 0 : mobile ? 26 : 48;
    let width = 0;
    let height = 0;
    let particles = [];
    let frameId = 0;
    let waveOffset = 0;

    const setCanvasSize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = buildParticles(particleCount, width, height);
    };

    const drawGrid = () => {
      context.save();
      context.strokeStyle = "rgba(148, 163, 184, 0.08)";
      context.lineWidth = 1;
      const gap = mobile ? 44 : 56;

      for (let x = -gap; x < width + gap; x += gap) {
        context.beginPath();
        context.moveTo(x + ((waveOffset * 12) % gap), 0);
        context.lineTo(x + gap / 3 + ((waveOffset * 12) % gap), height);
        context.stroke();
      }

      for (let y = 0; y < height + gap; y += gap) {
        context.beginPath();
        context.moveTo(0, y + Math.sin((waveOffset + y) * 0.008) * 6);
        context.lineTo(width, y + Math.sin((waveOffset + y) * 0.008) * 6);
        context.stroke();
      }

      context.restore();
    };

    const drawWave = () => {
      context.save();
      context.beginPath();

      for (let x = 0; x <= width; x += 14) {
        const y = height * 0.72 + Math.sin(x * 0.008 + waveOffset * 1.2) * 16;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();

      const fill = context.createLinearGradient(0, height * 0.52, width, height);
      fill.addColorStop(0, "rgba(34, 211, 238, 0.05)");
      fill.addColorStop(0.5, "rgba(99, 102, 241, 0.08)");
      fill.addColorStop(1, "rgba(139, 92, 246, 0.04)");
      context.fillStyle = fill;
      context.fill();
      context.restore();
    };

    const drawParticles = () => {
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;

        context.beginPath();
        context.fillStyle = particle.color.replace(/0\.\d+\)/, `${particle.alpha})`);
        context.shadowBlur = 18;
        context.shadowColor = particle.color;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();

        for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
          const next = particles[nextIndex];
          const dx = particle.x - next.x;
          const dy = particle.y - next.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 125) {
            context.beginPath();
            context.strokeStyle = `rgba(96, 165, 250, ${0.12 - distance / 1400})`;
            context.lineWidth = 1;
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }
      });
    };

    const render = () => {
      context.clearRect(0, 0, width, height);
      waveOffset += 0.55;

      drawGrid();
      drawWave();
      drawParticles();

      if (!reduceMotion) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    setCanvasSize();
    render();

    const handleResize = () => {
      setCanvasSize();
      if (reduceMotion) {
        context.clearRect(0, 0, width, height);
        drawGrid();
        drawWave();
        drawParticles();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(frameId);
    };
  }, [mode]);

  return (
    <div className={`animated-background animated-background-${mode}`} aria-hidden="true">
      <div className="animated-background-gradient" />

      {mode === "light" ? (
        <>
          <div className="animated-background-blob blob-a" />
          <div className="animated-background-blob blob-b" />
          <div className="animated-background-blob blob-c" />
          <div className="animated-background-blob blob-d" />
          <div className="animated-background-orb orb-a" />
          <div className="animated-background-orb orb-b" />
          <div className="animated-background-dots" />
          <div className="animated-background-leaf leaf-1" />
          <div className="animated-background-leaf leaf-2" />
          <div className="animated-background-leaf leaf-3" />
          <div className="animated-background-leaf leaf-4" />
          <div className="animated-background-leaf leaf-5" />
          <div className="animated-background-leaf leaf-6" />
          <div className="animated-background-leaf leaf-7" />
          <div className="animated-background-leaf leaf-8" />
        </>
      ) : (
        <>
          <canvas ref={canvasRef} className="animated-background-canvas" />
          <div className="animated-background-grid" />
          <div className="animated-background-streak streak-a" />
          <div className="animated-background-streak streak-b" />
        </>
      )}

      <div className="animated-background-overlay" />
    </div>
  );
};

export default AnimatedBackground;
