import React, { useEffect, useRef } from "react";

/*
  Live particle constellation (Dala-style) rendered on a canvas — thousands of
  tiny geometric shapes that drift, connect with hairlines when near, gently pull
  toward the centre, and scatter away from the cursor. Tuned for the cream/orange
  ConvoApp theme (light background, brand-coloured particles).
*/
const COLORS = ["#ea580c", "#f59e0b", "#15846e", "#1f1f1f", "#fb923c"]; // orange, amber, teal, ink, light-orange
const SHAPES = ["circle", "triangle", "diamond", "square"];

export default function ParticleField({ className = "", count = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    let w = 0;
    let h = 0;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      particles = Array.from({ length: count }, () => {
        // Average 3 randoms → centre-weighted distribution (denser middle).
        const fx = (Math.random() + Math.random() + Math.random()) / 3;
        const fy = (Math.random() + Math.random() + Math.random()) / 3;
        return {
          x: fx * w,
          y: fy * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          size: 1.4 + Math.random() * 4,
          shape: SHAPES[(Math.random() * SHAPES.length) | 0],
          color: COLORS[(Math.random() * COLORS.length) | 0],
          alpha: 0.4 + Math.random() * 0.5,
        };
      });
    };

    const drawShape = (p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      const s = p.size;
      if (p.shape === "circle") {
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      } else if (p.shape === "square") {
        ctx.rect(p.x - s, p.y - s, s * 2, s * 2);
      } else if (p.shape === "diamond") {
        ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s, p.y); ctx.closePath();
      } else {
        ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s, p.y + s); ctx.lineTo(p.x - s, p.y + s); ctx.closePath();
      }
      ctx.fill();
    };

    const cx = () => w / 2;
    const cy = () => h / 2;

    const step = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        a.x += a.vx;
        a.y += a.vy;

        // subtle pull back toward centre so the cloud holds its shape
        a.vx += (cx() - a.x) * 0.000015;
        a.vy += (cy() - a.y) * 0.000015;

        // cursor repulsion
        const dxm = a.x - mouse.x;
        const dym = a.y - mouse.y;
        const dm2 = dxm * dxm + dym * dym;
        if (dm2 < 9000) {
          const d = Math.sqrt(dm2) || 1;
          const f = ((9000 - dm2) / 9000) * 0.8;
          a.x += (dxm / d) * f;
          a.y += (dym / d) * f;
        }

        // wrap at edges
        if (a.x < -10) a.x = w + 10;
        if (a.x > w + 10) a.x = -10;
        if (a.y < -10) a.y = h + 10;
        if (a.y > h + 10) a.y = -10;

        // connecting hairlines
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 7000) {
            ctx.globalAlpha = (1 - d2 / 7000) * 0.13;
            ctx.strokeStyle = "#ea580c";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) drawShape(p);
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };

    const onResize = () => { resize(); init(); };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    resize();
    init();
    step();
    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [count]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}
