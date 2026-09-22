"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const BLUE = "#1300BA";

const LOGO = (
  <div className="h-full w-full overflow-hidden rounded-[6px] bg-black">
    <img src="/arbyter-logo.svg" alt="Arbyter" className="h-full w-full object-contain" />
  </div>
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
  const audioStarted = useRef(false);

  useEffect(() => {
    let finished = false;
    let raf = 0;
    let audioContext: AudioContext | null = null;
    let audioTimer: number | null = null;

    const reveal = () => {
      if (finished) return;
      finished = true;
      if (audioTimer) window.clearInterval(audioTimer);
      if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
      }
      onDone();
    };

    const startMatrixSound = () => {
      if (audioStarted.current || finished) return;
      audioStarted.current = true;
      try {
        const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        audioContext = new AudioCtx();
        const ctx = audioContext;
        if (ctx.state === "suspended") void ctx.resume();

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.45);
        master.connect(ctx.destination);

        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.28;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1800;
        filter.Q.value = 0.55;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.11;
        noise.connect(filter).connect(noiseGain).connect(master);
        noise.start();

        audioTimer = window.setInterval(() => {
          if (!audioContext || audioContext.state !== "running") return;
          const now = audioContext.currentTime;
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(980 + Math.random() * 1200, now);
          osc.frequency.exponentialRampToValueAtTime(320 + Math.random() * 260, now + 0.08);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.035 + Math.random() * 0.035, now + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
          osc.connect(gain).connect(master);
          osc.start(now);
          osc.stop(now + 0.12);
        }, 85);
      } catch {
        // Audio is optional; visual intro must continue.
      }
    };

    const fallback = window.setTimeout(reveal, 5600);
    const beginAudio = () => startMatrixSound();
    window.addEventListener("pointerdown", beginAudio, { once: true, passive: true });
    window.addEventListener("touchstart", beginAudio, { once: true, passive: true });
    window.addEventListener("keydown", beginAudio, { once: true });

    const c = ref.current;
    const x = c?.getContext("2d");
    if (!c || !x) {
      reveal();
      return () => window.clearTimeout(fallback);
    }

    type RainColumn = {
      x: number;
      y: number;
      speed: number;
      length: number;
      size: number;
      phase: number;
      chars: string[];
    };

    const chars = "01";
    let columns: RainColumn[] = [];

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * d;
      c.height = window.innerHeight * d;
      x.setTransform(d, 0, 0, d, 0, 0);

      const count = Math.ceil(window.innerWidth / 15);
      columns = Array.from({ length: count }, (_, i) => ({
        x: i * 15 + Math.random() * 7,
        y: Math.random() * window.innerHeight,
        speed: 2.2 + Math.random() * 5.5,
        length: 9 + Math.floor(Math.random() * 22),
        size: 11 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
        chars: Array.from({ length: 34 }, () => chars[Math.floor(Math.random() * chars.length)]),
      }));
    };

    const startTime = performance.now();

    const draw = () => {
      const elapsed = performance.now();
      const revealP = Math.min(1, Math.max(0, (elapsed - startTime) / 5200));
      const w = window.innerWidth;
      const h = window.innerHeight;

      x.fillStyle = "rgba(0,0,0,0.30)";
      x.fillRect(0, 0, w, h);

      const glow = x.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      glow.addColorStop(0, "rgba(19,0,186,0.14)");
      glow.addColorStop(0.38, "rgba(19,0,186,0.035)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = glow;
      x.fillRect(0, 0, w, h);

      x.textAlign = "center";
      x.textBaseline = "middle";

      columns.forEach((col) => {
        col.y += col.speed;
        if (col.y - col.length * col.size > h + 80) {
          col.y = -Math.random() * h * 0.8;
          col.speed = 2.2 + Math.random() * 5.5;
        }

        for (let j = 0; j < col.length; j++) {
          const yy = col.y - j * col.size;
          if (yy < -30 || yy > h + 30) continue;
          const fade = 1 - j / col.length;
          const flicker = 0.72 + 0.28 * Math.sin(elapsed * 0.006 + col.phase + j);
          const head = j === 0;
          x.font = (head ? "600 " : "400 ") + col.size + "px ui-monospace, SFMono-Regular, Menlo, monospace";
          x.fillStyle = head
            ? "rgba(255,255,255," + (0.92 * flicker) + ")"
            : "rgba(96,82,255," + Math.max(0.035, fade * 0.38 * flicker) + ")";
          x.fillText(col.chars[j % col.chars.length], col.x, yy);
        }
      });

      const word = "ARBYTER";
      const fontSize = Math.min(92, Math.max(44, w * 0.095));
      const letterGap = fontSize * 0.82;
      const total = (word.length - 1) * letterGap;
      const sx = w / 2 - total / 2;
      const cy = h / 2;

      x.save();
      x.font = "800 " + fontSize + "px ui-monospace, SFMono-Regular, Menlo, monospace";
      x.textAlign = "center";
      x.textBaseline = "middle";

      const off = document.createElement("canvas");
      off.width = Math.ceil(w);
      off.height = Math.ceil(h);
      const ox = off.getContext("2d");
      if (ox) {
        ox.font = "800 " + fontSize + "px ui-monospace, SFMono-Regular, Menlo, monospace";
        ox.textAlign = "center";
        ox.textBaseline = "middle";
        ox.fillStyle = "#fff";
        ox.fillText(word, w / 2, cy);

        const image = ox.getImageData(
          Math.max(0, Math.floor(w / 2 - total / 2 - fontSize)),
          Math.max(0, Math.floor(cy - fontSize)),
          Math.min(w, Math.ceil(total + fontSize * 2)),
          Math.min(h, Math.ceil(fontSize * 2.2))
        );
        const particles = Math.min(700, Math.floor(image.data.length / 16));
        for (let i = 0; i < particles; i++) {
          const idx = Math.floor(Math.random() * (image.data.length / 4)) * 4;
          if (image.data[idx + 3] < 180) continue;
          const local = idx / 4;
          const iw = image.width;
          const px = (local % iw) + Math.max(0, Math.floor(w / 2 - total / 2 - fontSize));
          const py = Math.floor(local / iw) + Math.max(0, Math.floor(cy - fontSize));
          const settle = Math.min(1, Math.max(0, (revealP - 0.30) / 0.52));
          const sourceY = py - (1 - settle) * (80 + Math.random() * 260);
          x.fillStyle = "rgba(255,255,255," + (0.18 + settle * 0.62) + ")";
          x.fillText(Math.random() > 0.5 ? "0" : "1", px, sourceY);
        }
      }
      x.restore();

      const wordOpacity = Math.max(0, Math.min(1, (revealP - 0.62) / 0.30));
      if (wordOpacity > 0) {
        x.save();
        x.globalAlpha = wordOpacity * 0.92;
        x.font = "800 " + fontSize + "px ui-monospace, SFMono-Regular, Menlo, monospace";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.shadowBlur = 34;
        x.shadowColor = "rgba(19,0,186,.75)";
        const gradient = x.createLinearGradient(sx, cy, sx + total, cy);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.5, "#dcd8ff");
        gradient.addColorStop(1, "#7b6cff");
        x.fillStyle = gradient;
        x.fillText(word, w / 2, cy);
        x.restore();
      }

      if (revealP > 0.86) {
        const fade = (revealP - 0.86) / 0.14;
        x.fillStyle = "rgba(0,0,0," + (fade * 0.9) + ")";
        x.fillRect(0, 0, w, h);
      }

      if (revealP >= 1) reveal();
      else raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.clearTimeout(fallback);
      if (audioTimer) window.clearInterval(audioTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", beginAudio);
      window.removeEventListener("touchstart", beginAudio);
      window.removeEventListener("keydown", beginAudio);
      if (audioContext) audioContext.close().catch(() => {});
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[999] bg-black" aria-hidden="true">
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
