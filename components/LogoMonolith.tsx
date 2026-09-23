"use client";

interface LogoProps {
  className?: string;
  glow?: boolean;
}

export default function LogoMonolith({
  className = "h-12",
  glow = true,
}: LogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 scale-150 rounded-full bg-white/20 blur-xl"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 500 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-full w-auto"
        style={{
          filter:
            "drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 8px rgba(255,255,255,0.95)) drop-shadow(0 0 22px rgba(255,255,255,0.6)) drop-shadow(0 0 45px rgba(255,255,255,0.3))",
        }}
      >
        <path
          d="M 185 170 Q 250 178 315 170 C 310 230 306 280 320 330 C 330 370 348 400 365 430 Q 335 428 305 430 C 292 350 274 212 250 212 C 226 212 208 350 195 430 Q 165 428 135 430 C 152 400 170 370 180 330 C 194 280 190 230 185 170 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
