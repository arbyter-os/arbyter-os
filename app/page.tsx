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
      const d = Math.min(devicePixelRatio || 1, 2);
      c.width = innerWidth * d;
      c.height = innerHeight * d;
      x.setTransform(d, 0, 0, d, 0, 0);
    };

    const project = (
      a: number,
      b: number,
      z: number,
      cam: number
    ) => {
      const depth = Math.max(90, z - cam);
      const s = 820 / depth;

      return {
        x: innerWidth / 2 + a * s,
        y: innerHeight / 2 + b * s,
        s,
        depth,
      };
    };

    const line = (
      a: any,
      b: any,
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

      const p = progress;
      const cam = p * 3900 - 300;
      const w = innerWidth;
      const h = innerHeight;

      x.clearRect(0, 0, w, h);

      const g = x.createRadialGradient(
        w / 2,
        h / 2,
        10,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.78
      );

      g.addColorStop(
        0,
        p > 0.62
          ? "rgba(130,120,245,.34)"
          : "rgba(110,130,255,.24)"
      );
      g.addColorStop(0.28, "rgba(238,242,255,.92)");
      g.addColorStop(0.68, "rgba(220,227,246,.98)");
      g.addColorStop(1, "#f7f9fd");

      x.fillStyle = g;
      x.fillRect(0, 0, w, h);

      STARS.forEach((s) => {
        const q = project(s.x, s.y, s.z, cam);

        if (q.depth > 80 && q.depth < 4200) {
          const tw =
            0.18 +
            0.28 *
              (Math.sin(t * 1.4 + s.phase) + 1);

          x.fillStyle = `rgba(19,0,186,${tw})`;
          x.beginPath();
          x.arc(
            q.x,
            q.y,
            Math.max(0.35, s.size * q.s),
            0,
            Math.PI * 2
          );
          x.fill();
        }
      });

      for (
        let z = Math.floor(cam / 180) * 180;
        z < cam + 2500;
        z += 180
      ) {
        line(
          project(-1300, 430, z, cam),
          project(1300, 430, z, cam),
          0.045
        );
      }

      for (let a = -1200; a <= 1400; a += 180) {
        line(
          project(a, -450, cam + 250, cam),
          project(a, 450, cam + 2000, cam),
          0.022
        );
      }

      const center = project(0, 0, 1080, cam);

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

      pts.forEach((a, i) => {
        line(
          a,
          center,
          0.09 + (Math.sin(t * 2 + i) + 1) * 0.025,
          Math.max(0.5, a.s)
        );

        const q = (t * 0.18 + i * 0.13) % 1;
        const px = a.x + (center.x - a.x) * q;
        const py = a.y + (center.y - a.y) * q;

        x.fillStyle = "rgba(19,0,186,.42)";
        x.beginPath();
        x.arc(px, py, Math.max(1, 2 * a.s), 0, Math.PI * 2);
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
        x.font = "700 " + Math.max(7, 10 * s) + "px system-ui";
        x.fillText(a.name, 0, 2 * s);
        x.fillStyle = blocked ? BLUE : "rgba(17,19,34,.48)";
        x.font = "600 " + Math.max(5, 6 * s) + "px system-ui";
        x.fillText(blocked ? "ACTION BLOCKED" : "ACTIVE", 0, 15 * s);
        x.restore();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, [progress]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

function Intro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Fail-open: the intro must never be able to keep the real site hidden.
    // Schedule the reveal before touching any browser/canvas APIs that may
    // be unavailable or throw in a particular browser/environment.
    let completed = false;
    const reveal = () => {
      if (completed) return;
      completed = true;
      onDone();
    };

    const done = window.setTimeout(reveal, 3300);

    try {
      const c = ref.current;
      if (!c) {
        reveal();
        return () => window.clearTimeout(done);
      }

      const x = c.getContext("2d");
      if (!x) {
        reveal();
        return () => window.clearTimeout(done);
      }

      let raf = 0;
      let t = 0;
      const start = performance.now();
      let audio: AudioContext | null = null;
      const eaten = new Set<number>();
      let finalFadeStart = -1;
      const FINAL_FADE_MS = 360;

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
      addEventListener("pointerdown", unlock, { passive: true });
      addEventListener("touchstart", unlock, { passive: true });
      addEventListener("wheel", unlock, { passive: true });

      const resize = () => {
        const d = Math.min(devicePixelRatio || 1, 2);
        c.width = innerWidth * d;
        c.height = innerHeight * d;
        x.setTransform(d, 0, 0, d, 0, 0);
      };

      const drawGlassCircle = (cx: number, cy: number, r: number, mouth: number) => {
        x.save();
        x.translate(cx, cy);
        x.shadowBlur = 34;
        x.shadowColor = "rgba(19,0,186,.3)";
        const g = x.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.08, r * 0.08, r * 0.05, r * 1.15);
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
      };

      const draw = () => {
        try {
          t += 0.012;
          const elapsed = performance.now() - start;
          const p = Math.min(1, elapsed / 7600);
          const w = innerWidth;
          const h = innerHeight;
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
            const tw = 0.16 + 0.22 * (Math.sin(t * 1.2 + i) + 1);
            x.fillStyle = `rgba(19,0,186,${tw})`;
            x.beginPath();
            x.arc(sx, sy, Math.max(0.5, i % 3 === 0 ? 1.5 : 0.7), 0, Math.PI * 2);
            x.fill();
          }

          const radius = Math.min(44, Math.max(30, w * 0.035));
          const cy = h * 0.5;
          const centerX = w * 0.5;
          const pelletGap = Math.min(72, Math.max(48, w * 0.07));
          const pellets = Array.from({ length: 5 }, (_, i) => ({ x: centerX + (i - 2) * pelletGap, y: cy }));
          const move = Math.max(0, Math.min(1, (elapsed - 450) / 2100));
          const startX = pellets[0].x - radius * 2.2;
          const endX = pellets[4].x + radius * 0.72;
          const baseX = startX + (endX - startX) * move;
          let targetIndex = pellets.findIndex((_, i) => !eaten.has(i));
          if (targetIndex < 0) targetIndex = 4;
          const target = pellets[targetIndex];
          const distanceToTarget = Math.hypot(baseX - target.x, cy - target.y);
          const mouthPhase = Math.max(0, 1 - Math.min(1, distanceToTarget / 70));
          const mouth = mouthPhase > 0.02 ? Math.sin(mouthPhase * Math.PI) * 0.9 : 0;

          pellets.forEach((q, i) => {
            if (eaten.has(i)) return;
            const d = Math.hypot(baseX - q.x, cy - q.y);
            if (d < radius * 0.92) {
              eaten.add(i);
              eatSound();
            }
          });

          const allEaten = eaten.size === 5;
          if (allEaten && finalFadeStart < 0) finalFadeStart = performance.now();
          const finalFade = finalFadeStart < 0 ? 1 : Math.max(0, 1 - (performance.now() - finalFadeStart) / FINAL_FADE_MS);

          pellets.forEach((q, i) => {
            if (eaten.has(i)) return;
            x.save();
            x.shadowBlur = 18;
            x.shadowColor = "rgba(19,0,186,.55)";
            const pg = x.createRadialGradient(q.x - 3, q.y - 4, 1, q.x, q.y, 8);
            pg.addColorStop(0, "rgba(255,255,255,.98)");
            pg.addColorStop(0.32, "rgba(86,72,220,.9)");
            pg.addColorStop(1, "rgba(19,0,186,.82)");
            x.fillStyle = pg;
            x.beginPath();
            x.arc(q.x, q.y, 7, 0, Math.PI * 2);
            x.fill();
            x.restore();
          });

          x.save();
          x.globalAlpha = finalFade;
          drawGlassCircle(baseX, cy, radius, allEaten ? 0 : mouth);
          x.restore();

          if (p > 0.96) {
            const a = Math.min(1, (p - 0.96) / 0.04);
            x.fillStyle = `rgba(255,255,255,${a * 0.42})`;
            x.fillRect(0, 0, w, h);
          }

          raf = requestAnimationFrame(draw);
        } catch {
          // Any animation/rendering failure must reveal the application.
          reveal();
        }
      };

      resize();
      addEventListener("resize", resize);
      raf = requestAnimationFrame(draw);

      return () => {
        completed = true;
        window.clearTimeout(done);
        cancelAnimationFrame(raf);
        removeEventListener("resize", resize);
        removeEventListener("pointerdown", unlock);
        removeEventListener("touchstart", unlock);
        removeEventListener("wheel", unlock);
        try {
          void audio?.close();
        } catch {}
      };
    } catch {
      reveal();
      return () => window.clearTimeout(done);
    }
  }, [onDone]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!introDone) return;

    let raf = 0;
    const started = performance.now();

    const update = () => {
      const elapsed = performance.now() - started;
      setProgress(Math.min(1, elapsed / 7600));
      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [introDone]);

  return (
    <main className="min-h-[920vh] bg-[#f7f9fd] text-[#111322]">
      {!introDone && (
        <Intro onDone={() => setIntroDone(true)} />
      )}

      <div className={introDone ? "" : "opacity-0"}>
        <section className="relative min-h-screen overflow-hidden">
          <World progress={progress} />
          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-24 lg:px-10">
            <div className="max-w-3xl">
              <div className="mb-8 h-14 w-14">{LOGO}</div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#1300BA]">
                Arbyter OS
              </p>
              <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
                Orchestrate. Govern. Secure.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-black/60 sm:text-xl">
                Enterprise AI governance and orchestration for agents, tools, and execution workflows.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link className="rounded-full bg-[#1300BA] px-6 py-3 text-sm font-semibold text-white" href="/agents">
                  Explore agents
                </Link>
                <Link className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold" href="/dashboard">
                  Open dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
