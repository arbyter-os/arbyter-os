"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const BLUE = "#1300BA";

const LOGO = (
  <svg viewBox="0 0 456 406" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M166.5 46A51 51 0 0 1 254.8 46L421.2 334.3A49 49 0 0 1 336.3 383.3L327.9 368.8A24 24 0 0 0 307.1 357L74.8 357A51 51 0 0 1 30.6 280.5L166.5 46ZM210.7 174.1L259.7 259L161.7 259Z" fill="#000" />
    <circle cx="356" cy="49" r="49" fill={BLUE} />
  </svg>
);

type Agent = { name: string; x: number; y: number; z: number; speed: number; phase: number };

const STARS = Array.from({ length: 220 }, (_, i) => ({
  x: ((i * 83) % 2000) - 1000,
  y: ((i * 137) % 1200) - 600,
  z: (i * 197) % 3400 + 120,
  size: i % 4 === 0 ? 1.7 : 0.8,
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

function World({ progress }: { progress: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;

    let raf = 0;
    let t = 0;

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * d;
      c.height = window.innerHeight * d;
      x.setTransform(d, 0, 0, d, 0, 0);
    };

    const project = (a: number, b: number, z: number, cam: number) => {
      const depth = Math.max(90, z - cam);
      const s = 820 / depth;
      return { x: window.innerWidth / 2 + a * s, y: window.innerHeight / 2 + b * s, s, depth };
    };

    const line = (a: { x: number; y: number }, b: { x: number; y: number }, alpha: number, width = 1) => {
      x.strokeStyle = `rgba(76,66,190,${alpha})`;
      x.lineWidth = width;
      x.beginPath();
      x.moveTo(a.x, a.y);
      x.lineTo(b.x, b.y);
      x.stroke();
    };

    const draw = () => {
      t += 0.012;
      const p = Math.max(0, Math.min(1, progress));
      const cam = p * 3900 - 300;
      const w = window.innerWidth;
      const h = window.innerHeight;
      x.clearRect(0, 0, w, h);

      const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.78);
      g.addColorStop(0, p > 0.62 ? "rgba(130,120,245,.34)" : "rgba(110,130,255,.24)");
      g.addColorStop(0.28, "rgba(238,242,255,.92)");
      g.addColorStop(0.68, "rgba(220,227,246,.98)");
      g.addColorStop(1, "#f7f9fd");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);

      STARS.forEach((s) => {
        const q = project(s.x, s.y, s.z, cam);
        if (q.depth > 80 && q.depth < 4200) {
          const tw = 0.18 + 0.28 * (Math.sin(t * 1.4 + s.phase) + 1);
          x.fillStyle = `rgba(19,0,186,${tw})`;
          x.beginPath();
          x.arc(q.x, q.y, Math.max(0.35, s.size * q.s), 0, Math.PI * 2);
          x.fill();
        }
      });

      for (let z = Math.floor(cam / 180) * 180; z < cam + 2500; z += 180) {
        line(project(-1300, 430, z, cam), project(1300, 430, z, cam), 0.045);
      }
      for (let a = -1200; a <= 1400; a += 180) {
        line(project(a, -450, cam + 250, cam), project(a, 450, cam + 2000, cam), 0.022);
      }

      const center = project(0, 0, 1080, cam);
      const pts = AGENTS.map((a, i) => {
        const dx = Math.sin(t * a.speed + a.phase) * 75;
        const dy = Math.cos(t * a.speed * 0.8 + a.phase) * 45;
        return { ...a, i, ...project(a.x + dx, a.y + dy, a.z, cam) };
      }).filter((a) => a.depth > 80 && a.depth < 3300).sort((a, b) => b.depth - a.depth);

      pts.forEach((a, i) => {
        line(a, center, 0.09 + (Math.sin(t * 2 + i) + 1) * 0.025, Math.max(0.5, a.s));
        const q = (t * 0.18 + i * 0.13) % 1;
        x.fillStyle = "rgba(19,0,186,.42)";
        x.beginPath();
        x.arc(a.x + (center.x - a.x) * q, a.y + (center.y - a.y) * q, Math.max(1, 2 * a.s), 0, Math.PI * 2);
        x.fill();
      });

      const cs = Math.min(2.3, Math.max(0.7, 820 / Math.max(180, 1080 - cam)));
      const cw = 175 * cs;
      const ch = 110 * cs;
      x.save();
      x.translate(center.x, center.y);
      x.rotate(Math.sin(t * 0.4) * 0.07);
      x.fillStyle = "rgba(255,255,255,.94)";
      x.strokeStyle = "rgba(19,0,186,.30)";
      x.lineWidth = 1.5;
      x.shadowBlur = 42;
      x.shadowColor = "rgba(19,0,186,.28)";
      x.beginPath();
      x.roundRect(-cw / 2, -ch / 2, cw, ch, 28);
      x.fill();
      x.stroke();
      x.shadowBlur = 0;
      x.strokeStyle = "rgba(19,0,186,.10)";
      x.beginPath();
      x.roundRect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16, 20);
      x.stroke();
      x.restore();

      if (p > 0.43 && p < 0.84) {
        const e = project(0, -70, 2070, cam);
        const r = 115 * e.s + Math.sin(t * 3) * 4;
        x.strokeStyle = "rgba(19,0,186,.5)";
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

      pts.forEach((a) => {
        const s = Math.max(0.25, Math.min(1.6, a.s * 1.4));
        const ww = 112 * s;
        const hh = 58 * s;
        const blocked = p > 0.5 && a.name === "HR";
        x.save();
        x.translate(a.x, a.y);
        x.globalAlpha = Math.min(1, 0.25 + a.s * 1.1);
        x.fillStyle = blocked ? "rgba(19,0,186,.16)" : "rgba(255,255,255,.58)";
        x.strokeStyle = blocked ? "rgba(19,0,186,.7)" : "rgba(255,255,255,.7)";
        x.lineWidth = blocked ? 1.5 : 1;
        x.shadowBlur = blocked ? 28 : 18;
        x.shadowColor = "rgba(19,0,186,.25)";
        x.beginPath();
        x.roundRect(-ww / 2, -hh / 2, ww, hh, 12 * s);
        x.fill();
        x.stroke();
        x.shadowBlur = 0;
        x.textAlign = "center";
        x.fillStyle = "#111322";
        x.font = `700 ${Math.max(7, 10 * s)}px system-ui`;
        x.fillText(a.name, 0, 2 * s);
        x.fillStyle = blocked ? BLUE : "rgba(17,19,34,.48)";
        x.font = `600 ${Math.max(5, 6 * s)}px system-ui`;
        x.fillText(blocked ? "ACTION BLOCKED" : "ACTIVE", 0, 15 * s);
        x.restore();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [progress]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

function Intro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let finished = false;
    const reveal = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    // The animation is decorative. It must never prevent the application from loading.
    const fallback = window.setTimeout(reveal, 3300);

    try {
      const c = ref.current;
      const x = c?.getContext("2d");
      if (!c || !x) {
        reveal();
        return () => window.clearTimeout(fallback);
      }

      let raf = 0;
      let t = 0;
      const start = performance.now();
      const pellets = [0, 1, 2, 3, 4];
      const eaten = new Set<number>();

      const resize = () => {
        const d = Math.min(window.devicePixelRatio || 1, 2);
        c.width = window.innerWidth * d;
        c.height = window.innerHeight * d;
        x.setTransform(d, 0, 0, d, 0, 0);
      };

      const draw = () => {
        t += 0.012;
        const elapsed = performance.now() - start;
        const p = Math.min(1, elapsed / 7600);
        const w = window.innerWidth;
        const h = window.innerHeight;
        x.clearRect(0, 0, w, h);

        const bg = x.createRadialGradient(w * 0.5, h * 0.48, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.82);
        bg.addColorStop(0, "rgba(130,120,245,.18)");
        bg.addColorStop(0.3, "rgba(238,242,255,.88)");
        bg.addColorStop(0.7, "rgba(220,227,246,.98)");
        bg.addColorStop(1, "#f7f9fd");
        x.fillStyle = bg;
        x.fillRect(0, 0, w, h);

        for (let i = 0; i < 170; i++) {
          const sx = (i * 83) % w;
          const sy = (i * 137) % h;
          x.fillStyle = `rgba(19,0,186,${0.16 + 0.22 * (Math.sin(t * 1.2 + i) + 1)})`;
          x.beginPath();
          x.arc(sx, sy, i % 3 === 0 ? 1.5 : 0.7, 0, Math.PI * 2);
          x.fill();
        }

        const radius = Math.min(44, Math.max(30, w * 0.035));
        const cy = h * 0.5;
        const centerX = w * 0.5;
        const pelletGap = Math.min(72, Math.max(48, w * 0.07));
        const points = pellets.map((i) => ({ x: centerX + (i - 2) * pelletGap, y: cy }));
        const move = Math.max(0, Math.min(1, (elapsed - 450) / 2100));
        const baseX = points[0].x - radius * 2.2 + (points[4].x + radius * 0.72 - (points[0].x - radius * 2.2)) * move;

        points.forEach((q, i) => {
          if (eaten.has(i)) return;
          if (Math.hypot(baseX - q.x, cy - q.y) < radius * 0.92) eaten.add(i);
          x.fillStyle = "rgba(19,0,186,.85)";
          x.shadowBlur = 16;
          x.shadowColor = "rgba(19,0,186,.35)";
          x.beginPath();
          x.arc(q.x, q.y, 7, 0, Math.PI * 2);
          x.fill();
          x.shadowBlur = 0;
        });

        const target = points[Math.min(eaten.size, 4)];
        const distance = target ? Math.hypot(baseX - target.x, cy - target.y) : 999;
        const mouth = Math.max(0, Math.sin(Math.max(0, 1 - Math.min(1, distance / 70)) * Math.PI)) * 0.9;
        const fade = eaten.size === 5 ? 0 : 1;

        x.save();
        x.globalAlpha = fade;
        x.translate(baseX, cy);
        const r = radius;
        const half = mouth / 2;
        const g = x.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.08, r * 0.08, r * 0.05, r * 1.15);
        g.addColorStop(0, "rgba(255,255,255,.96)");
        g.addColorStop(0.18, "rgba(210,215,255,.9)");
        g.addColorStop(0.5, "rgba(86,72,220,.68)");
        g.addColorStop(1, "rgba(19,0,186,.9)");
        x.fillStyle = g;
        x.shadowBlur = 34;
        x.shadowColor = "rgba(19,0,186,.3)";
        x.beginPath();
        if (mouth <= 0.001) x.arc(0, 0, r, 0, Math.PI * 2);
        else {
          x.moveTo(0, 0);
          x.arc(0, 0, r, half, Math.PI * 2 - half);
          x.closePath();
        }
        x.fill();
        x.shadowBlur = 0;
        x.strokeStyle = "rgba(255,255,255,.92)";
        x.lineWidth = 2;
        x.stroke();
        x.globalAlpha = 0.48;
        x.fillStyle = "rgba(255,255,255,.95)";
        x.beginPath();
        x.ellipse(-r * 0.28, -r * 0.38, r * 0.42, r * 0.18, -0.45, 0, Math.PI * 2);
        x.fill();
        x.restore();

        if (p > 0.96) {
          x.fillStyle = `rgba(255,255,255,${Math.min(1, (p - 0.96) / 0.04) * 0.42})`;
          x.fillRect(0, 0, w, h);
        }

        raf = requestAnimationFrame(draw);
      };

      resize();
      window.addEventListener("resize", resize);
      raf = requestAnimationFrame(draw);

      return () => {
        window.clearTimeout(fallback);
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      };
    } catch {
      reveal();
      return () => window.clearTimeout(fallback);
    }
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[999] bg-[#f7f9fd]" aria-hidden="true">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

const STAGES = [
  ["DISCOVER", "DISCOVER EVERY AGENT.", "Find AI agents, tools and workflows across your organization before they become invisible infrastructure."],
  ["THE AI WORKFORCE IS MOVING", "COMMAND YOUR WORKFORCE.", "One command layer between your organization and every agent, tool and action."],
  ["COMMAND", "SAY IT. ARBYTER MOVES IT.", "Tell the workforce what you want. Arbyter turns natural language into operational intent."],
  ["GOVERN · CONTROL", "WORDS BECOME RUNTIME CONTROL.", "Business rules become permissions, approval gates and enforceable runtime controls."],
  ["INTERCEPT", "THE ACTION HITS THE BOUNDARY.", "An agent attempts an action outside policy. Arbyter stops it before the system does."],
  ["ENFORCE", "POLICY CHANGES. THE WORKFORCE CHANGES.", "A regulatory change propagates through the workforce. Affected agents change state automatically."],
  ["AUDIT · VISIBILITY · CONTROL", "ONE WORKFORCE. ONE COMMAND LAYER.", "Every action remains observable, governable and under organizational control."],
  ["AI GOVERNANCE · SECURITY", "BUILT FOR THE AI WORKFORCE.", "AI agent governance, AI security, agent control, policy enforcement, compliance and runtime oversight."],
  ["ARBYTER OS", "ENTER THE COMMAND LAYER.", "Orchestrate. Govern. Secure. Control your AI workforce from one place."],
] as const;

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(window.scrollY / max);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  const stage = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));

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
          <Link href="/login" className="pointer-events-auto rounded-full border border-[#1300BA]/15 bg-white/55 px-5 py-2.5 text-xs text-[#111322] shadow-[0_10px_35px_rgba(19,0,186,.08)] backdrop-blur-xl hover:bg-[#1300BA] hover:text-white">
            Enter
          </Link>
        </header>

        <div className="fixed inset-0 z-0"><World progress={progress} /></div>

        <div className="pointer-events-none fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-full border border-[#1300BA]/10 bg-white/45 px-4 py-2 shadow-[0_10px_35px_rgba(19,0,186,.08)] backdrop-blur-xl">
          {STAGES.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === stage ? "w-9 bg-[#1300BA]" : "w-2 bg-[#1300BA]/15"}`} />)}
        </div>

        <div className="pointer-events-none fixed inset-0 z-30">
          {STAGES.map((s, i) => (
            <div key={s[0]} className={`absolute top-1/2 max-w-[480px] -translate-y-1/2 px-6 transition-all duration-700 ${i === 0 ? "left-6 md:left-12" : i % 2 ? "right-6 md:right-12" : "left-6 md:left-12"} ${i === stage ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}>
              <div className="rounded-[2rem] border border-white/70 bg-white/45 p-7 shadow-[0_24px_80px_rgba(19,0,186,.10)] backdrop-blur-xl md:p-9">
                <div className="text-[9px] font-bold tracking-[.4em] text-[#1300BA]">{s[0]}</div>
                <h1 className="mt-5 text-5xl font-black leading-[.82] tracking-[-.07em] text-[#111322] md:text-7xl">{s[1]}</h1>
                <p className="mt-6 max-w-md text-sm leading-6 text-[#111322]/50">{s[2]}</p>
              </div>
            </div>
          ))}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[.35em] text-[#1300BA]/60 ${progress > 0.05 ? "opacity-0" : "opacity-100"}`}>
            <span className="inline-block animate-bounce">↓</span> SCROLL TO ENTER
          </div>
        </div>

        <div className="relative z-20 h-[920vh]">{STAGES.map((_, i) => <section key={i} className="h-[102.2vh]" />)}</div>

        <section className="relative z-40 bg-white/80 px-6 py-32 text-[#111322] backdrop-blur-xl">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mx-auto h-14 w-16">{LOGO}</div>
            <div className="mt-7 text-[9px] font-bold tracking-[.4em] text-[#1300BA]">ARBYTER OS</div>
            <div className="mx-auto max-w-3xl text-xs leading-6 text-[#111322]/30">AI agent governance · AI workforce management · AI security · agent orchestration · autonomous AI control · policy enforcement · AI compliance · agent monitoring · AI risk management · runtime governance</div>
            <h2 className="mt-5 text-5xl font-black leading-[.82] tracking-[-.075em] md:text-8xl">LET YOUR AI<br />WORKFORCE MOVE.</h2>
            <p className="mx-auto mt-8 max-w-xl text-sm leading-6 text-[#111322]/45">Command the workforce. Govern the rules. Control the actions. Keep the evidence.</p>
            <Link href="/login" className="pointer-events-auto mt-9 inline-flex rounded-full bg-[#1300BA] px-8 py-4 text-sm font-semibold text-white shadow-[0_16px_45px_rgba(19,0,186,.22)] hover:bg-[#0e008a]">Enter Arbyter →</Link>
          </div>
          <footer className="mx-auto mt-28 flex max-w-7xl flex-col gap-4 border-t border-[#1300BA]/10 pt-8 text-xs text-[#111322]/35 md:flex-row md:justify-between">
            <b className="text-[#111322]">ARBYTER OS</b>
            <a href="mailto:arbyteros@gmail.com">arbyteros@gmail.com</a>
            <span className="text-[8px] tracking-[.3em]">ORCHESTRATE · GOVERN · SECURE</span>
            <a href="https://instagram.com/arbyter.os" target="_blank" rel="noreferrer" className="hover:text-[#1300BA]">@arbyter.os</a>
          </footer>
        </section>
      </div>
    </main>
  );
}
