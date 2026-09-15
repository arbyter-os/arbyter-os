"use client";

import { useEffect, useState } from "react";

type IntroProps = {
  onComplete?: () => void;
};

export default function Intro({ onComplete }: IntroProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 1800);

    const completeTimer = window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2300);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Arbyter mark */}
        <div
          className={`relative flex h-20 w-20 items-center justify-center transition-all duration-700 ${
            exiting
              ? "scale-95 opacity-0"
              : "scale-100 opacity-100"
          }`}
        >
          <span
            className="font-sans text-[72px] font-black leading-none tracking-[-0.12em] text-black"
            aria-hidden="true"
          >
            A
          </span>

          {/* Blue control point */}
          <span
            className="absolute right-[3px] top-[8px] h-3 w-3 rounded-full bg-[#1677ff]"
            aria-hidden="true"
          />
        </div>

        {/* Wordmark */}
        <div
          className={`mt-5 text-[13px] font-medium uppercase tracking-[0.42em] text-black transition-all duration-700 ${
            exiting
              ? "translate-y-2 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          ARBYTER
        </div>

        {/* Tagline */}
        <div
          className={`mt-3 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400 transition-all duration-700 ${
            exiting
              ? "translate-y-2 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          ORCHESTRATE · GOVERN · SECURE
        </div>
      </div>
    </div>
  );
}