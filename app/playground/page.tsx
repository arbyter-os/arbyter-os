"use client";

import { useState } from "react";

const experiments = [
  { id: "hero", label: "Hero", description: "Landing-page experiments" },
  { id: "cards", label: "Cards", description: "Glass UI components" },
  { id: "dashboard", label: "Dashboard", description: "Product interface" },
];

export default function PlaygroundPage() {
  const [active, setActive] = useState("hero");

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-black">
      <div className="sticky top-0 z-50 border-b border-black/10 bg-white/75 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="text-[11px] font-black tracking-[0.25em]">ARBYTER / PLAYGROUND</div>
            <div className="mt-1 text-xs text-black/45">Design here without touching production.</div>
          </div>
          <a href="/" className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold tracking-[0.2em] transition hover:bg-black hover:text-white">
            BACK TO SITE
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-3xl border border-black/10 bg-white/70 p-3 shadow-sm backdrop-blur-xl">
          <div className="px-3 pb-3 pt-2 text-[9px] font-bold tracking-[0.3em] text-black/35">EXPERIMENTS</div>
          {experiments.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={active === item.id ? "mb-1 w-full rounded-2xl bg-black px-3 py-3 text-left text-white transition" : "mb-1 w-full rounded-2xl px-3 py-3 text-left transition hover:bg-black/5"}
            >
              <div className="text-xs font-bold">{item.label}</div>
              <div className={active === item.id ? "mt-1 text-[10px] text-white/55" : "mt-1 text-[10px] text-black/40"}>{item.description}</div>
            </button>
          ))}
        </aside>

        <section className="min-h-[calc(100vh-150px)] overflow-hidden rounded-[32px] border border-black/10 bg-[#0a0b10] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-white">
            <div className="text-[9px] font-bold tracking-[0.3em] text-white/45">LIVE CANVAS / {active.toUpperCase()}</div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-[9px] text-white/40">SAFE PREVIEW</div>
          </div>

          <div className="flex min-h-[650px] items-center justify-center p-8">
            {active === "hero" && (
              <div className="relative w-full max-w-4xl overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_center,#252a3a_0%,#0a0b10_55%,#020204_100%)] px-8 py-24 text-center text-white md:px-16">
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:60px_60px]" />
                <div className="relative">
                  <div className="mx-auto mb-8 h-20 w-20 rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl" />
                  <div className="text-[9px] font-bold tracking-[0.4em] text-white/40">ARBYTER OS</div>
                  <h1 className="mt-5 text-5xl font-black tracking-[-0.06em] md:text-8xl">DESIGN<br />WITHOUT RISK.</h1>
                  <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-white/45">This canvas is yours. Edit this file and refresh to see your UI before it reaches production.</p>
                </div>
              </div>
            )}

            {active === "cards" && (
              <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
                {["Governance", "Control", "Visibility"].map((title) => (
                  <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white backdrop-blur-2xl">
                    <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10" />
                    <div className="mt-16 text-xl font-bold">{title}</div>
                    <p className="mt-3 text-xs leading-5 text-white/40">Experiment with spacing, typography, glass, motion and interaction here.</p>
                  </div>
                ))}
              </div>
            )}

            {active === "dashboard" && (
              <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-white/[0.06] p-6 text-white backdrop-blur-2xl">
                <div className="text-[9px] tracking-[0.3em] text-white/35">WORKFORCE OVERVIEW</div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {["ACTIVE AGENTS", "POLICIES", "RISK EVENTS"].map((label, i) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="text-[9px] text-white/35">{label}</div>
                      <div className="mt-3 text-4xl font-black">{[24, 18, 3][i]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
