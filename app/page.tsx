"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const BLUE = "#1300BA";

const LOGO = (
  <svg
    viewBox="0 0 456 406"
    width="100%"
    height="100%"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M166.5 46A51 51 0 0 1 254.8 46L421.2 334.3A49 49 0 0 1 336.3 383.3L327.9 368.8A24 24 0 0 0 307.1 357L74.8 357A51 51 0 0 1 30.6 280.5L166.5 46ZM210.7 174.1L259.7 259L161.7 259Z"
      fill="#000"
    />
    <circle cx="356" cy="49" r="49" fill={BLUE} />
  </svg>
);

type Agent = {
  name: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
};

const STARS = Array.from({ length: 180 }, (_, i) => ({
  x: ((i * 83) % 2000) - 1000,
  y: ((i * 137) % 1200) - 600,
  z: (i * 197) % 3400 + 120,
  size: i % 4 === 0 ? 1.6 : 0.75,
  phase: i * 0.73,
}));

const AGENTS: Agent[] = [
  { name: "Research", x: -520, y: -160, z: 500, speed: 0.9, phase: 0.2 },
  { name: "Sales", x: 430, y: -210, z: 720, speed: 0.7, phase: 1.4 },
  { name: "Finance", x: -650, y: 120, z: 930, speed: 0.55, phase: 2.1 },
  { name: "HR", x: 600, y: 170, z: 1120, speed: 0.45, phase: 2.8 },
  { name: "Support", x: -280, y: 280, z: 1380, speed: 0.8, phase: 3.4 },
  { name: "Operations", x: 300, y: -40, z: 1650, speed: 0.62, phase: 4.1 },
  { name: "Analytics", x: -760, y: -20, z: 1950, speed: 0.5, phase: 4.8 },
  { name: "Engineering", x: 760, y: 40, z: 2250, speed: 0.72, phase: 5.4 },
  { name: "Legal", x: -420, y: -260, z: 2600, speed: 0.58, phase: 6.1 },
  { name: "Marketing", x: 500, y: 250, z: 3000, speed: 0.65, phase: 6.7 },
];

const STAGES = [
  [
    "DISCOVER",
    "DISCOVER EVERY AGENT.",
    "Find AI agents, tools and workflows across your organization before they become invisible infrastructure.",
  ],
  [
    "THE AI WORKFORCE IS MOVING",
    "COMMAND YOUR WORKFORCE.",
    "One command layer between your organization and every agent, tool and action.",
  ],
  [
    "COMMAND",
    "SAY IT. ARBYTER MOVES IT.",
    "Tell the workforce what you want. Arbyter turns natural language into operational intent.",
  ],
  [
    "GOVERN · CONTROL",
    "WORDS BECOME RUNTIME CONTROL.",
    "Business rules become permissions, approval gates and enforceable runtime controls.",
  ],
  [
    "INTERCEPT",
    "THE ACTION HITS THE BOUNDARY.",
    "An agent attempts an action outside policy. Arbyter stops it before the system does.",
  ],
  [
    "ENFORCE",
    "POLICY CHANGES. THE WORKFORCE CHANGES.",
    "A regulatory change propagates through the workforce. Affected agents change state automatically.",
  ],
  [
    "AUDIT · VISIBILITY · CONTROL",
    "ONE WORKFORCE. ONE COMMAND LAYER.",
    "Every action remains observable, governable and under organizational control.",
  ],
  [
    "AI GOVERNANCE · SECURITY",
    "BUILT FOR THE AI WORKFORCE.",
    "AI agent governance, AI security, agent control, policy enforcement, compliance and runtime oversight.",
  ],
  [
    "ARBYTER OS",
    "ENTER THE COMMAND LAYER.",
    "Orchestrate. Govern. Secure. Control your AI workforce from one place.",
  ],
];

function World({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const x = c.getContext("2d", { alpha: false });
    if (!x) return;

    let raf = 0;
    let t = 0;
    let smoothedProgress = progressRef.current;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let cachedBgGradient: CanvasGradient | null = null;

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;

      c.width = Math.floor(w * d);
      c.height = Math.floor(h * d);
      x.setTransform(d, 0, 0, d, 0, 0);

      const g = x.createRadialGradient(
        w / 2,
        h / 2,
        10,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.78
      );
      g.addColorStop(0, "rgba(125,135,255,.24)");
      g.addColorStop(0.28, "rgba(238,242,255,.92)");
      g.addColorStop(0.68, "rgba(220,227,246,.98)");
      g.addColorStop(1, "#f7f9fd");
      cachedBgGradient = g;
    };

    const project = (a: number, b: number, z: number, cam: number) => {
      const depth = Math.max(90, z - cam);
      const s = 820 / depth;
      return {
        x: w / 2 + a * s,
        y: h / 2 + b * s,
        s,
        depth,
      };
    };

    const line = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      alpha: number,
      width = 1
    ) => {
      x.strokeStyle = `rgba(76,66,190,${alpha})`;
      x.lineWidth = width;
      x.beginPath();
      x.moveTo(a.x, a.y);
      x.lineTo(b.x, b.y);
      x.stroke();
    };

    const draw = () => {
      t += 0.012;

      smoothedProgress += (progressRef.current - smoothedProgress) * 0.08;
      const cam = smoothedProgress * 3900 - 300;

      if (cachedBgGradient) {
        x.fillStyle = cachedBgGradient;
        x.fillRect(0, 0, w, h);
      }

      for (let i = 0; i < STARS.length; i++) {
        const s = STARS[i];
        const q = project(s.x, s.y, s.z, cam);

        if (q.depth > 80 && q.depth < 4200) {
          const tw = 0.18 + 0.28 * (Math.sin(t * 1.4 + s.phase) + 1);
          x.fillStyle = `rgba(19,0,186,${tw})`;
          const sz = Math.max(0.35, s.size * q.s);
          x.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
        }
      }

      const zStart = Math.floor(cam / 180) * 180;
      for (let z = zStart; z < cam + 2500; z += 180) {
        line(project(-1300, 430, z, cam), project(1300, 430, z, cam), 0.045);
      }

      for (let a = -1200; a <= 1400; a += 180) {
        line(project(a, -450, cam + 250, cam), project(a, 450, cam + 2000, cam), 0.022);
      }

      const center = project(0, 0, 1080, cam);
      const cs = Math.min(2.3, Math.max(0.7, 820 / Math.max(180, 1080 - cam)));
      const cw = 175 * cs;
      const ch = 110 * cs;

      x.save();
      x.translate(center.x, center.y);
      x.rotate(Math.sin(t * 0.4) * 0.07);

      x.strokeStyle = "rgba(19,0,186,.10)";
      x.lineWidth = 14;
      x.beginPath();
      x.roundRect(-cw / 2, -ch / 2, cw, ch, 28);
      x.stroke();

      x.fillStyle = "rgba(255,255,255,.94)";
      x.strokeStyle = "rgba(19,0,186,.30)";
      x.lineWidth = 1.5;
      x.beginPath();
      x.roundRect(-cw / 2, -ch / 2, cw, ch, 28);
      x.fill();
      x.stroke();

      x.strokeStyle = "rgba(19,0,186,.10)";
      x.beginPath();
      x.roundRect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16, 20);
      x.stroke();
      x.restore();

      const pts = AGENTS.map((a, i) => {
        const dx = Math.sin(t * a.speed + a.phase) * 75;
        const dy = Math.cos(t * a.speed * 0.8 + a.phase) * 45;
        return {
          ...a,
          i,
          ...project(a.x + dx, a.y + dy, a.z, cam),
        };
      })
        .filter((a) => a.depth > 80 && a.depth < 3300)
        .sort((a, b) => b.depth - a.depth);

      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        line(a, center, 0.09 + (Math.sin(t * 2 + i) + 1) * 0.025, Math.max(0.5, a.s));

        const q = (t * 0.18 + i * 0.13) % 1;
        const px = a.x + (center.x - a.x) * q;
        const py = a.y + (center.y - a.y) * q;

        x.fillStyle = "rgba(19,0,186,.42)";
        x.beginPath();
        x.arc(px, py, Math.max(1, 2 * a.s), 0, Math.PI * 2);
        x.fill();
      }

      if (smoothedProgress > 0.43 && smoothedProgress < 0.84) {
        const e = project(0, -70, 2070, cam);
        const r = 115 * e.s + Math.sin(t * 3) * 4;

        x.strokeStyle = "rgba(19,0,186,.5)";
        x.lineWidth = 1;
        x.beginPath();
        x.arc(e.x, e.y, r, 0, Math.PI * 2);
        x.stroke();

        x.beginPath();
        x.arc(e.x, e.y, r * 0.68, 0, Math.PI * 2);
        x.stroke();

        x.fillStyle = BLUE;
        x.beginPath();
        x.arc(e.x, e.y, Math.max(2, 7 * e.s), 0, Math.PI * 2);
        x.fill();
      }

      x.textAlign = "center";
      x.textBaseline = "middle";

      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const s = Math.max(0.25, Math.min(1.6, a.s * 1.4));
        const ww = 112 * s;
        const hh = 58 * s;
        const blocked = smoothedProgress > 0.5 && a.name === "HR";

        x.save();
        x.translate(a.x, a.y);
        x.globalAlpha = Math.min(1, 0.25 + a.s * 1.1);

        if (blocked) {
          x.strokeStyle = "rgba(19,0,186,.25)";
          x.lineWidth = 6;
          x.beginPath();
          x.roundRect(-ww / 2, -hh / 2, ww, hh, 12 * s);
          x.stroke();
        }

        x.fillStyle = blocked ? "rgba(19,0,186,.16)" : "rgba(255,255,255,.58)";
        x.strokeStyle = blocked ? "rgba(19,0,186,.8)" : "rgba(255,255,255,.7)";
        x.lineWidth = blocked ? 1.5 : 1;

        x.beginPath();
        x.roundRect(-ww / 2, -hh / 2, ww, hh, 12 * s);
        x.fill();
        x.stroke();

        x.fillStyle = "#111322";
        x.font = `700 ${Math.max(7, Math.floor(10 * s))}px system-ui, -apple-system, sans-serif`;
        x.fillText(a.name, 0, -3 * s);

        x.fillStyle = blocked ? BLUE : "rgba(17,19,34,.48)";
        x.font = `600 ${Math.max(5, Math.floor(6 * s))}px system-ui, -apple-system, sans-serif`;
        x.fillText(blocked ? "ACTION BLOCKED" : "ACTIVE", 0, 12 * s);

        x.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [progressRef]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full pointer-events-none" />;
}

function Intro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const x = c.getContext("2d");
    if (!x) return;

    let raf = 0;
    let t = 0;
    const start = performance.now();
    let audio: AudioContext | null = null;
    const eaten = new Set<number>();

    const resumeAudio = () => {
      try {
        if (!audio) audio = new AudioContext();
        if (audio.state === "suspended") void audio.resume();
      } catch {}
    };

    const eatSound = () => {
      try {
        resumeAudio();
        if (!audio || audio.state !== "running") return;

        const now = audio.currentTime;
        const o1 = audio.createOscillator();
        const o2 = audio.createOscillator();
        const g = audio.createGain();

        o1.type = "square";
        o2.type = "square";

        o1.frequency.setValueAtTime(740, now);
        o1.frequency.exponentialRampToValueAtTime(520, now + 0.075);

        o2.frequency.setValueAtTime(520, now + 0.075);
        o2.frequency.exponentialRampToValueAtTime(740, now + 0.15);

        g.gain.setValueAtTime(0.035, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        o1.connect(g);
        o2.connect(g);
        g.connect(audio.destination);

        o1.start(now);
        o1.stop(now + 0.08);
        o2.start(now + 0.075);
        o2.stop(now + 0.18);
      } catch {}
    };

    const unlock = () => resumeAudio();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.floor(w * d);
      c.height = Math.floor(h * d);
      x.setTransform(d, 0, 0, d, 0, 0);
    };

    const drawGlassCircle = (cx: number, cy: number, r: number, mouth: number) => {
      x.save();
      x.translate(cx, cy);

      const g = x.createRadialGradient(
        -r * 0.32,
        -r * 0.38,
        r * 0.08,
        r * 0.08,
        r * 0.05,
        r * 1.15
      );
      g.addColorStop(0, "rgba(255,255,255,.96)");
      g.addColorStop(0.18, "rgba(210,215,255,.9)");
      g.addColorStop(0.5, "rgba(86,72,220,.68)");
      g.addColorStop(1, "rgba(19,0,186,.9)");

      x.fillStyle = g;
      x.beginPath();

      if (mouth <= 0.001) {
        x.arc(0, 0, r, 0, Math.PI * 2);
      } else {
        const half = mouth / 2;
        x.moveTo(0, 0);
        x.arc(0, 0, r, half, Math.PI * 2 - half);
        x.closePath();
      }
      x.fill();

      x.strokeStyle = "rgba(255,255,255,.92)";
      x.lineWidth = 2;
      x.stroke();

      x.globalAlpha = 0.48;
      x.fillStyle = "rgba(255,255,255,.95)";
      x.beginPath();
      x.ellipse(-r * 0.28, -r * 0.38, r * 0.42, r * 0.18, -0.45, 0, Math.PI * 2);
      x.fill();
      x.restore();
    };

    const draw = () => {
      t += 0.012;
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / 7600);

      x.clearRect(0, 0, w, h);

      // Background
      const bg = x.createRadialGradient(
        w * 0.5,
        h * 0.48,
        20,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.82
      );
      bg.addColorStop(0, "rgba(130,120,245,.18)");
      bg.addColorStop(0.3, "rgba(238,242,255,.88)");
      bg.addColorStop(0.7, "rgba(220,227,246,.98)");
      bg.addColorStop(1, "#f7f9fd");
      x.fillStyle = bg;
      x.fillRect(0, 0, w, h);

      // Background Star Field
      for (let i = 0; i < 120; i++) {
        const sx = (i * 83) % w;
        const sy = (i * 137) % h;
        const tw = 0.16 + 0.22 * (Math.sin(t * 1.2 + i) + 1);
        x.fillStyle = `rgba(19,0,186,${tw})`;
        x.beginPath();
        x.arc(sx, sy, i % 3 === 0 ? 1.5 : 0.7, 0, Math.PI * 2);
        x.fill();
      }

      const radius = Math.min(44, Math.max(30, w * 0.035));
      const cy = h * 0.5;
      const centerX = w * 0.5;

      // Responsive spacing: 1 dead-center, 2 on either side
      const pelletGap = Math.min(96, Math.max(54, w * 0.085));

      const pellets = [
        { id: 0, x: centerX - 2 * pelletGap, y: cy, isCenter: false },
        { id: 1, x: centerX - 1 * pelletGap, y: cy, isCenter: false },
        { id: 2, x: centerX,                 y: cy, isCenter: true },
        { id: 3, x: centerX + 1 * pelletGap, y: cy, isCenter: false },
        { id: 4, x: centerX + 2 * pelletGap, y: cy, isCenter: false },
      ];

      const move = Math.max(0, Math.min(1, (elapsed - 450) / 2100));
      const startX = pellets[0].x - radius * 2.2;
      const endX = pellets[4].x + radius * 0.72;
      const baseX = startX + (endX - startX) * move;

      let targetIndex = pellets.findIndex((q) => !eaten.has(q.id));
      if (targetIndex < 0) targetIndex = 4;
      const target = pellets[targetIndex];

      const distanceToTarget = Math.hypot(baseX - target.x, cy - target.y);
      const mouthPhase = Math.max(0, 1 - Math.min(1, distanceToTarget / 70));
      const mouth = mouthPhase > 0.02 ? Math.sin(mouthPhase * Math.PI) * 0.9 : 0;

      // Chomp Detection
      pellets.forEach((q) => {
        if (eaten.has(q.id)) return;
        const d = Math.hypot(baseX - q.x, cy - q.y);
        if (d < radius * 0.92) {
          eaten.add(q.id);
          eatSound();
        }
      });

      // Render Pellets with Frosted Shading & Center Halo
      pellets.forEach((q) => {
        if (eaten.has(q.id)) return;

        const pr = q.isCenter ? 7.5 : 6;

        // Subtle glowing halo for the center pellet
        if (q.isCenter) {
          const haloPulse = 1 + 0.18 * Math.sin(t * 3.5);
          x.fillStyle = "rgba(19,0,186,.12)";
          x.beginPath();
          x.arc(q.x, q.y, pr * 2.2 * haloPulse, 0, Math.PI * 2);
          x.fill();
        }

        const pg = x.createRadialGradient(
          q.x - pr * 0.3,
          q.y - pr * 0.35,
          1,
          q.x,
          q.y,
          pr * 1.15
        );
        pg.addColorStop(0, "rgba(255,255,255,.98)");
        pg.addColorStop(0.35, "rgba(95,82,230,.92)");
        pg.addColorStop(1, "rgba(19,0,186,.85)");

        x.fillStyle = pg;
        x.beginPath();
        x.arc(q.x, q.y, pr, 0, Math.PI * 2);
        x.fill();

        x.strokeStyle = "rgba(255,255,255,.85)";
        x.lineWidth = 1;
        x.beginPath();
        x.arc(q.x, q.y, pr, 0, Math.PI * 2);
        x.stroke();
      });

      drawGlassCircle(baseX, cy, radius, eaten.size === 5 ? 0 : mouth);

      if (p > 0.96) {
        const a = Math.min(1, (p - 0.96) / 0.04);
        x.fillStyle = `rgba(255,255,255,${a * 0.42})`;
        x.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    const done = setTimeout(onDone, 3300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      try {
        void audio?.close();
      } catch {}
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[999] bg-[#f7f9fd]">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [stage, setStage] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const progressRef = useRef(0);

  useEffect(() => {
    let momentumRaf = 0;
    let lastTouchY = 0;
    let velocity = 0;
    let isTouching = false;

    const updateProgress = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const p = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      progressRef.current = p;

      const currentStage = Math.min(
        STAGES.length - 1,
        Math.floor(p * STAGES.length)
      );
      setStage((prev) => (prev !== currentStage ? currentStage : prev));

      const isPastHero = p > 0.04;
      setScrolled((prev) => (prev !== isPastHero ? isPastHero : prev));
    };

    const onTouchStart = (e: TouchEvent) => {
      cancelAnimationFrame(momentumRaf);
      isTouching = true;
      lastTouchY = e.touches[0].clientY;
      velocity = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentY;
      lastTouchY = currentY;

      velocity = deltaY * 1.8;
      window.scrollBy(0, velocity);
    };

    const applyMomentum = () => {
      if (Math.abs(velocity) > 0.4) {
        velocity *= 0.92;
        window.scrollBy(0, velocity);
        momentumRaf = requestAnimationFrame(applyMomentum);
      }
    };

    const onTouchEnd = () => {
      isTouching = false;
      momentumRaf = requestAnimationFrame(applyMomentum);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    updateProgress();

    return () => {
      cancelAnimationFrame(momentumRaf);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <main className="min-h-[920vh] bg-[#f7f9fd] text-[#111322]">
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}

      <div className={introDone ? "opacity-100 transition-opacity duration-700" : "opacity-0"}>
        <header className="fixed left-0 right-0 top-0 z-50 flex h-[72px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-9">{LOGO}</div>
            <div className="hidden md:block">
              <b className="text-sm">ARBYTER OS</b>
              <div className="text-[7px] tracking-[.3em] text-black/35">COMMAND LAYER</div>
            </div>
          </Link>

          <Link
            href="/login"
            className="pointer-events-auto rounded-full border border-[#1300BA]/15 bg-white/55 px-5 py-2.5 text-xs text-[#111322] shadow-[0_10px_35px_rgba(19,0,186,.08)] backdrop-blur-xl hover:bg-[#1300BA] hover:text-white transition-colors"
          >
            Enter
          </Link>
        </header>

        <div className="fixed inset-0 z-0">
          <World progressRef={progressRef} />
        </div>

        <div className="pointer-events-none fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-full border border-[#1300BA]/10 bg-white/45 px-4 py-2 shadow-[0_10px_35px_rgba(19,0,186,.08)] backdrop-blur-xl">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all duration-300 " +
                (i === stage ? "w-9 bg-[#1300BA]" : "w-2 bg-[#1300BA]/15")
              }
            />
          ))}
        </div>

        <div className="pointer-events-none fixed inset-0 z-30">
          {STAGES.map((s, i) => (
            <div
              key={s[0]}
              className={
                "absolute top-1/2 max-w-[480px] -translate-y-1/2 px-6 transition-all duration-700 " +
                (i === 0
                  ? "left-6 md:left-12"
                  : i % 2
                  ? "right-6 md:right-12"
                  : "left-6 md:left-12") +
                " " +
                (i === stage
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0 pointer-events-none")
              }
            >
              <div className="rounded-[2rem] border border-white/70 bg-white/45 p-7 shadow-[0_24px_80px_rgba(19,0,186,.10)] backdrop-blur-xl md:p-9">
                <div className="text-[9px] font-bold tracking-[.4em] text-[#1300BA]">{s[0]}</div>
                <h1 className="mt-5 text-5xl font-black leading-[.82] tracking-[-.07em] text-[#111322] md:text-7xl">
                  {s[1]}
                </h1>
                <p className="mt-6 max-w-md text-sm leading-6 text-[#111322]/50">{s[2]}</p>
              </div>
            </div>
          ))}

          <div
            className={
              "absolute bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[.35em] text-[#1300BA]/60 transition-opacity duration-300 " +
              (scrolled ? "opacity-0 pointer-events-none" : "opacity-100")
            }
          >
            <span className="inline-block animate-bounce">↓</span> SCROLL OR DRAG TO ENTER
          </div>
        </div>

        <div className="relative z-20 h-[920vh]">
          {STAGES.map((_, i) => (
            <section key={i} className="h-[102.2vh]" />
          ))}
        </div>

        <section className="relative z-40 bg-white/80 px-6 py-32 text-[#111322] backdrop-blur-xl">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mx-auto h-14 w-16">{LOGO}</div>
            <div className="mt-7 text-[9px] font-bold tracking-[.4em] text-[#1300BA]">ARBYTER OS</div>
            <div className="mx-auto max-w-3xl text-xs leading-6 text-[#111322]/30">
              AI agent governance · AI workforce management · AI security · agent orchestration ·
              autonomous AI control · policy enforcement · AI compliance · agent monitoring · AI risk
              management · runtime governance
            </div>

            <h2 className="mt-5 text-5xl font-black leading-[.82] tracking-[-.075em] md:text-8xl">
              LET YOUR AI
              <br />
              WORKFORCE MOVE.
            </h2>

            <p className="mx-auto mt-8 max-w-xl text-sm leading-6 text-[#111322]/45">
              Command the workforce. Govern the rules. Control the actions. Keep the evidence.
            </p>

            <Link
              href="/login"
              className="pointer-events-auto mt-9 inline-flex rounded-full bg-[#1300BA] px-8 py-4 text-sm font-semibold text-white shadow-[0_16px_45px_rgba(19,0,186,.22)] hover:bg-[#0e008a] transition-all"
            >
              Enter Arbyter →
            </Link>
          </div>

          <footer className="mx-auto mt-28 flex max-w-7xl flex-col gap-4 border-t border-[#1300BA]/10 pt-8 text-xs text-[#111322]/35 md:flex-row md:justify-between">
            <b className="text-[#111322]">ARBYTER OS</b>
            <a href="mailto:arbyteros@gmail.com" className="hover:text-[#1300BA]">
              arbyteros@gmail.com
            </a>
            <span className="text-[8px] tracking-[.3em]">ORCHESTRATE · GOVERN · SECURE</span>
            <a
              href="https://instagram.com/arbyter.os"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1300BA]"
            >
              @arbyter.os
            </a>
          </footer>
        </section>
      </div>
    </main>
  );
}
