"use client";

interface LogoProps {
  className?: string;
  glow?: boolean;
}

export function LogoMonolith({ className = "h-12", glow = true }: LogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 scale-150 rounded-full bg-white/20 blur-xl"
          aria-hidden="true"
        />
      )}

      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-full w-auto drop-shadow-[0_0_12px_rgba(255,255,255,0.85)]"
      >
        <path
          d="M 46 16 C 34 18, 22 17, 16 15 C 27 50, 26 72, 10 105 C 22 103, 34 102, 46 104 C 33 65, 33 55, 46 16 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 54 16 C 66 18, 78 17, 84 15 C 73 50, 74 72, 90 105 C 78 103, 66 102, 54 104 C 67 65, 67 55, 54 16 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}
