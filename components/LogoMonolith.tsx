"use client";

interface LogoMonolithProps {
  className?: string;
  glow?: boolean;
}

export default function LogoMonolith({
  className = "h-20 w-20",
  glow = true,
}: LogoMonolithProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 1000 1000"
        className="h-full w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {glow && (
            <filter id="monolithGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="36" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        <g transform="translate(500, 500) scale(1.5) translate(-500, -489)">
          <path
            filter={glow ? "url(#monolithGlow)" : undefined}
            fill="#FFFFFF"
            fillRule="evenodd"
            d="
              M 430,348
              C 465,355 535,355 570,348
              C 564,385 556,425 554,465
              C 552,515 570,580 604,630
              Q 552,624 500,630
              Q 448,624 396,630
              C 430,580 448,515 446,465
              C 444,425 436,385 430,348
              Z
              M 500,630
              C 490,575 478,520 473,465
              C 468,420 464,398 466,388
              C 468,381 474,380 479,384
              C 487,390 510,420 523,460
              C 531,485 522,555 500,630
              Z
            "
          />
        </g>
      </svg>
    </div>
  );
}
