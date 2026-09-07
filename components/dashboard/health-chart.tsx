'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import type { TrendPoint } from '@/lib/types'

type SeriesKey = keyof Omit<TrendPoint, 'date'>

const series: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'compliancePosture', label: 'Compliance posture', color: 'var(--chart-1)' },
  { key: 'controlCoverage', label: 'Control coverage', color: 'var(--chart-2)' },
  { key: 'riskExposure', label: 'Risk exposure', color: 'var(--chart-3)' },
]

const W = 760
const H = 280
const PAD = { top: 16, right: 16, bottom: 28, left: 32 }
const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom

function x(i: number, n: number) {
  return PAD.left + (i * innerW) / (n - 1)
}
function y(v: number) {
  return PAD.top + (1 - v / 100) * innerH
}

/** Catmull-Rom → cubic bezier for smooth, non-overshooting curves. */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

export function HealthChart({ data }: { data: TrendPoint[] }) {
  const [active, setActive] = React.useState<number | null>(null)
  const n = data.length

  const points = React.useMemo(
    () =>
      series.map((s) => ({
        ...s,
        coords: data.map((d, i) => [x(i, n), y(d[s.key])] as [number, number]),
      })),
    [data, n],
  )

  const gridLines = [0, 25, 50, 75, 100]

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const idx = Math.round(ratio * (n - 1))
    setActive(Math.max(0, Math.min(n - 1, idx)))
  }

  return (
    <div>
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="AI risk and control health trend over the last 12 weeks"
          onPointerMove={handleMove}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id="area-primary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* horizontal grid */}
          {gridLines.map((g) => (
            <g key={g}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(g)}
                y2={y(g)}
                stroke="var(--border)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={PAD.left - 8}
                y={y(g) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {g}
              </text>
            </g>
          ))}

          {/* x labels (every other week) */}
          {data.map((d, i) =>
            i % 2 === 0 ? (
              <text
                key={d.date}
                x={x(i, n)}
                y={H - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {d.date}
              </text>
            ) : null,
          )}

          {/* primary area */}
          <path
            d={`${smoothPath(points[0].coords)} L ${x(n - 1, n)} ${
              PAD.top + innerH
            } L ${PAD.left} ${PAD.top + innerH} Z`}
            fill="url(#area-primary)"
          />

          {/* lines */}
          {points.map((s) => (
            <path
              key={s.key}
              d={smoothPath(s.coords)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* active guide + markers */}
          {active !== null ? (
            <>
              <line
                x1={x(active, n)}
                x2={x(active, n)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="var(--muted-foreground)"
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              {points.map((s) => (
                <circle
                  key={s.key}
                  cx={x(active, n)}
                  cy={y(data[active][s.key])}
                  r={3.5}
                  fill="var(--card)"
                  stroke={s.color}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </>
          ) : null}
        </svg>

        {/* Tooltip */}
        {active !== null ? (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg shadow-black/5"
            style={{ left: `${(x(active, n) / W) * 100}%` }}
          >
            <p className="mb-1.5 font-medium text-foreground">
              {data[active].date}
            </p>
            <div className="flex flex-col gap-1">
              {series.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto font-medium tabular-nums text-foreground">
                    {data[active][s.key]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className={cn('h-0.5 w-4 rounded-full')}
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
